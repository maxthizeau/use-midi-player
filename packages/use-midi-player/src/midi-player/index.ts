/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSamplesFromSoundFont, SynthEvent } from '@ryohey/wavelet'

import { MidiFile } from 'midifile-ts'
import { MIDIPlayer } from './MidiPlayer'
import soundFontUrl from '../soundfonts/A320U.sf2?url'

export type Track = {
  muted: boolean
  volume: number
  name?: string
}

export class MidiSynth {
  private context: AudioContext
  private midiPlayer: MIDIPlayer | null
  private synth: AudioWorkletNode | null
  private soundFontData: ArrayBuffer | null = null
  public progression: number = 0
  private midi: MidiFile | null = null

  private onProgress?: (progress: number) => void
  private onEnd?: () => void
  private onTrackChange?: (index: number, track: Track) => void

  // private tracks = new Set<number>()
  private tracks = new Map<
    number,
    {
      name?: string
      muted: boolean
      volume: number
    }
  >()

  constructor({
    onProgress,
    onEnd,
    onTrackChange,
  }: {
    onProgress?: (progress: number) => void
    onEnd?: () => void
    onTrackChange?: (index: number, track: Track) => void
  } = {}) {
    this.context = new AudioContext()
    this.midiPlayer = null
    this.synth = null
    this.onProgress = onProgress
    this.onEnd = onEnd
    this.onTrackChange = onTrackChange
  }

  public getTrack = (track: number) => {
    return this.tracks.get(track)
  }

  public kill = () => {
    console.log('kill')
    this.midiPlayer?.stop()
    this.context.close()
  }

  private updateTrack = (trackNumber: number, newTrack: Partial<Track>) => {
    const currentTrack = this.getTrack(trackNumber)
    if (
      !currentTrack &&
      newTrack.volume === undefined &&
      newTrack.muted === undefined
    ) {
      return
    }

    const updated = {
      ...currentTrack,
      ...newTrack,
    }
    if (updated.volume === undefined || updated.muted === undefined) {
      updated.volume = 100
      updated.muted = false
    }
    // if (!currentTrack) {
    //   return
    // }
    this.tracks.set(trackNumber, {
      volume: updated.volume,
      muted: updated.muted,
      name: updated.name ?? currentTrack?.name,
    })

    const trackUpdated = this.getTrack(trackNumber)
    if (!trackUpdated) {
      return
    }
    this.onTrackChange?.(trackNumber, trackUpdated)
  }

  public get MidiPlayer() {
    return this.midiPlayer
  }

  public get Midi() {
    return this.midi
  }

  public get Progression() {
    return this.progression
  }

  public get Tracks() {
    return this.tracks
  }

  // public setVolume = (number: number) => {
  //   this.synth?.port.postMessage({
  //     type: 'volume',
  //     volume: number,
  //   })
  // }

  public setup = async () => {
    const url = new URL('@ryohey/wavelet/dist/processor.js', import.meta.url)
    try {
      await this.context.audioWorklet.addModule(url)
    } catch (e) {
      console.error('Failed to add AudioWorklet module', e)
    }
    this.synth = new AudioWorkletNode(this.context, 'synth-processor', {
      numberOfInputs: 0,
      outputChannelCount: [2],
    } as any)
    this.synth.connect(this.context.destination)
  }

  public muteTrack = (track: number) => {
    const muted = this.tracks.get(track)?.muted
    if (muted) {
      this.MidiPlayer?.unmuteTrack(track)
      this.updateTrack(track, {
        muted: false,
        volume: this.tracks.get(track)?.volume ?? 1,
      })
      return
    }
    this.MidiPlayer?.muteTrack(track)
    this.updateTrack(track, {
      muted: true,
      volume: this.tracks.get(track)?.volume ?? 1,
    })
  }

  public unloadMidi = () => {
    this.midiPlayer?.pause()
    this.midiPlayer = null
    this.midi = null
  }

  postSynthMessage = (e: SynthEvent, transfer?: Transferable[]) => {
    if (
      e.type === 'midi' &&
      e.midi.type === 'channel' &&
      e.midi.subtype === 'noteOn' &&
      !this.tracks.has(e.midi.channel)
    ) {
      this.updateTrack(e.midi.channel, {
        muted: false,
        volume: 1,
      })
    }
    this.synth?.port.postMessage(e, transfer ?? [])
  }

  loadSoundFont = async () => {
    this.soundFontData = await (await fetch(soundFontUrl)).arrayBuffer()
    const parsed = getSamplesFromSoundFont(
      new Uint8Array(this.soundFontData),
      this.context
    )

    for (const sample of parsed) {
      this.postSynthMessage(
        sample,
        [sample.sample.buffer] // transfer instead of copy
      )
    }
  }

  loadMIDI = (midi: MidiFile) => {
    this.midiPlayer?.pause()
    this.context.resume()

    this.midiPlayer = new MIDIPlayer(
      midi,
      this.context.sampleRate,
      this.postSynthMessage
    )

    this.midi = midi
    this.midiPlayer.onProgress = (progress) => {
      this.progression = progress
      this.onProgress?.(progress)
      if (progress >= 1) {
        this.onEnd?.()
      }
    }

    console.log('MIDI loaded', midi)
  }
  jump = (percent: number) => {
    this.midiPlayer?.seek(percent)
  }

  stop = () => {
    this.midiPlayer?.stop()
  }

  pause = () => {
    this.midiPlayer?.pause()
  }

  play = () => {
    this.context.resume()
    this.midiPlayer?.resume()
  }
}
