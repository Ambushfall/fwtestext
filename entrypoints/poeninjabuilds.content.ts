// @ts-nocheck
export default defineContentScript({
  matches: ['*://poe.ninja/builds/*/character/*'],
  main (ctx) {
    if (!window.location.pathname.split('/')[2].includes('ssf'))
      mainBuildContent(ctx)
  }
})

function mainBuildContent (ctx) {
  let ui = createIntegratedUi(ctx, {
    position: 'inline',
    // It observes the anchor
    anchor: 'div[data-floating-ui-portal]',
    onMount: container => {
      // Append children to the container
      // console.log('hello class addons version')
      addTradeButtons()
      // init trade button
    }
  })
  ui.autoMount()
  function addTradeButtons() {
    // Target general item containers (equipment, flasks)
    document
      .querySelectorAll('.group')
      .forEach(itemGroup => addButtonToDiv(itemGroup))
  }

  function addButtonToDiv(itemDiv) {
    const copyButton = itemDiv.querySelector('.button')
    if (copyButton && !itemDiv.querySelector('.trade-button')) {
      const parentElement = copyButton.parentElement
      const { backgroundSize } = parentElement.style
      const tradeButton = copyButton.cloneNode(true)
      // const tradeButton = document.createElement('button')
      tradeButton.innerText = 'Trade'

      tradeButton.classList.add('trade-button')
      if (backgroundSize !== 'calc(1 * var(--cellSize)) calc(1 * var(--cellSize))' &&
        backgroundSize !== 'calc(1 * var(--cellSize)) calc(2 * var(--cellSize))' &&
        parentElement.className !== 'group') {
        tradeButton.style.right = 'var(--s1)'
        tradeButton.style.left = null
      } else {
        tradeButton.style.transform = 'translateY(40%)'
        // tradeButton.style.bottom = '-15px'
        // tradeButton.style.top = null;
      }
      tradeButton.title = 'Search item in POE trade'
      tradeButton.addEventListener('click', event => {
        event.stopPropagation() // Stop the event from propagating
        simulateCopyButtonClick(copyButton)
      })

      copyButton.parentNode.appendChild(tradeButton)
    }
  }

  // The function simulateCopyButtonClick is updated to use the new constructJsonFromParsedData
  function simulateCopyButtonClick(copyButton) {
    copyButton.click() // Simulate copy button click
    navigator.clipboard.readText().then(async (text) => {
      console.log('Copied text:', text) // Print the copied text to the console


      browser.runtime.sendMessage(
        { action: 'parseCopiedText', text },
        response => {
          console.log(response);
          if (response.status === 'success') {
            const newUrl = response.data

            // Open the new URL in a new tab
            window.open(newUrl, '_blank')
          } else {
            console.error('Error:', response.error)
          }
        }
      )
      
    })
  }

}