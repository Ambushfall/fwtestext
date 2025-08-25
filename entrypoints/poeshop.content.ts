export default defineContentScript({
  matches: ['https://www.pathofexile.com/shop/*'],
  main (ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      // It observes the anchor
      anchor: 'div.shopItemBase',
      onMount: container => {
        function isVisible(e:any) {
            var t = e.getBoundingClientRect()
            , n = t.top;
            e = e.parentNode;
            do {
                t = e.getBoundingClientRect(),
                e = e.parentNode
            } while (e != document.body);
            return n <= 1.5 * document.documentElement.clientHeight
        };
        function checkLoadNextItems() {
            console.log('checking visibility')
            isVisible(document.querySelector(".footer")) && removeItems()
        };

        function removeItems() {
            console.log('removing items')
            var nodes = document.querySelector("#mtx-list")!.childNodes as NodeListOf<HTMLElement>
            var nodesToRemove :HTMLElement[] = [];
            nodes.forEach(e => {
                if (!e.querySelector('.onSaleIcon'))
                    // document.querySelector("#mtx-list").removeChild(e);
                    nodesToRemove.push(e);
            
                if (e.querySelector('.onSaleIcon')?.parentElement?.classList?.contains('variant'))
                    nodesToRemove.push(e);
            }
            );

            nodesToRemove.forEach(e => document.querySelector("#mtx-list")!.removeChild(e));

            console.log(document.querySelector("#mtx-list")!.childNodes.length);
        };
        
      const form = document.querySelector("form.t1,search-form")!;
      // form.style.background = 'pink';
      let checkbox = document.createElement('input');
      let label = document.createElement('label');
      label.setAttribute('for','checkboxs')
      label.textContent = 'Show sale only';
      form.appendChild(label);
      checkbox.type = 'checkbox';
      checkbox.setAttribute('id','checkboxs')
      // checkbox.name = 'Show Sale'
      checkbox.setAttribute
      form.appendChild(checkbox);

      checkbox.addEventListener('change', (e) => {
        removeItems()
        window.addEventListener("scroll", () => checkLoadNextItems());
      })


      }
    })

    // Call autoMount to observe anchor element for add/remove.
    ui.autoMount()
  }
})
