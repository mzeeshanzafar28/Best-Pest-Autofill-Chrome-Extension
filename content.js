// content.js - Listener for Autofill Only

console.log("BEST@PEST: Content script LOADED on", window.location.href);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillForm") {
    // Check if input exists, create if not
    let dataInput = document.getElementById('extension-autofill-data');
    if (!dataInput) {
        dataInput = document.createElement('input');
        dataInput.type = 'hidden';
        dataInput.id = 'extension-autofill-data';
        document.body.appendChild(dataInput);
    }
    // Set data
    dataInput.value = JSON.stringify(request.data);

    // Inject Form Filler Script
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('form-filler.js');
    s.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(s);
  }
});