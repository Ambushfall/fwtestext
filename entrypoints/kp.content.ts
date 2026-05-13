export default defineContentScript({
  matches: ['*://www.kupujemprodajem.com/moj-kp/obavestenja'],
    main (ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: `input:not(:disabled) ~ span[class*="Checkmark-module"]`,
      onMount: container => {
        const NotificationPage = document.querySelector(`div[class*="NotificationPage"]`)!;

        const btnMarkAsRead = document.createElement('button')
        btnMarkAsRead.textContent = 'Mark as Read'
        btnMarkAsRead.addEventListener("click", (event) => {
            NotificationPage.querySelectorAll(`input:not(:disabled) ~ span[class*="Checkmark-module"]`).forEach((button: Element) => ((button) as HTMLButtonElement).click())
        })
        NotificationPage.prepend(btnMarkAsRead)


      },
      append: 'before'
    })

    ui.autoMount()
  }
})
