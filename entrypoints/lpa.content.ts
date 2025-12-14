interface BODYObject {
  K: string
  V: string
  C: string
  R: string
  N: string
  I: string
  SF: string
  S: string
  RO: string
}

function buildBody (body: any): RequestInit {
  return {
    cache: 'no-store',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body),
    method: 'POST'
  }
}

function GenerateReqObject (
  pravilanRacun: string,
  saldoUkupan: string,
  pozivNaBroj: string
): BODYObject {
  return {
    K: 'PR',
    V: '01',
    C: '1',
    R: pravilanRacun,
    N: `LPA Beograd`,
    I: saldoUkupan,
    SF: '253',
    S: 'Porez na Imovinu od Fizickih Lica',
    RO: pozivNaBroj
  }
}

async function mainWatchSPA (
  ctx: InstanceType<typeof ContentScriptContext>
): Promise<void> {
  const ui = createIntegratedUi(ctx, {
    position: 'inline',
    anchor: 'blockquote',
    onMount: async container => {
      let paragraphE: HTMLParagraphElement =
        document.querySelector('p.ng-star-inserted')!
      let callToNumber = paragraphE.innerText
        .split('\n')
        .map(paragraph => paragraph.split(':')[1].trim())[1]
        .replaceAll(' ', '')

      console.log(callToNumber)
      let tableRows: NodeListOf<HTMLTableRowElement> =
        document.querySelectorAll('div.wus-gen.payment.table tr')!
      let [headerRow, valueRow] = tableRows
      let isBalanceNegative = valueRow.querySelector(
        'td.money:not(.balance-negative)'
      )
      if (isBalanceNegative) {
        let arrHeaderIndexes = Array.from(headerRow.querySelectorAll('th')!)
          .map(column => column.innerText)
          .flatMap((key, index) =>
            key.includes('Уплатни рачун') ||
            key.includes('Uplatni račun') ||
            key.includes('Салдо') ||
            key.includes('Saldo')
              ? index
              : undefined
          )
          .filter(index => typeof index !== 'undefined')
        let accountNumber = valueRow
          .querySelectorAll('td')!
          [arrHeaderIndexes[0]].innerText.trim()

        const [num1, num2, num3] = accountNumber.split('-')
        accountNumber = `${num1}${num2.padStart(13, '0')}${num3}`
        console.log(accountNumber)
        let totalToPay = `RSD${valueRow
          .querySelectorAll('td')!
          [arrHeaderIndexes[1]].innerText.trim()}`
        console.log(totalToPay)

        let reqObj = buildBody(
          GenerateReqObject(accountNumber, totalToPay, callToNumber)
        )
        let url = 'https://nbs.rs/QRcode/api/qr/v1/gen/500'
        console.log(reqObj)
        console.log(url)
        let res = await fetch(url, reqObj)
        let dialog = document.createElement('dialog')
        let image = document.createElement('img')
        image.src = URL.createObjectURL(await res.blob())
        dialog.appendChild(image)
        container.appendChild(dialog)
        dialog.addEventListener('click', e => {
          const dialogDimensions = dialog.getBoundingClientRect()
          if (
            e.clientX < dialogDimensions.left ||
            e.clientX > dialogDimensions.right ||
            e.clientY < dialogDimensions.top ||
            e.clientY > dialogDimensions.bottom
          ) {
            dialog.close()
          }
        })

        dialog.showModal()
      }
    }
  })

  ui.autoMount()
}

const watchPattern = new MatchPattern('*://lpa.gov.rs/jisportal/wus/obveznik/*');

export default defineContentScript({
  matches: ['https://lpa.gov.rs/*'],
  async main (ctx) {
    ctx.addEventListener(window, 'wxt:locationchange', async ({ newUrl }) => {
      if (watchPattern.includes(newUrl)) await mainWatchSPA(ctx);
      // if (newUrl.search.includes('wusdatalist')) await mainWatchSPA(ctx)
    })
  }
})
