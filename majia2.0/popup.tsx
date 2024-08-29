import { useEffect, useRef, useState } from "react"

import "./styles.css"

import { Button, Input } from "antd"

// 获取当前tab标签
async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true }
  let [tab] = await chrome.tabs.query(queryOptions)
  return tab
}

function getDomain(url) {
  const urlPattern = /https?:\/\/(?:www\.)?([^\/:?#]+)(?:[\/:?#]|$)/i
  const match = url.match(urlPattern)
  if (match) {
    let domain = match[1]
    // 去掉顶级域名部分
    domain = domain.replace(/\.[a-zA-Z]{2,}$/, "")
    return domain
  }
  return null
}

async function getStorage(key) {
  const result = await chrome.storage.local.get([`${key}`])
  return result[key]
}

function IndexPopup() {
  const [accountList, setAccountList] = useState([])
  const [domain, setDomain] = useState("")
  const [tab, setTab] = useState({})
  const [currentAccount, setCurrentAccount] = useState("")
  const [msg, setMessage] = useState("")
  const [name, setName] = useState("")
  const [showInput, setShowInput] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      // 获取tab页信息
      const tab = await getCurrentTab()
      setTab(tab)
      const domain = getDomain(tab.url)
      setDomain(domain)
      let storageData = await getStorage(domain)
      if (!storageData) {
        storageData = {
          list: [],
          currentAccount: "",
          message: ""
        }
      }
      setAccountList(storageData.list)
      setCurrentAccount(storageData.currentAccount)
      setMessage(storageData.message)
      console.log("22222")
      setName(
        storageData.list.find((item) => item.id === storageData.currentAccount)
          ?.name || ""
      )
    }
    fetchData()
  }, [])

  // 点击事件
  async function handleClick(action, item = undefined) {
    const res = await chrome.runtime.sendMessage({
      action,
      message: {
        tab,
        domain,
        item
      }
    })
    console.log("res================", res)
    setAccountList(res.list)
    setCurrentAccount(res.currentAccount)
    setMessage(res.message)
    console.log("11111")
    setName(res.list.find((item) => item.id === res.currentAccount)?.name || "")
  }

  function AccountButton({ list }) {
    return list.length === 0 ? (
      <span>当前页面没有保存的账号</span>
    ) : (
      list.map((item) => (
        <Button
          className={`account-button ${item.id === currentAccount ? "selected" : ""}`}
          key={item.id}
          onClick={() => handleClick("selectAccount", item)}>
          {item.name}
        </Button>
      ))
    )
  }

  function renameAccount() {
    setShowInput(true)
  }

  function OperateBtn({ list }) {
    const saveBtn = (
      <Button onClick={(e) => handleClick("saveAccount")}>保存当前账号</Button>
    )
    if (list.length > 0) {
      return (
        <div>
          {saveBtn}
          <Button onClick={(e) => handleClick("delAccount")}>
            删除当前账号
          </Button>
          <Button onClick={(e) => renameAccount()}>重命名</Button>
        </div>
      )
    } else {
      return <div>{saveBtn}</div>
    }
  }

  function onPressEnter(e) {
    setShowInput(false)
    console.log(e.target.value)
    handleClick("renameAccount", { id: currentAccount, name: e.target.value })
  }

  const handleChange = (e) => {
    console.log("33333")
    setName(e.target.value)
  }

  const inputRef = useRef(null)

  return (
    <div
      style={{
        width: 300,
        padding: 10,
        display: "flex",
        flexDirection: "column"
      }}>
      <span>{msg}</span>
      <h3>当前网站账号</h3>
      <div>
        <div style={{ marginBottom: 10 }}>
          <AccountButton list={accountList} />
        </div>
        <OperateBtn list={accountList}></OperateBtn>
        {showInput && (
          <Input
            ref={inputRef}
            placeholder="重命名保存的账号"
            value={name}
            onChange={handleChange}
            onPressEnter={onPressEnter}
          />
        )}
      </div>
    </div>
  )
}

export default IndexPopup
