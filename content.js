chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillForm") {
    // 1. Pass data to page via hidden input
    let dataInput = document.getElementById('extension-autofill-data');
    if (!dataInput) {
        dataInput = document.createElement('input');
        dataInput.type = 'hidden';
        dataInput.id = 'extension-autofill-data';
        document.body.appendChild(dataInput);
    }
    dataInput.value = JSON.stringify(request.data);

    // 2. Inject the script
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('form-filler.js');
    s.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(s);
  }
});