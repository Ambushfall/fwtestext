
export default defineContentScript({
  matches: ['*://iponcomp.com/shop/*'],

  main (ctx) {
    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
      if (newUrl.search.includes('?') || newUrl.pathname.includes("group")) mountUiForSPA(ctx)
    })
    if (window.location.href.includes('product'))
      mountUiForNonSPA(ctx)
    if (window.location.href.includes('group'))
      mountUiForNonSPA(ctx)

// TODO: Lazy
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      // It observes the anchor
      anchor: 'div [x-data="productAdd(product)"].mt-3',
      onMount: async container => {
        let convert = (forints: string) => Number(forints?.split("Ft")[0].trim().replace(" ", ""))/parseFloat("3.24241");
        let isDiscounted = container.parentElement!.querySelector("H5");

        let price= (container.parentElement!.querySelector("H4")! as HTMLHeadingElement).innerText;
        
        if(isDiscounted){
            let discountedPrice = (container.parentElement!.querySelector("H5") as HTMLHeadingElement).innerText
            let rsdDiscPrice = convert(discountedPrice);
            (container.parentElement!.querySelector("H5") as HTMLHeadingElement).innerText += ` | ${Math.floor(rsdDiscPrice)} RSD`;
        }

        let rsdprice = convert(price);
        (container.parentElement!.querySelector("H4")! as HTMLHeadingElement).innerText += ` | ${Math.floor(rsdprice)} RSD`;
      }
    })

    // Call autoMount to observe anchor element for add/remove.
    // ui.autoMount()
  }
})


function mountUiForNonSPA (
  ctx: InstanceType<typeof ContentScriptContext>
): void {
  console.log("mounted for non spa")
}


function mountUiForSPA (ctx: InstanceType<typeof ContentScriptContext>): void {
    console.log("mounted for spa")
}