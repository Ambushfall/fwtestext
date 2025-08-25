export default defineContentScript({
  matches: ['*://www.pathofexile.com/trade/search/*'],
  main (ctx) {
    // Attempt to retrieve the league from browser's local storage
    browser.storage.local.get('league', result => {
      if (result.league) {
        const league = result.league

        // Use the league value as needed
      } else {
        console.error('League is not set or not found in storage.')
      }
    })

    // Extract the league from the URL and store it globally when on pathofexile.com
    const updateLeagueFromPathOfExileUrl = () => {
      const urlParts = window.location.pathname.split('/')
      const leagueFromPathOfExile = urlParts.includes('search')
        ? urlParts[urlParts.indexOf('search') + 1]
        : null

      // Store the league value in browser's local storage
      if (leagueFromPathOfExile) {
        browser.storage.local.set({ league: leagueFromPathOfExile }, () => {})
      } else {
        console.error(
          'League could not be determined from the Path of Exile URL.'
        )
      }
    }

    updateLeagueFromPathOfExileUrl()
  }
})
