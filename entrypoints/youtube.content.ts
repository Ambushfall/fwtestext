type Settings = {
  yt_preview_muted: boolean
} | null

export default defineContentScript({
  matches: ['*://www.youtube.com/'],
  async main (ctx) {
    const settings = await storage.getItem<Settings>('local:settings')
    const defaultPreviewMuted = settings?.yt_preview_muted! || false
    let ranAmt = 0;
    
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      // It observes the anchor
      anchor: 'button[title="Mute"]',
      onMount: async container => {
        if (defaultPreviewMuted && ranAmt < 1) {
          let muteBtn = container.parentElement!
          muteBtn.click()
          ranAmt++
          console.log('Auto Muted preview by default')
          console.log(ranAmt)
          console.log(settings)
        }
      },
      append: 'first'
    })

    // Call autoMount to observe anchor element for add/remove.
    ui.autoMount()
  }
})
