export default defineBackground({
  // Set manifest options
  persistent: true,

  main () {
    let league: string | null = null // Define league at the global scope

    // Fetch and store trade stats when the extension is installed
    browser.runtime.onInstalled.addListener(() => fetchAndStoreStatsData())
    browser.runtime.onMessage.addListener(messageHandler)

    function messageHandler (
      message: any,
      sender: Browser.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) {
      switch (message.action) {
        case 'checkAndSendPostRequest':
          checkAndSendPostRequest(message, sender, sendResponse)
          return true // Indicates that the response is asynchronous
          break
        case 'refreshStats':
          // Handle refresh requests from the popup
          fetchAndStoreStatsData(() => {
            sendResponse({ action: 'refreshComplete' })
          })
          return true
          break
        default:
          break
      }
    }

    // Function to fetch and store trade stats data
    const fetchAndStoreStatsData = (callback?: Function) => {
      fetch('https://www.pathofexile.com/api/trade/data/stats')
        .then(response => response.json())
        .then(data => {
          browser.storage.local.set({ tradeStats: data }, () => {
            // Retrieve and log the stored data to verify
            browser.storage.local.get('tradeStats', result => {})

            if (callback) callback()
          })
        })
        .catch(error => {
          console.error('Error fetching trade stats:', error)
        })
    }

    // Helper function to construct headers for the POST request
    const constructHeaders = (poeSessidCookie: string, refererUrl: string) => {
      if (!poeSessidCookie) {
        console.error('POESESSID cookie not found.')
        throw new Error('POESESSION MISSING')
      }

      return new Headers({
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-GB,en;q=0.9,ko-KR;q=0.8,ko;q=0.7,en-US;q=0.6',
        'Content-Type': 'application/json',
        Cookie: `POESESSID=${poeSessidCookie}`,
        Origin: 'https://www.pathofexile.com',
        Referer: refererUrl,
        'Sec-Ch-Ua':
          '"Not/A)Brand";v="8", "Chromium";v="126", "Google browser";v="126"',
        'Sec-Ch-Ua-Arch': '"x86"',
        'Sec-Ch-Ua-Bitness': '"64"',
        'Sec-Ch-Ua-Full-Version': '"126.0.6478.185"',
        'Sec-Ch-Ua-Full-Version-List':
          '"Not/A)Brand";v="8.0.0.0", "Chromium";v="126.0.6478.185", "Google browser";v="126.0.6478.185"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Model': '""',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Ch-Ua-Platform-Version': '"15.0.0"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) browser/126.0.0.0 Safari/537.36',
        Priority: 'u=1, i'
      })
    }

    // Helper function to send the POST request
    const sendPostRequest = async (
      url: string,
      headers: Headers,
      requestBody: any
    ) => {
      try {
        const response = await fetch(url
          ,
          {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
          }
        )

        // Log the status of the response

        if (!response.ok) {
          // Log additional details if the response is not ok
          const responseText = await response.text()
          console.error(
            'Failed to send POST request:',
            response.statusText,
            'Response Text:',
            responseText
          )
          throw new Error(
            `Failed to send POST request: ${response.statusText} (Status Code: ${response.status})`
          )
        }

        const data = await response.json()

        return data
      } catch (error) {
        // Log the error object in more detail
        console.error('Error during POST request:', error)
        throw error
      }
    }

    function checkAndSendPostRequest (
      message: any,
      sender: Browser.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) {
      const requestBody = message.requestBody

      browser.storage.local.get('league', result => {
        if (result.league) {
          league = result.league // Use the retrieved league
        }

        browser.cookies.get(
          { url: 'https://www.pathofexile.com', name: 'POESESSID' },
          cookie => {
            if (cookie) {
              const refererUrl = `https://www.pathofexile.com/trade/search/${
                league || ''
              }`
              const headers = constructHeaders(cookie.value, refererUrl)

              fetch(`https://www.pathofexile.com/api/trade/data/leagues`).then(res => res.json()).then(({result}) => {
                let leagueArray = result.map((e:any) => e.id);
                leagueArray.forEach((e:any) => console.log(e));
              });


              sendPostRequest(`https://www.pathofexile.com/api/trade/search/${league}`,headers, requestBody)
                .then(response => {
                  // Extract the id from the response
                  const searchId = response.id

                  // Construct the new URL
                  const newUrl = `https://www.pathofexile.com/trade/search/${league}/${searchId}`

                  // Send the new URL back to the content script
                  sendResponse({ status: 'success', data: newUrl })
                })
                .catch(error => {
                  console.error('POST request failed:', error)
                  sendResponse({ status: 'error', error: error.message })
                })
            } else {
              console.error('POESESSID cookie not found.')
              sendResponse({
                status: 'error',
                error: 'POESESSID cookie not found'
              })
            }
          }
        )
      })
    }
  }
})
