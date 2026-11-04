export {}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "CAPTURE_SCREENSHOT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (!activeTab || activeTab.windowId === undefined) {
        sendResponse({ success: false, error: "Active window not found" })
        return
      }

      chrome.tabs.captureVisibleTab(
        activeTab.windowId,
        { format: "png" },
        (dataUrl) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message })
          } else {
            sendResponse({ success: true, dataUrl })
          }
        }
      )
    })

    return true // Keep async channel open
  }
})