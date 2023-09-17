import React, { createContext, useCallback, useMemo } from 'react'
import { MidiSynth } from '../midi-player'
import { read } from 'midifile-ts'

const MidiPlayerContext = createContext<{
  synth: MidiSynth | undefined
  loadMidi: (url: string) => Promise<void>
  progress: number
} | null>(null)

const Provider = ({ children }: { children: React.ReactNode }) => {
  //   const [isReady, setIsReady] = React.useState<string>()
  const [synth, setSynth] = React.useState<MidiSynth>()
  const [progress, setProgress] = React.useState<number>(0)

  const load = async () => {
    const synth = new MidiSynth({
      onProgress: (progress) => {
        setProgress(progress)
      },
    })
    await synth.setup()
    await synth.loadSoundFont()
    setSynth(synth)
  }

  const loadMidi = useCallback(
    async (url: string) => {
      if (!synth) return
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const midi = read(arrayBuffer)
      synth?.loadMIDI(midi)
    },
    [synth]
  )

  React.useEffect(() => {
    load()
    return () => {
      synth?.unloadMidi()
      synth?.kill()
    }
  }, [])

  const values = useMemo(() => {
    return {
      synth,
      loadMidi,
      progress,
    }
  }, [synth, loadMidi, progress])

  return (
    <MidiPlayerContext.Provider value={values}>
      {children}
    </MidiPlayerContext.Provider>
  )
}

const useMidiPlayerContext = () => {
  const midiPlayerContext = React.useContext(MidiPlayerContext)
  if (!midiPlayerContext) {
    throw new Error('useMidiPlayer has to be used within <MidiPlayerProvider>')
  }
  return midiPlayerContext
}

const MidiPlayer = {
  Provider,
  useMidiPlayerContext,
}

export default MidiPlayer
