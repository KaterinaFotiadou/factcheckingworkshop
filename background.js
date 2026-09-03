// URL of your backend on Vercel
const BACKEND_URL = "https://factcheck-backend-seven.vercel.app/api/check";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "check-selection",
    title: "Check with Multi-Source Verification",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "check-selection" && info.selectionText) {
    chrome.storage.local.set({ pendingClaim: info.selectionText }, () => {
      chrome.action.setBadgeText({ text: "1" });
      chrome.action.setBadgeBackgroundColor({ color: "#534AB7" });

      if (chrome.action.openPopup) {
        chrome.action.openPopup().catch(() => {
        });
      }
    });
  }
});

// Called by popup.js / auto-check.js to trigger a real check via the backend
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CHECK_CLAIM_LIVE") {
    fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: request.claim, excerpt: request.excerpt || "", url: request.url || "" })
    })
      .then((res) => res.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch(() => sendResponse({ success: false }));

    return true; // keeps the connection open for the async response
  }
});