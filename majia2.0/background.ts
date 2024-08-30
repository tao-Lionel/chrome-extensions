export {}

function cookieUrl(c) {
  return (c.secure ? "https" : "http") + "://" + c.domain.replace(/^\./, "")
}

function reloadTab(id) {
  chrome.tabs.reload(id)
}

async function getAllCookiesByDomain(domain) {
  return await chrome.cookies.getAll({ domain: domain })
}

async function setAllCookiesByDomain(c) {
  const details = {
    url: cookieUrl(c),
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    expirationDate: c.expirationDate,
    storeId: c.storeId
  }
  return await chrome.cookies.set(details)
}

async function removeAllCookiesByDomain(c) {
  const details = {
    url: cookieUrl(c),
    name: c.name,
    storeId: c.storeId
  }
  return await chrome.cookies.remove(details)
}

async function setStorage(key, value) {
  chrome.storage.local.set({ [key]: value }).then(() => {
    if (chrome.runtime.lastError) {
      console.error("Error setting data:", chrome.runtime.lastError)
    } else {
      console.log("Data saved successfully")
    }
  })
}

async function getStorage(key) {
  const result = await chrome.storage.local.get([key])
  console.log("result", result)
  return result[key]
}

async function removeStorage(key) {
  chrome.storage.local.remove([key]).then(() => {
    if (chrome.runtime.lastError) {
      console.error("Error removing data:", chrome.runtime.lastError)
    } else {
      console.log("Data removed successfully")
    }
  })
}

const api = {
  saveAccount: async function (params) {
    const domain = params.domain
    console.log("domain", domain)

    let storageData = await getStorage(domain)
    if (!storageData) {
      storageData = {
        list: [],
        currentAccount: "",
        message: ""
      }
    }

    const cookies = await getAllCookiesByDomain(domain)
    console.log("cookies======", cookies)
    if (cookies && cookies.length > 0) {
      for (let i = 0; i < cookies.length; i++) {
        await removeAllCookiesByDomain(cookies[i])
      }
    } else {
      return storageData
    }

    storageData.list.push({
      name: `马甲${storageData.list.length}`,
      id: Date.now(),
      cookies
    })

    console.log("storageData=====", storageData)

    await setStorage(domain, storageData)
    reloadTab(params.tab.id)
    return storageData
  },
  selectAccount: async function (params) {
    console.log("selectAccount=======", params)

    const domain = params.domain
    const storageData = await getStorage(domain)
    storageData.currentAccount = params.item.id
    await setStorage(domain, storageData)
    const cookies = params.item.cookies
    for (let i = 0; i < cookies.length; i++) {
      await setAllCookiesByDomain(cookies[i])
    }
    reloadTab(params.tab.id)
    return storageData
  },
  delAccount: async function (params) {
    const domain = params.domain
    const storageData = await getStorage(domain)
    if (storageData.currentAccount) {
      const list = storageData.list
      let delItem = list.splice(
        list.findIndex((item) => item.id === storageData.currentAccount),
        1
      )
      console.log("delItem=====", delItem)
      const cookies = delItem[0].cookies
      for (let i = 0; i < cookies.length; i++) {
        await removeAllCookiesByDomain(cookies[i])
      }
    } else {
      // storageData.message = "当前没有登录的账号"
    }

    storageData.currentAccount = ""
    console.log("storageData.list", storageData.list)
    if (storageData.list.length === 0) {
      await removeStorage(domain)
    } else {
      await setStorage(domain, storageData)
    }

    reloadTab(params.tab.id)
    return storageData
  },
  renameAccount: async function (params) {
    const domain = params.domain
    const storageData = await getStorage(domain)
    storageData.list.forEach((item) => {
      if (item.id === params.item.id) {
        item.name = params.item.name
      }
    })
    await setStorage(domain, storageData)
    return storageData
  }
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  let fun = api[msg.action]
  if (fun) {
    const data = await fun(msg.message)
    sendResponse(data)
  }
})
