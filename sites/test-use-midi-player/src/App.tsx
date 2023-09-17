import { useState } from 'react'
import './App.css'
import LoadByHook from './components/LoadByHook'
import ExampleMidiUpload from './components/ExampleMidiUpload'

function App() {
  const [view, setView] = useState<'upload' | 'hook' | 'unmount'>('upload')
  return (
    <div>
      <div style={{ marginBottom: '4rem' }}>
        <button
          onClick={() => setView('upload')}
          style={{
            marginRight: '1rem',
            border: view === 'upload' ? '4px solid white' : 'none',
          }}
        >
          Upload
        </button>
        <button
          onClick={() => setView('hook')}
          style={{
            marginLeft: '1rem',
            marginRight: '1rem',
            border: view === 'hook' ? '4px solid white' : 'none',
          }}
        >
          Hook
        </button>
        <button
          onClick={() => setView('unmount')}
          style={{
            marginLeft: '1rem',
            border: view === 'unmount' ? '4px solid white' : 'none',
          }}
        >
          Unmount
        </button>
      </div>
      <div>
        {view === 'upload' && <ExampleMidiUpload />}
        {view === 'hook' && <LoadByHook />}
        {view === 'unmount' && <div>Component unmounted</div>}
      </div>
    </div>
  )
}

export default App
