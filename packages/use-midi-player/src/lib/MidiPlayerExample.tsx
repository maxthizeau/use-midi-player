/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useEffect, useState } from 'react'
import { MidiSynth } from '../midi-player'
import { read } from 'midifile-ts'
// import { MIDIPlayer } from '../midi-player/MidiPlayer'

interface IProps {}

const MidiPlayerExample: FC<IProps> = () => {
  const [synth, setSynth] = useState<MidiSynth>()
  const load = async () => {
    const synth = new MidiSynth({
      onProgress: (progress) => {
        console.log('progress : ', progress)
        console.log(synth.getPlayerState())
      },
    })
    await synth.setup()
    await synth.loadSoundFont()
    setSynth(synth)
  }

  useEffect(() => {
    load()
  }, [])

  if (!synth) return null
  return (
    <>
      <input
        id="open"
        type="file"
        accept=".mid,.midi"
        onChange={(e) => {
          console.log(e.currentTarget.files?.[0])
          const input = e.currentTarget as HTMLInputElement
          const reader = new FileReader()
          reader.onload = async () => {
            const midi = read(reader.result as ArrayBuffer)
            synth.loadMIDI(midi)
          }
          const file = input.files?.[0]
          reader.readAsArrayBuffer(file!)
        }}
      />
      <div>
        <button id="button-play" onClick={synth.play}>
          Play
        </button>
        <button id="button-pause" onClick={synth.pause}>
          Pause
        </button>
        <button id="button-pause" onClick={synth.stop}>
          Stop
        </button>
        <button
          id="button-jump"
          onClick={() => {
            synth.jump(Math.max(synth.progression - 0.1, 0))
          }}
        >
          -10%
        </button>
        <button
          id="button-jump"
          onClick={() => {
            synth.jump(synth.progression + 0.1)
          }}
        >
          +10%
        </button>
        {}
      </div>
      <div>
        <button
          id="button-volume-down"
          onClick={() => {
            synth.setVolume(synth.getVolume().value - 0.5)
          }}
        >
          Volume Down
        </button>
        <button
          id="button-volume-up"
          onClick={() => {
            synth.setVolume(synth.getVolume().value + 0.5)
          }}
        >
          Volume Up
        </button>
      </div>
    </>
  )
}

export default MidiPlayerExample
