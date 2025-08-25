import { useState } from 'react'
import './App.css'
import { usePasteBinStore } from '@/hooks/usePasteBinStore'

function App () {
  const [paste, setPaste, isPersistent, error, isInitialStateResolved] =
    usePasteBinStore()

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = event.clipboardData.getData('text/plain')
    // console.log('Pasted text:', text);
    browser.runtime.sendMessage(
      { action: 'parseCopiedText', text },
      response => {
        console.log(response)
        if (response.status === 'success') {
          const newUrl = response.data

          // Open the new URL in a new tab
          window.open(newUrl, '_blank')
        } else {
          console.warn('Error:', response.error)
        }
      }
    )
  }

  return (
    <>
      <div>
        {/* Logos go here */}
        {/* 
        <a href="https://wxt.dev" target="_blank">
          <img src={wxtLogo} className="logo" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        EXAMPLE
        */}
        {paste}
      </div>

      <h1>POE Pastebin</h1>
      <div className='card'>
        {/* <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p> */}
        <textarea onPaste={handlePaste} id='pastebin'></textarea>
      </div>
      <p className='read-the-docs'>Paste item from poe-ninja / pob</p>
    </>
  )
}

export default App
