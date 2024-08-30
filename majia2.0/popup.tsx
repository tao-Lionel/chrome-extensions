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
    // domain = domain.replace(/\.[a-zA-Z]{2,}$/, "")
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
    setName(res.list.find((item) => item.id === res.currentAccount)?.name || "")
  }

  function AccountButton({ list }) {
    return list.length === 0 ? (
      <div>
        <div style={{ fontSize: 16 }}>尚无保存的账号</div>
        <div style={{ color: "#596064", fontSize: 12 }}>点击[保存]添加账号</div>
      </div>
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
      <Button
        onClick={(e) => handleClick("saveAccount")}
        className={"mr-10"}
        size="small">
        保存
      </Button>
    )
    if (list.length > 0) {
      return (
        <div>
          {saveBtn}
          <Button
            onClick={(e) => renameAccount()}
            className={"mr-10"}
            size="small">
            重命名
          </Button>
          <Button
            onClick={(e) => handleClick("delAccount")}
            danger
            size="small">
            删除
          </Button>
        </div>
      )
    } else {
      return <div>{saveBtn}</div>
    }
  }

  function onPressEnter(e) {
    setShowInput(false)
    handleClick("renameAccount", { id: currentAccount, name: e.target.value })
  }

  const handleChange = (e) => {
    setName(e.target.value)
  }

  return (
    <div className={"main"}>
      <div className={"header"}>
        <span>马甲</span>
      </div>
      <div className={"wrapper"}>
        <span>{msg}</span>
        <div className={"title"}> {domain}</div>
        <div>
          <div style={{ marginBottom: 10 }}>
            <AccountButton list={accountList} />
          </div>
          <OperateBtn list={accountList}></OperateBtn>
          {showInput && (
            <Input
              placeholder="重命名保存的账号"
              value={name}
              onChange={handleChange}
              onPressEnter={onPressEnter}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
