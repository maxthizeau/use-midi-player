/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { MidiSynth } from '../midi-player'
import { read } from 'midifile-ts'

type Props = {
  url?: string
}

const useSingleMidiPlayer = ({ url }: Props) => {
  const [synth, setSynth] = useState<MidiSynth>()
  const load = async () => {
    const synth = new MidiSynth({
      onProgress: (progress) => {
        console.log('progress : ', progress)
      },
    })
    await synth.setup()
    await synth.loadSoundFont()
    setSynth(synth)
  }

  const loadMidi = async (url: string) => {
    if (!synth) return
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const midi = read(arrayBuffer)
    console.log('midi : ', midi)
    synth?.loadMIDI(midi)
  }

  useEffect(() => {
    if (url && synth) {
      loadMidi(url)
    }
  }, [url, synth])

  useEffect(() => {
    load()
    return () => {
      synth?.unloadMidi()
      synth?.kill()
    }
  }, [])

  return {
    synth,
    loadMidi,
  }
}

export default useSingleMidiPlayer
