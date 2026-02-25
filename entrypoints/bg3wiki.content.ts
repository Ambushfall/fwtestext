// https://bg3.wiki/wiki/Silver_Sword_of_the_Astral_Plane


export default defineContentScript({
    matches: ['*://bg3.wiki/wiki/*'],
    main(ctx) {
        console.log(ctx);
        const ui = createIntegratedUi(ctx, {
            position: 'inline',
            // It observes the anchor
            anchor: "//summary[contains(text(), 'UUID')]",
            onMount: (container) => {
                let detailsElement = container.parentElement!;
                let currentdd = detailsElement.parentElement!;
                let dlist = currentdd.parentElement!;
                let newdd = document.createElement('dd');
                let newDetails = detailsElement.cloneNode(true) as HTMLElement;
                let uuidEl = newDetails.querySelector('code')!;
                let summaryEl = newDetails.querySelector('summary')!;
                newdd.appendChild(newDetails)
                dlist.appendChild(newdd);
                summaryEl.textContent = "Spawn code"
                uuidEl.textContent = `Osi.TemplateAddTo("${uuidEl.textContent}", GetHostCharacter(), 1, 1);`
                // console.log()
            },
            append: "before"
        });

        // Call autoMount to observe anchor element for add/remove.
        ui.autoMount();
    },
});

