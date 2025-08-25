type Settings = {
  showAvatar: boolean
  showHistory: boolean
  darkMode: boolean
  testing: boolean
} | null
export default defineContentScript({
  matches: ['*://mangafire.to/user/reading*'],

  main (ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      // It observes the anchor
      anchor: '.inner',
      onMount: async container => {
        const settings: Settings = await storage.getItem('local:settings')
        const { testing, darkMode, showAvatar, showHistory } = settings!

        var result = ''
        var arr = document.querySelectorAll('.inner')

        for (let i = 0; i < arr.length; i++) {
          const element: HTMLParagraphElement =
            arr[i].querySelector('.info > p')!
          const infoEl = arr[i].querySelector('.info')!
          if (element && element.innerText) {
            const _one = Number(element.innerText.match(/([\d|\d.\d]+)/g)![1])
            const one_round = Math.round(_one)
            const _two = Number(element.innerText.match(/([\d|\d.\d]+)/g)![2])
            const two_round = Math.round(_two)

            const [page, chapter_lang, rem_chapter] =
              element.innerText.split('/')
            const chapter_or_vol = chapter_lang.includes('Chapter')
              ? chapter_lang.replace('Chapter', 'Ch')
              : chapter_lang.replace('Volume', 'Vol')
            const remaining_number = !element.innerText.includes('MangaFire')
              ? two_round - one_round
              : undefined
            const resulting_string = `<span>${page}</span> / ${chapter_or_vol} / Total: ${rem_chapter} </br> <span  style="${
              remaining_number &&
              remaining_number < 10 &&
              remaining_number !== 0
                ? 'color: red;'
                : ''
            }"> ${
              chapter_lang.includes('Chapter') ? 'Ch' : 'Vol'
            } ${remaining_number} Left</span>`
            element.innerHTML = resulting_string
            infoEl.setAttribute('data-ch', remaining_number?.toString()!)
            if (testing) {
              const outerElement = arr[i].parentNode as HTMLElement
              result += outerElement.innerHTML
            }
          }
        }

        if (testing) {
          let w = window.open()!
          let area = w.document.createElement('textarea')!
          area.value = result
          w.document.body.innerHTML = result
        }

        // alertLine(this);
      }
    })

    // Call autoMount to observe anchor element for add/remove.
    ui.autoMount()
  }
})
