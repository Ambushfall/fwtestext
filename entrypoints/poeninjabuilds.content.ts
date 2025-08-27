// @ts-nocheck
export default defineContentScript({
  matches: ['*://poe.ninja/builds/*/character/*'],
  main (ctx) {
    if (!window.location.pathname.split('/')[2].includes('ssf'))
      mainBuildContent(ctx)
  }
})

async function mainBuildContent (ctx) {
  let ui = createIntegratedUi(ctx, {
    position: 'inline',
    // It observes the anchor
    anchor: 'div[data-floating-ui-portal]',
    onMount: async container => {
      // Append children to the container
      // console.log('hello class addons version')
      await addTradeButtons()
      // init trade button
    }
  })
  ui.autoMount()
  async function addTradeButtons () {
    // Target general item containers (equipment, flasks)
    document
      .querySelectorAll('.group')
      .forEach(async itemGroup => await addButtonToDiv(itemGroup))
  }

  async function addButtonToDiv (itemDiv) {
    const copyButton = itemDiv.querySelector('.button')
    if (copyButton && !itemDiv.querySelector('.trade-button')) {
      const parentElement = copyButton.parentElement
      const { backgroundSize } = parentElement.style
      const tradeButton = copyButton.cloneNode(true)
      // const tradeButton = document.createElement('button')
      tradeButton.innerText = 'Trade'

      tradeButton.classList.add('trade-button')
      if (
        backgroundSize !==
          'calc(1 * var(--cellSize)) calc(1 * var(--cellSize))' &&
        backgroundSize !==
          'calc(1 * var(--cellSize)) calc(2 * var(--cellSize))' &&
        parentElement.className !== 'group'
      ) {
        tradeButton.style.right = 'var(--s1)'
        tradeButton.style.left = null
      } else {
        tradeButton.style.transform = 'translateY(40%)'
        // tradeButton.style.bottom = '-15px'
        // tradeButton.style.top = null;
      }
      tradeButton.title = 'Search item in POE trade'
      tradeButton.addEventListener('click', async event => {
        event.stopPropagation() // Stop the event from propagating
        await simulateCopyButtonClick(copyButton)
      })

      copyButton.parentNode.appendChild(tradeButton)
    }
  }

  // The function simulateCopyButtonClick is updated to use the new constructJsonFromParsedData
  async function simulateCopyButtonClick (copyButton) {
    copyButton.click() // Simulate copy button click
    let text = await navigator.clipboard.readText()

    let {data, status, error} = await browser.runtime.sendMessage( { action: 'parseCopiedText', text } );
    console.log(data);
    if (status === 'success') {
      const newUrl = data
      window.open(newUrl, '_blank')
    } else {
      console.warn('Error:', error)
    }
  }
}
