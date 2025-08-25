export default defineContentScript({
  matches: ['*://*.curseforge.com/wow/*'],
  main (ctx) {
    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
      if (newUrl.search.includes('&class=addons&version=')) mainWatchSPA(ctx)
    })
    if (window.location.href.includes('?filter-game-version='))
      mountUiForNonSPA(ctx)
  }
})
function mountUiForSPA (ctx: InstanceType<typeof ContentScriptContext>): void {
  const ui = createIntegratedUi(ctx, {
    position: 'inline',
    // It observes the anchor
    anchor: 'a.btn-cta.download-cta',
    onMount: container => {
      // Append children to the container
      console.log('hello class addons version')

      const gamever = returnUrlSearchParamFromKey('version')
      const elementList = document.querySelectorAll('.project-card')
      console.log(elementList)
      elementList.forEach((e, i) => {
        const downloadElement: HTMLAnchorElement = e.querySelector(
          'a.btn-cta.download-cta'
        )!
        let hrefText = downloadElement.href
        hrefText = hrefText.split('download')[0]
        hrefText += `files/all?page=1&pageSize=20&version=${gamever}`
        downloadElement.href = hrefText
      })
    }
  })

  // Call autoMount to observe anchor element for add/remove.
  ui.autoMount()
}

function mainWatchSPA (ctx: InstanceType<typeof ContentScriptContext>) {
  mountUiForSPA(ctx)
}

function mountUiForNonSPA (
  ctx: InstanceType<typeof ContentScriptContext>
): void {
  const ui = createIntegratedUi(ctx, {
    position: 'inline',
    // It observes the anchor
    anchor: 'a[data-tooltip="Download file"]',
    onMount: container => {
      // Append children to the container
      console.log('hello game version')
      const urlSearchParamKey = 'filter-game-version'
      const gamever = returnUrlSearchParamFromKey(urlSearchParamKey)

      const elementList = document.querySelectorAll('.project-listing-row')
      elementList.forEach((e, i) => {
        const downloadElement: HTMLAnchorElement = e.querySelector(
          'a[data-tooltip="Download file"]'
        )!
        let hrefText = downloadElement.href
        console.log(hrefText)
        // alert(hrefText);
        hrefText = hrefText.replace(
          'download',
          `files/all?${urlSearchParamKey}=${gamever}`
        )
        hrefText = hrefText.replace(window.location.origin, '')
        downloadElement.href = hrefText
      })
    }
  })
  console.log('automount')
  // Call autoMount to observe anchor element for add/remove.
  ui.autoMount()
}

function returnUrlSearchParamFromKey (key: string): string {
  return new URLSearchParams(window.location.search).get(key)!
}
