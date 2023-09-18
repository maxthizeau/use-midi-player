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

export type PlayerState = {
  isPlaying: boolean
  isPaused: boolean
  isStarted: boolean
  progression: number
  duration?: {
    full: number
    current: number
  }
  volume: {
    min: number
    max: number
    value: number
  }
}

const MinVolume = -1
const MaxVolume = 0

export class MidiSynth {
  private context: AudioContext
  private midiPlayer: MIDIPlayer | null
  private synth: AudioWorkletNode | null
  private soundFontData: ArrayBuffer | null = null
  public progression: number = 0
  private midi: MidiFile | null = null
  private volume: GainNode | null = null
  private onProgress?: (progress: number) => void
  private onEnd?: () => void
  private onChange?: (state: PlayerState) => void

  // private tracks = new Map<
  //   number,
  //   {
  //     name?: string
  //     muted: boolean
  //     volume: number
  //   }
  // >()

  constructor({
    onProgress,
    onEnd,
    onChange,
  }: {
    onProgress?: (progress: number) => void
    onEnd?: () => void
    onChange?: (state: PlayerState) => void
  } = {}) {
    this.context = new AudioContext()
    this.midiPlayer = null
    this.synth = null
    this.onProgress = onProgress
    this.onEnd = onEnd
    this.onChange = onChange
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

    this.volume = this.context.createGain()
    this.volume.connect(this.context.destination)
    this.synth.connect(this.context.destination)
    this.synth.connect(this.volume)
  }

  public unloadMidi = () => {
    this.midiPlayer?.pause()
    this.midiPlayer = null
    this.midi = null
    this.triggerChange()
  }

  postSynthMessage = (e: SynthEvent, transfer?: Transferable[]) => {
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
    this.triggerChange()
  }

  updateChangeCallback = (onChange: (state: PlayerState) => void) => {
    this.onChange = onChange
  }

  jump = (percent: number) => {
    this.midiPlayer?.seek(percent)
    this.triggerChange()
  }

  stop = () => {
    this.midiPlayer?.stop()
    this.triggerChange()
  }

  pause = () => {
    this.midiPlayer?.pause()
    this.triggerChange()
  }

  play = () => {
    this.context.resume()
    this.midiPlayer?.resume()
    this.triggerChange()
  }

  kill = () => {
    this.midiPlayer?.stop()
    this.context.close()
    this.triggerChange()
  }

  setVolume = (volume: number) => {
    if (!this.volume) return
    if (volume < MinVolume) volume = MinVolume
    if (volume > MaxVolume) volume = MaxVolume

    this.volume.gain.value = volume
    this.triggerChange()
    // this.volume?.gain.setValueAtTime(volume, this.context.currentTime)
  }

  getVolume = () => {
    return {
      min: MinVolume,
      max: MaxVolume,
      value: this.volume?.gain.value ?? 0,
    }
  }

  private triggerChange = () => {
    this.onChange?.(this.getPlayerState())
  }

  getPlayerState = () => {
    return {
      isPlaying: this.midiPlayer?.IsPlaying ?? false,
      isPaused:
        (this.midiPlayer?.IsStarted && !this.midiPlayer?.IsPlaying) ?? false,
      isStarted: this.midiPlayer?.IsStarted ?? false,
      progression: this.progression,
      duration: this.midiPlayer?.getSongsDuration(),
      volume: this.getVolume(),
    }
  }
}
