// @ts-nocheck
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
        case 'refreshStats':
          // Handle refresh requests from the popup
          fetchAndStoreStatsData(() => {
            return Promise.resolve(sendResponse({ action: 'refreshComplete' }))
          })
          // return true
          break
        case 'parseCopiedText':
          let itemData = processCopiedData(message.text)

          console.log(itemData)

          browser.storage.local.get('tradeStats', data => {
            if (data.tradeStats) {
              processItemDataWithTradeStats(itemData, data.tradeStats)
              // Construct the JSON body for the POST request
              const requestBody = constructJsonFromParsedData(itemData)
              checkAndSendPostRequest(requestBody, sender, sendResponse)
            } else {
              console.warn('No tradeStats found in storage.')
            }
          })
          // Send the request to the background script and wait for the new URL
          // return false
          return true
          break
        default:
          break
      }
    }

    // Function to fetch and store trade stats data
    function fetchAndStoreStatsData (callback?: Function) {
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
          console.warn('Error fetching trade stats:', error)
        })

        chrome.runtime.openOptionsPage();
    }

    // Helper function to construct headers for the POST request
    function constructHeaders (poeSessidCookie: string, refererUrl: string) {
      if (!poeSessidCookie) {
        console.warn('POESESSID cookie not found.')
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
    async function sendPostRequest (
      url: string,
      headers: Headers,
      requestBody: any
    ) {
      try {
        const response = await fetch(
          url,

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
          console.warn(
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
        console.warn('Error during POST request:', error)
        throw error
      }
    }

    function checkAndSendPostRequest (
      requestBody: any,
      sender: Browser.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) {
      // console.log(`request body:`, requestBody)
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

              sendPostRequest(
                `https://www.pathofexile.com/api/trade/search/${league}`,
                headers,
                requestBody
              )
                .then(response => {
                  // Extract the id from the response
                  const searchId = response.id

                  // Construct the new URL
                  const newUrl = `https://www.pathofexile.com/trade/search/${league}/${searchId}`

                  // Send the new URL back to the content script
                  return Promise.resolve(
                    sendResponse({ status: 'success', data: newUrl })
                  )
                })
                .catch(error => {
                  console.warn('POST request failed:', error)
                  return Promise.resolve(
                    sendResponse({ status: 'error', error: error.message })
                  )
                })
            } else {
              console.warn('POESESSID cookie not found.')
              return Promise.resolve(
                sendResponse({
                  status: 'error',
                  error: 'POESESSID cookie not found'
                })
              )
            }
          }
        )
      })
    }
    function constructJsonFromParsedData (parsedData) {
      const { baseType, sockets, poeInternalModifierValues, rarity } =
        parsedData

      const isClusterJewel = baseType.includes('Cluster Jewel')
      const isTimelessJewel = baseType === 'Timeless Jewel'

      const stats = Object.keys(poeInternalModifierValues).reduce(
        (acc, groupName) => {
          const group = poeInternalModifierValues[groupName]
          group.forEach(modifier => {
            let valueObject = {}

            if (modifier.optionUsed) {
              // If optionUsed is true, set the option field instead of min/max
              valueObject = { option: modifier.optionId }
            } else if (modifier.replacedValue !== null) {
              // Apply to max if the value is negative, otherwise apply to min
              if (modifier.replacedValue < 0) {
                valueObject =
                  isClusterJewel || isTimelessJewel
                    ? {
                        min: modifier.replacedValue,
                        max: modifier.replacedValue
                      }
                    : { max: modifier.replacedValue }
              } else {
                valueObject =
                  isClusterJewel || isTimelessJewel
                    ? {
                        min: modifier.replacedValue,
                        max: modifier.replacedValue
                      }
                    : { min: modifier.replacedValue }
              }
            }

            acc.push({
              id: modifier.id,
              value: valueObject,
              disabled: false
            })
          })
          return acc
        },
        []
      )

      const socketFilters = {}
      if (sockets) {
        const lowercasedSockets = {}
        let hasValidSocket = false

        Object.keys(sockets).forEach(color => {
          const value = sockets[color]
          if (value > 0) {
            // Only include sockets that have a value greater than 0
            lowercasedSockets[color.toLowerCase()] = value
            hasValidSocket = true
          }
        })

        if (hasValidSocket) {
          socketFilters.sockets = lowercasedSockets
        }
        if (sockets.links && sockets.links.length > 0) {
          socketFilters.links = {
            min: Math.max(...sockets.links)
          }
        }
      }

      // Initialize the query object
      const query = {
        status: { option: 'online' },
        type: baseType || '',
        stats: [{ type: 'and', filters: stats }],
        filters: {
          socket_filters: {
            disabled: false,
            filters: socketFilters
          }
        }
      }

      // Handle Synthesised items
      if (query.type.includes('Synthesised')) {
        // Remove "Synthesised" from the type
        query.type = query.type.replace('Synthesised', '').trim()

        // Add the synthesised_item filter
        query.filters.misc_filters = {
          filters: {
            synthesised_item: { option: 'true' }
          }
        }
      }

      // Add type filters for unique items and name only if the item is unique
      if (rarity === 'Unique' || rarity === 'undefined') {
        query.filters.type_filters = {
          filters: {
            rarity: { option: 'unique' }
          }
        }
        query.name = parsedData.name || ''
      }

      const jsonObject = {
        query: query,
        sort: { price: 'asc' }
      }

      return jsonObject
    }

    // Function to process mods with bracketed suffixes
    function processMod (line, defaultKey = '') {
      // Match lines that end with (something) and capture the part before and inside parentheses
      const modMatch = line.match(/(.*)\((.*)\)$/)
      if (modMatch) {
        return { key: modMatch[2].trim(), value: modMatch[1].trim() }
      } else {
        // For lines without parentheses, treat the entire line as the value and use the default key
        return { key: defaultKey, value: line.trim() }
      }
    }

    // Helper function to add mods to the appropriate group
    function addMod (group, key, value) {
      if (!group[key]) {
        group[key] = []
      }
      group[key].push(value)
    }

    function isNonUniqueClusterJewel (rarity, baseType) {
      return (
        (rarity === 'Rare' || rarity === 'Magic') &&
        baseType &&
        baseType.includes('Cluster Jewel')
      )
    }

    // Helper function to process sockets
    function processSockets (socketsData) {
      const socketData = { R: 0, G: 0, B: 0, W: 0, links: [] }
      const groups = socketsData.split(' ')

      groups.forEach(group => {
        let linkCount = 0
        for (const char of group) {
          if (socketData[char] !== undefined) {
            socketData[char]++
            linkCount++
          }
        }
        if (linkCount > 1) {
          socketData.links.push(linkCount)
        }
      })

      return socketData
    }

    // Function to process the info group, handling special cases for flasks and tinctures
    function processInfoGroup (lines, itemData) {
      itemData.rarity = lines[0].replace('Rarity: ', '').trim()
      const nameAndBaseTypeLine = lines[1]

      if (
        nameAndBaseTypeLine &&
        (nameAndBaseTypeLine.includes('Flask') ||
          nameAndBaseTypeLine.includes('Tincture'))
      ) {
        const words = nameAndBaseTypeLine.split(' ')
        const index = words.findIndex(
          word => word === 'Flask' || word === 'Tincture'
        )
        if (index > 0) {
          itemData.name = words.slice(0, index - 1).join(' ')
          itemData.baseType = `${words[index - 1]} ${words[index]}`
        } else {
          itemData.name = words.slice(0, index).join(' ')
          itemData.baseType = words[index]
        }
      } else {
        itemData.name = lines[1]
        itemData.baseType = lines[2]
      }
    }

    // Main function to process the copied data
    function processCopiedData (text) {
      // Split the text into groups using '--------' as the delimiter
      let class_regex = /Item Class: \w+.\w+/;
      if (text.match(class_regex)) text = text.replace(text.match(class_regex)[0], '')
      console.log(text.match(class_regex))
      const groups = text.split('--------').map(group => group.trim())

      // Initialize an object to hold the parsed data
      const itemData = {
        rarity: '',
        name: '',
        baseType: '',
        itemLevel: '',
        itemStats: {},
        requirements: {},
        sockets: null,
        enchant: {},
        implicitMods: {},
        explicitMods: {},
        flavourText: [],
        itemType: '',
        corrupted: false
      }

      let currentGroup = ''

      // Function to add mod to a group, checking for duplicates
      const addModUnique = (group, key, value) => {
        if (!group[key]) {
          group[key] = []
        }
        if (!group[key].includes(value)) {
          group[key].push(value)
        }
      }

      // Function to check if a line starts with any weapon type, ignoring case
      const startsWithWeaponType = line => {
        const weaponTypes = [
          'bow',
          'claw',
          'rune dagger',
          'dagger',
          'one handed sword',
          'two handed sword',
          'thrusting one handed sword',
          'sceptre',
          'one handed mace',
          'two handed mace',
          'one handed axe',
          'two handed axe',
          'staff',
          'war staff',
          'wand'
        ]

        // Convert the line to lowercase and check if it starts with any weapon type
        return weaponTypes.some(weaponType =>
          line.toLowerCase().startsWith(weaponType)
        )
      }

      // Process each group in the order specified
      groups.forEach((group, index) => {
        const lines = group
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)

        if (lines.length > 0) {
          const firstLine = lines[0]

          switch (true) {
            case firstLine.startsWith('Rarity:'):
              currentGroup = 'info'
              processInfoGroup(lines, itemData)
              break

            case firstLine.startsWith('Item Level:'):
              currentGroup = 'itemLevel'
              itemData.itemLevel = firstLine.replace('Item Level: ', '').trim()
              break

            case firstLine.startsWith('Quality:') ||
              firstLine.startsWith('Armour:') ||
              firstLine.startsWith('Energy Shield:') ||
              firstLine.startsWith('Evasion:') ||
              firstLine.startsWith('Quality (') ||
              startsWithWeaponType(firstLine) ||
              (lines[1] && lines[1].startsWith('Quality:')) ||
              (lines[1] && lines[1].startsWith('Armour:')) ||
              (lines[1] && lines[1].startsWith('Energy Shield:')) ||
              (lines[1] && lines[1].startsWith('Evasion:')) ||
              (lines[1] && lines[1].startsWith('Quality (')):
              currentGroup = 'itemStats'
              lines.forEach(line => {
                const [key, value] = line.split(': ').map(part => part.trim())
                itemData.itemStats[key] = value
              })
              break

            case firstLine.startsWith('Requirements:'):
              currentGroup = 'requirements'
              lines.slice(1).forEach(line => {
                const [key, value] = line.split(': ').map(part => part.trim())
                itemData.requirements[key] = value
              })
              break

            case firstLine.startsWith('Sockets:'):
              currentGroup = 'sockets'
              itemData.sockets = processSockets(firstLine.split('Sockets: ')[1])
              break

            case lines.some(line => line.endsWith('(enchant)')):
              currentGroup = 'enchant'
              lines.forEach(line => {
                const { key, value } = processMod(line, 'enchant')
                addModUnique(itemData.enchant, key, value) // Avoid duplicates
              })
              break

            case lines.some(line => line.endsWith('(implicit)')):
              currentGroup = 'implicitMods'
              lines.forEach(line => {
                const { key, value } = processMod(line, 'implicit')
                addModUnique(itemData.implicitMods, key, value) // Avoid duplicates
              })
              break

            case currentGroup === 'implicitMods' ||
              currentGroup === 'requirements' ||
              currentGroup === 'sockets':
              currentGroup = 'explicitMods'
              lines.forEach(line => {
                const { key, value } = processMod(line, 'explicit')
                addModUnique(itemData.explicitMods, key, value) // Avoid duplicates
              })
              break
            // Explicit mods are captured as the default fallback
            default:
              currentGroup = 'explicitMods'
              lines.forEach(line => {
                const { key, value } = processMod(line, 'explicit')
                addModUnique(itemData.explicitMods, key, value) // Avoid duplicates
              })
              break

            case lines.length === 1 && firstLine === 'Corrupted':
              itemData.corrupted = true
              break

            case currentGroup === 'explicitMods':
              currentGroup = 'flavourText'
              itemData.flavourText.push(...lines)
              break

            case lines.length === 1:
              currentGroup = 'itemType'
              itemData.itemType = firstLine
              break
          }
        }
      })

      // Special case for non-unique Cluster Jewels
      if (isNonUniqueClusterJewel(itemData.rarity, itemData.baseType)) {
        let processedGroups = {
          info: false,
          itemLevel: false,
          requirements: false,
          enchant: true,
          implicitMods: false,
          explicitMods: false,
          flavourText: false,
          itemType: false
        }

        groups.forEach((group, index) => {
          const lines = group
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)

          if (lines.length > 0) {
            const firstLine = lines[0]

            if (!processedGroups.info && firstLine.startsWith('Rarity:')) {
              processedGroups.info = true
              processInfoGroup(lines, itemData)
            } else if (
              !processedGroups.itemLevel &&
              firstLine.startsWith('Item Level:')
            ) {
              processedGroups.itemLevel = true
              itemData.itemLevel = firstLine.replace('Item Level: ', '').trim()
            } else if (
              !processedGroups.requirements &&
              firstLine.startsWith('Requirements:')
            ) {
              processedGroups.requirements = true
              lines.slice(1).forEach(line => {
                const [key, value] = line.split(': ').map(part => part.trim())
                itemData.requirements[key] = value
              })
            } else if (lines.some(line => line.endsWith('(enchant)'))) {
              processedGroups.enchant = true
              itemData.enchant = {}
              lines.forEach(line => {
                const { key, value } = processMod(line, 'enchant')
                addModUnique(itemData.enchant, key, value) // Avoid duplicates
              })
            } else if (lines.some(line => line.endsWith('(implicit)'))) {
              processedGroups.implicitMods = true
              lines.forEach(line => {
                const { key, value } = processMod(line, 'implicit')
                addModUnique(itemData.implicitMods, key, value) // Avoid duplicates
              })
            } else if (
              !processedGroups.explicitMods &&
              (processedGroups.enchant || processedGroups.requirements)
            ) {
              processedGroups.explicitMods = true
              lines.forEach(line => {
                const { key, value } = processMod(line, 'explicit')
                addModUnique(itemData.explicitMods, key, value) // Avoid duplicates
              })
            } else if (!processedGroups.itemType && lines.length === 1) {
              processedGroups.itemType = true
              itemData.itemType = firstLine
            }
          }
        })
      }

      // Check if item is a weapon
      const isWeapon = itemStats => {
        const weaponTypes = [
          'bow',
          'claw',
          'rune dagger',
          'dagger',
          'one handed sword',
          'two handed sword',
          'thrusting one handed sword',
          'sceptre',
          'one handed mace',
          'two handed mace',
          'one handed axe',
          'two handed axe',
          'staff',
          'war staff',
          'wand'
        ]
        return weaponTypes.some(weaponType => {
          // Check if any of the keys in itemStats match any of the weaponTypes
          return Object.keys(itemStats).some(key =>
            key.toLowerCase().includes(weaponType)
          )
        })
      }

      // Process explicit mods with additional logic
      const processModifiers = () => {
        const { itemStats, explicitMods, implicitMods } = itemData

        const applyLocal = mod => `${mod} (Local)`

        // Helper function to process a group of modifiers
        const processModGroup = modGroup => {
          Object.keys(modGroup).forEach(key => {
            modGroup[key] = modGroup[key].map(modifier => {
              if (
                /^\d+% increased evasion rating$/i.test(modifier) &&
                'Evasion Rating' in itemStats
              ) {
                return applyLocal(modifier)
              }
              if (
                (/^\+\d+ to maximum Energy Shield$/i.test(modifier) ||
                  /^\d+% increased Energy Shield$/.test(modifier)) &&
                'Energy Shield' in itemStats
              ) {
                return applyLocal(modifier)
              }
              if (
                (/^\d+% increased Armour$/i.test(modifier) ||
                  /^\+\d+ to Armour$/.test(modifier)) &&
                'Armour' in itemStats
              ) {
                return applyLocal(modifier)
              }
              if (
                /^\d+% increased Armour and Energy Shield$/i.test(modifier) &&
                'Armour' in itemStats &&
                'Energy Shield' in itemStats
              ) {
                return applyLocal(modifier)
              }
              if (
                /^\d+% increased Armour and Evasion$/i.test(modifier) &&
                'Armour' in itemStats &&
                'Evasion Rating' in itemStats
              ) {
                return applyLocal(modifier)
              }
              if (
                /^\d+% increased Armour, Evasion and Energy Shield$/i.test(
                  modifier
                ) &&
                'Armour' in itemStats &&
                'Evasion Rating' in itemStats &&
                'Energy Shield' in itemStats
              ) {
                return applyLocal(modifier)
              }
              if (
                /^\d+% increased Evasion and Energy Shield$/i.test(modifier) &&
                'Evasion Rating' in itemStats &&
                'Energy Shield' in itemStats
              ) {
                return applyLocal(modifier)
              }
              if (
                /^\d+% increased Attack Speed$/i.test(modifier) &&
                'Attacks per Second' in itemStats &&
                isWeapon(itemStats)
              ) {
                return applyLocal(modifier)
              }
              if (
                /^\+\d+ to Accuracy Rating$/i.test(modifier) &&
                isWeapon(itemStats)
              ) {
                return applyLocal(modifier)
              }
              if (
                /^Adds \d+ to \d+ Lightning Damage$/i.test(modifier) &&
                'Elemental Damage' in itemStats &&
                isWeapon(itemStats)
              ) {
                return applyLocal(modifier)
              }
              if (
                /^Adds \d+ to \d+ Cold Damage$/i.test(modifier) &&
                'Elemental Damage' in itemStats &&
                isWeapon(itemStats)
              ) {
                return applyLocal(modifier)
              }
              if (
                /^Adds \d+ to \d+ Fire Damage$/i.test(modifier) &&
                'Elemental Damage' in itemStats &&
                isWeapon(itemStats)
              ) {
                return applyLocal(modifier)
              }
              if (
                /^Adds \d+ to \d+ Chaos Damage$/i.test(modifier) &&
                'Chaos Damage' in itemStats &&
                isWeapon(itemStats)
              ) {
                return applyLocal(modifier)
              }
              if (
                /^Adds \d+ to \d+ Physical Damage$/i.test(modifier) &&
                'Physical Damage' in itemStats &&
                isWeapon(itemStats)
              ) {
                return applyLocal(modifier)
              }
              if (
                /^\d+% of physical attack damage leeched as life$/i.test(
                  modifier
                ) &&
                isWeapon(itemStats)
              ) {
                return applyLocal(modifier)
              }
              if (
                /^\d+% of physical attack damage leeched as mana$/i.test(
                  modifier
                ) &&
                isWeapon(itemStats)
              ) {
                return applyLocal(modifier)
              }
              if (
                /^\d+% chance to poison on hit$/i.test(modifier) &&
                isWeapon(itemStats)
              ) {
                return applyLocal(modifier)
              }
              return modifier
            })
          })
        }

        // Process both explicit and implicit modifiers
        processModGroup(explicitMods)
        processModGroup(implicitMods)
      }

      processModifiers()

      // Log the parsed item data to the console
      // Query the trade stats and process the item data with them
      browser.storage.local.get('tradeStats', data => {
        if (data.tradeStats) {
          processItemDataWithTradeStats(itemData, data.tradeStats)

          // Ensure that poeInternalModifierValues is correctly populated
          if (
            !itemData.poeInternalModifierValues ||
            Object.keys(itemData.poeInternalModifierValues).length === 0
          ) {
            console.warn(
              'poeInternalModifierValues is empty after processing item data with trade stats:',
              itemData
            )
          } else {
          }
        } else {
          console.warn('No tradeStats found in storage.')
        }
      })

      return itemData // Return parsed item data if needed elsewhere
    }

    // Function to normalize certain text patterns before querying trade stats
    function normalizeValueForTradeStats (value) {
      // Create a map of known replacements
      const replacements = {
        'Charges when you are Hit by an Enemy':
          'Charge when you are Hit by an Enemy',
        'Abyssal Socket': 'Abyssal Sockets',
        'Suffix Modifiers allowed': 'Suffix Modifier allowed',
        'Magic Utility Flasks constantly apply their Flask Effects to you':
          'Magic Utility Flask constantly applies its Flask Effect to you',
        'Small Passive Skill which grants nothing':
          'Small Passive Skills which grant nothing',
        'Prefix Modifiers allowed': 'Prefix Modifier allowed'
        // Add more as needed
      }

      // Replace known patterns
      Object.keys(replacements).forEach(pattern => {
        const regex = new RegExp(`\\b${pattern}\\b`, 'g')
        value = value.replace(regex, replacements[pattern])
      })

      // Convert all negative numbers to positive for matching purposes
      value = value.replace(/-\d+/g, match => `+${match.slice(1)}`)

      return value
    }

    // Modify the existing queryTradeStats function to include this new normalization
    function queryTradeStats (
      tradeStats,
      key,
      value,
      baseType,
      isEnchant = false
    ) {
      const matchedArray = tradeStats.result.find(entry => entry.id === key)

      if (!matchedArray) {
        return null
      }

      // Preserve the original value for later use
      const originalValue = value

      // Normalize the value for matching
      const normalizedValue = normalizeValueForTradeStats(value)

      const tryMatch = valueToMatch => {
        let match = matchedArray.entries.find(
          entry => entry.text === valueToMatch
        )
        if (match) {
          return { id: match.id, optionUsed: false }
        }

        // Try replacing the first number with #
        let modifiedValue = valueToMatch.replace(/\d+/, '#')

        match = matchedArray.entries.find(entry => entry.text === modifiedValue)
        if (match) {
          // Use the original value (which includes the sign) when setting replacedValue
          const replacedValue = originalValue.match(/-?\d+/)[0]

          return { id: match.id, replacedValue: replacedValue }
        }

        // Try replacing the first two numbers with #
        let modifiedValueTwoNumbers = valueToMatch.replace(
          /(\d+)\s*to\s*(\d+)/,
          '# to #'
        )

        match = matchedArray.entries.find(
          entry => entry.text === modifiedValueTwoNumbers
        )
        if (match) {
          const numbers = originalValue.match(/-?\d+/g)
          const averageValue =
            (parseInt(numbers[0], 10) + parseInt(numbers[1], 10)) / 2

          return { id: match.id, replacedValue: averageValue }
        }

        // Try appending (Local) to the value and search again
        modifiedValue = `${valueToMatch} (Local)`

        match = matchedArray.entries.find(entry => entry.text === modifiedValue)
        if (match) {
          return { id: match.id, replacedValue: null } // No number replacement needed here
        }

        // Try replacing the first number with # in the "(Local)" appended value
        let modifiedLocalFirstNumber = modifiedValue.replace(/\d+/, '#')

        match = matchedArray.entries.find(
          entry => entry.text === modifiedLocalFirstNumber
        )
        if (match) {
          const replacedValue = originalValue.match(/-?\d+/)[0]

          return { id: match.id, replacedValue: replacedValue }
        }

        // Try replacing the first two numbers with # in the "(Local)" appended value
        let modifiedLocalTwoNumbers =
          valueToMatch.replace(/(\d+)\s*to\s*\d+/, '# to #') + ' (Local)'

        match = matchedArray.entries.find(
          entry => entry.text === modifiedLocalTwoNumbers
        )
        if (match) {
          const numbers = originalValue.match(/-?\d+/g)
          const averageValue =
            (parseInt(numbers[0], 10) + parseInt(numbers[1], 10)) / 2

          return { id: match.id, replacedValue: averageValue }
        }

        //Try replacing all numbers with #
        let modifiedAllNumbers = valueToMatch.replace(/\d+/g, '#')

        match = matchedArray.entries.find(entry => {
          return entry.text === modifiedAllNumbers
        })
        if (match) {
          return { id: match.id }
        }

        return null
      }

      // Attempt matching with the normalized line
      let result = tryMatch(normalizedValue)
      if (result) return result

      // Handle special case for shields or bucklers with Chance to Block modifier
      if (/Chance to Block/.test(value) && /shield|buckler/i.test(baseType)) {
        const shieldSpecificValue = `${value} (Shields)`

        result = tryMatch(shieldSpecificValue)
        if (result) return result
      }

      return null
    }

    function tryMatchWithOptions (baseText, optionsKey, modifierText) {
      const matchedArray = tradeStats.result.find(
        entry => entry.id === optionsKey
      )
      if (!matchedArray) return null

      const baseMatch = matchedArray.entries.find(
        entry => entry.text === baseText
      )
      if (!baseMatch) return null

      const optionsArray = baseMatch.option?.options || []
      let optionMatch = optionsArray.find(
        option => option.text === modifierText
      )

      if (!optionMatch) {
        let modifiedText = modifierText.replace(/\d+/, '#')
        optionMatch = optionsArray.find(option => option.text === modifiedText)

        if (!optionMatch) {
          modifiedText = modifierText.replace(/(\d+).*?(\d+)/, '# to #')
          optionMatch = optionsArray.find(
            option => option.text === modifiedText
          )
        }
      }

      if (optionMatch) {
        return {
          id: `${baseMatch.id}`,
          optionId: optionMatch.id,
          optionUsed: true
        }
      }

      return null
    }

    // Function to handle special cases for querying trade stats
    function handleSpecialCases (tradeStats, key, value, baseType) {
      const processMatchWithOptions = (baseText, optionsKey, modifierText) => {
        const matchedArray = tradeStats.result.find(
          entry => entry.id === optionsKey
        )
        if (!matchedArray) return null

        const baseMatch = matchedArray.entries.find(
          entry => entry.text === baseText
        )
        if (!baseMatch) return null

        const optionsArray = baseMatch.option?.options || []
        let optionMatch = optionsArray.find(
          option => option.text === modifierText
        )

        if (!optionMatch) {
          let modifiedText = modifierText.replace(/\d+/, '#')
          optionMatch = optionsArray.find(
            option => option.text === modifiedText
          )

          if (!optionMatch) {
            modifiedText = modifierText.replace(/(\d+).*?(\d+)/, '# to #')
            optionMatch = optionsArray.find(
              option => option.text === modifiedText
            )
          }
        }

        if (optionMatch) {
          return {
            id: `${baseMatch.id}`,
            optionId: optionMatch.id,
            optionUsed: true
          }
        }

        return null
      }

      if (value.startsWith('Added Small Passive Skills grant:')) {
        const baseText = 'Added Small Passive Skills grant: #'
        const modifierText = value
          .replace('Added Small Passive Skills grant: ', '')
          .trim()
        return processMatchWithOptions(baseText, key, modifierText)
      }

      if (value.startsWith('Allocates')) {
        const forbiddenMatches = ['Forbidden Flesh', 'Forbidden Flame']
        for (let forbidden of forbiddenMatches) {
          if (value.includes(forbidden)) {
            const baseText = `Allocates # if you have matching modifier on ${forbidden}`
            const modifierText = value.match(/Allocates (.*?) if you/)[1].trim()
            return processMatchWithOptions(baseText, key, modifierText)
          }
        }
        // Handle other "Allocates" cases without Forbidden Flesh/Flame
        const baseText = `Allocates #`
        const modifierText = value.replace('Allocates ', '').trim()
        return processMatchWithOptions(baseText, key, modifierText)
      }

      return null
    }

    // Main function to process the item data and query the trade stats
    function processItemDataWithTradeStats (itemData, tradeStats) {
      const processedData = {}

      // List of mod groups to process
      const modGroups = ['enchant', 'implicitMods', 'explicitMods']

      modGroups.forEach(groupName => {
        const group = itemData[groupName]
        if (!group || Object.keys(group).length === 0) return

        Object.keys(group).forEach(key => {
          const mods = group[key]
          let i = 0

          while (i < mods.length) {
            const modValue = mods[i]
            const nextModValue = mods[i + 1] || '' // Get the next mod value if it exists

            // Determine if the current group is an enchant
            const isEnchant = groupName === 'enchant'

            let result = queryTradeStats(
              tradeStats,
              key,
              modValue,
              itemData.baseType,
              isEnchant
            )

            if (!result && nextModValue) {
              // Attempt to join this mod with the next mod using a literal '\n' between them
              const combinedModValue = `${modValue}\n${nextModValue}`

              result = queryTradeStats(
                tradeStats,
                key,
                combinedModValue,
                itemData.baseType,
                isEnchant
              )
              if (result) {
                i++ // Skip the next mod since it's part of the combined mod
              }
            }

            if (!result) {
              // Handle special cases like "Added Small Passive Skills grant: ..."
              result = handleSpecialCases(
                tradeStats,
                key,
                modValue,
                itemData.baseType
              )
            }

            if (result) {
              if (!processedData[groupName]) processedData[groupName] = []
              processedData[groupName].push(result)
            }

            i++
          }
        })
      })

      // Add the processed data to the main itemData structure
      itemData.poeInternalModifierValues = processedData

      return processedData
    }
  }
})
