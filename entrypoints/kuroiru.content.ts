
export default defineContentScript({
    matches: ['https://kuroiru.co/*'],
    main(ctx) {
        const ui = createIntegratedUi(ctx, {
            position: 'inline',
            // It observes the anchor
            anchor: 'div#similar-box > div',
            onMount: (container) => {
          
                console.log(JSON.stringify(document.querySelector("div#similar-box")!.computedStyleMap(), null, 2));
            }, 
        });

        // Call autoMount to observe anchor element for add/remove.
        ui.autoMount();
    },
});

