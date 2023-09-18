import { SynthEvent } from '@ryohey/wavelet'
import {
  AnyEvent,
  EndOfTrackEvent,
  MIDIControlEvents,
  MidiFile,
} from 'midifile-ts'
import EventScheduler from './EventScheduler'

interface Tick {
  tick: number
  track: number
}

function addTick(events: AnyEvent[], track: number): (AnyEvent & Tick)[] {
  let tick = 0
  return events.map((e) => {
    tick += e.deltaTime
    return { ...e, tick, track }
  })
}

export const isEndOfTrackEvent = (e: AnyEvent): e is EndOfTrackEvent =>
  'subtype' in e && e.subtype === 'endOfTrack'

const TIMER_INTERVAL = 100
const LOOK_AHEAD_TIME = 50

export class MIDIPlayer {
  private output: (e: SynthEvent) => void
  private tempo = 120
  private interval: number | undefined
  private midi: MidiFile
  private sampleRate: number
  private tickedEvents: (AnyEvent & Tick)[]
  private scheduler: EventScheduler<AnyEvent & Tick>
  public endOfSong: number
  public tracks = new Set<number>()
  private isPlaying = false
  private isStarted = false

  onProgress?: (progress: number) => void

  constructor(
    midi: MidiFile,
    sampleRate: number,
    output: (e: SynthEvent) => void
  ) {
    this.midi = midi
    this.sampleRate = sampleRate
    this.output = output
    this.tickedEvents = midi.tracks
      .flatMap(addTick)
      .sort((a, b) => a.tick - b.tick)
    this.scheduler = new EventScheduler(
      this.tickedEvents,
      0,
      this.midi.header.ticksPerBeat,
      TIMER_INTERVAL + LOOK_AHEAD_TIME
    )
    this.endOfSong = Math.max(
      ...this.tickedEvents.filter(isEndOfTrackEvent).map((e) => e.tick)
    )

    this.resetControllers()
  }

  public get IsStarted() {
    return this.isStarted
  }

  public get IsPlaying() {
    return this.isPlaying
  }

  resume() {
    if (this.interval === undefined) {
      this.isPlaying = true
      this.isStarted = true
      this.interval = window.setInterval(() => this.onTimer(), TIMER_INTERVAL)
    }
  }

  getSongsDuration() {
    //  (tick / (timebase / 60) / bpm) * 1000
    return {
      // full: this.endOfSong / (this.midi.header.ticksPerBeat / 60),
      full:
        (this.endOfSong / (this.midi.header.ticksPerBeat / 60) / this.tempo) *
        1000,
      current:
        (this.scheduler.currentTick /
          (this.midi.header.ticksPerBeat / 60) /
          this.tempo) *
        1000,
      // this.scheduler.currentTick / (this.midi.header.ticksPerBeat / 60),
    }
  }

  pause() {
    clearInterval(this.interval)
    this.interval = undefined
    this.isPlaying = false
    this.allSoundsOff()
  }

  stop() {
    this.pause()
    this.isStarted = false
    this.resetControllers()
    this.scheduler.seek(0)
    this.onProgress?.(0)
  }

  // 0: start, 1: end
  seek(position: number) {
    this.allSoundsOff()
    this.scheduler.seek(position * this.endOfSong)
  }

  private allSoundsOff() {
    for (let i = 0; i < 16; i++) {
      this.output({
        type: 'midi',
        midi: {
          type: 'channel',
          subtype: 'controller',
          controllerType: MIDIControlEvents.ALL_SOUNDS_OFF,
          channel: i,
          value: 0,
        },
        delayTime: 0,
      })
    }
  }

  private resetControllers() {
    for (let i = 0; i < 16; i++) {
      this.output({
        type: 'midi',
        midi: {
          type: 'channel',
          subtype: 'controller',
          controllerType: MIDIControlEvents.RESET_CONTROLLERS,
          channel: i,
          value: 0,
        },
        delayTime: 0,
      })
    }
  }

  public getTracks() {
    return this.tracks
  }

  public muteTrack(track: number) {
    this.output({
      type: 'midi',
      midi: {
        type: 'channel',
        subtype: 'controller',

        controllerType: MIDIControlEvents.MSB_MAIN_VOLUME,
        channel: track,
        value: 0,
      },
      delayTime: 0,
    })
  }

  public unmuteTrack(track: number) {
    this.output({
      type: 'midi',
      midi: {
        type: 'channel',
        subtype: 'controller',
        controllerType: MIDIControlEvents.RESET_CONTROLLERS,
        channel: track,
        value: 0,
      },
      delayTime: 0,
    })
  }

  private onTimer() {
    const now = performance.now()
    const events = this.scheduler.readNextEvents(this.tempo, now)

    // Send Channel Event to MIDI OUTPUT
    events.forEach(({ event, timestamp }) => {
      const delayTime = ((timestamp - now) / 1000) * this.sampleRate
      const synthEvent = this.handleEvent(event, delayTime)
      if (synthEvent !== null) {
        this.output(synthEvent)
      }
    })

    if (this.scheduler.currentTick >= this.endOfSong) {
      clearInterval(this.interval)
      this.interval = undefined
    }

    this.onProgress?.(this.scheduler.currentTick / this.endOfSong)
  }

  private handleEvent(
    e: AnyEvent & Tick,
    delayTime: number
  ): SynthEvent | null {
    // console.log('handleEvent')
    // console.log(e)
    switch (e.type) {
      case 'channel':
        return {
          type: 'midi',
          midi: e,
          delayTime,
        }

      case 'meta':
        switch (e.subtype) {
          case 'setTempo':
            this.tempo = (60 * 1000000) / e.microsecondsPerBeat
            break
          default:
            // console.warn(`not supported meta event`, e)
            break
        }
        break
      default:
        // console.warn(`not supported event`, e)
        break
    }
    return null
  }
}
