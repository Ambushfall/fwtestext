export default defineContentScript({
  matches: ['*://academy.uipath.com/learning-plans/*'],
  async main (ctx) {
      
      const ui = createIntegratedUi(ctx, {
          position: 'inline',
          // It observes the anchor
          anchor: '#courseIframe[src]',
          onMount: async container => {
              let firstIframe = container.parentElement! as HTMLIFrameElement
              const iframeDocument =
              firstIframe.contentDocument || firstIframe.contentWindow!.document
              console.log(
                  'Accessing iframe DOM (if same-origin):',
                  iframeDocument.body
                )
                let obscfg: MutationObserverInit = {
                    attributes: true,
                    childList: true,
                    subtree: true
                }
                let obs = new MutationObserver((mutationList, observer) => {
                    for (const mutation of mutationList) {
                        if (mutation.type === 'childList') {
                            console.log('A child node has been added or removed.')
                        } else if (mutation.type === 'attributes') {
                            console.log(
                                `The ${mutation.attributeName} attribute was modified.`
                            )
                        }
                    }
                })
                obs.observe(iframeDocument.body, obscfg)
            },
            append: 'first'
        })
        
        ctx.setTimeout(() => ui.autoMount(), 6000)
        // Call autoMount to observe anchor element for add/remove.
        // ui.autoMount()
    }
})
