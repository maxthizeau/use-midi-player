# useMidiPlayer : React Hook and Context to play midi files

Before all, all credits goes to [@ryohey](https://github.com/ryohey) for his [wavelet](https://github.com/ryohey/wavelet library that I used to create this hook. You should check his work on [Signal](https://github.com/ryohey/signal), it's really cool.

This hook allow you to play midi files in your react app. It use the [midifile-ts](https://www.npmjs.com/package/midifile-ts) library to parse the midi file and [wavelet](https://github.com/ryohey/wavelet) to play it.

## Installation

```bash
npm install @maximethizeau/use-midi-player
```

## Usage

You can use one of the following methods to play a midi file:

- useSingleMidiPlayer hook

```tsx
const LoadByHook: React.FC<Props> = () => {
  const { synth } = useMidiPlayer({
    url: 'Numb.mid',
  })
  return (
    <>
      <button id="button-play" onClick={synth?.play}>
        Play
      </button>
      <button id="button-pause" onClick={synth?.pause}>
        Pause
      </button>
      <button id="button-pause" onClick={synth?.stop}>
        Stop
      </button>
    </>
  )
}
```

- useMidiPlayerContext hook

```tsx
const LoadByContext: React.FC<Props> = () => {
  const { synth } = useMidiPlayerContext()

  useEffect(() => {
    if (!synth) return
    synth?.load('Numb.mid')
  }, [synth])

  return (
    <>
      <button id="button-play" onClick={synth?.play}>
        Play
      </button>
      <button id="button-pause" onClick={synth?.pause}>
        Pause
      </button>
      <button id="button-pause" onClick={synth?.stop}>
        Stop
      </button>
    </>
  )
}

const App: React.FC<Props> = () => {
  return (
    <MidiPlayerProvider>
      <LoadByContext />
    </MidiPlayerProvider>
  )
}
```

- MidiPlayerExample component

```tsx
const App: React.FC<Props> = () => {
  // Simple component that allow you to upload a midi file and play it
  return <MidiPlayerExample url="Numb.mid" />
}
```
