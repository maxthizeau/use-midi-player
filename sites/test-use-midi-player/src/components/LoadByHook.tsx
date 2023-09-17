import React from 'react'
import { useMidiPlayer } from 'use-midi-player'

type Props = unknown

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
      <button
        id="button-jump"
        onClick={() => {
          synth?.jump(Math.max(synth.progression - 0.1, 0))
        }}
      >
        -10%
      </button>
      <button
        id="button-jump-10"
        onClick={() => {
          synth?.jump(synth.progression + 0.1)
        }}
      >
        +10%
      </button>
      <button onClick={synth?.kill}>Kill</button>

      {/* <MyButton /> */}
      {/* <MidiPlayerExample /> */}
    </>
  )
}

export default LoadByHook
