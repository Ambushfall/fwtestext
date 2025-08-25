// @ts-nocheck
export default defineContentScript({
  matches: ['*://poe.ninja/builds/*'],
  main (ctx) {
    let ui = createIntegratedUi(ctx, {
      position: 'inline',
      // It observes the anchor
      anchor: 'select#League',
      onMount: container => {
        const select = container.parentElement;
        const selectedElement = select[select.selectedIndex];
        const league = selectedElement.innerText.toLowerCase().replaceAll(' ','%20')
        if (league && !league.includes('ssf')) {
          // Store the league value in browser's local storage if it was successfully determined
          browser.storage.local.set({ league: league }, () => {
            // Immediately retrieve and log the stored league to verify
            browser.storage.local.get('league', ({ league }) =>
              console.log(league)
            )
          })
        }
      }
    })
    ui.autoMount()
  }
})
