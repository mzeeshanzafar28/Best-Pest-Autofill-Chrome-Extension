// content.js - Best@Pest Workflow Suite (DOM-Reference Version)

console.log("BEST@PEST: Content script LOADED on", window.location.href);

// =================================================================
// PART A: AUTOFILL LISTENER (Materials)
// =================================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillForm") {
    let dataInput = document.getElementById('extension-autofill-data');
    if (!dataInput) {
        dataInput = document.createElement('input');
        dataInput.type = 'hidden';
        dataInput.id = 'extension-autofill-data';
        document.body.appendChild(dataInput);
    }
    dataInput.value = JSON.stringify(request.data);
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('form-filler.js');
    s.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(s);
  }
});

// =================================================================
// PART B: SCHEDULER MONITOR (Complete Job Button)
// =================================================================
(function() {
    if (!window.location.hostname.includes('theservicepro.net')) return;

    // 1. MUTATION OBSERVER: Watch for Modal
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                const container = document.getElementById('paragrafwotab');
                if (container) {
                    // Always try to update/inject when the container appears or changes
                    updateOrInjectButton(container);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 2. HELPER: Check Status from Calendar DOM
    function isJobCompleted(workOrderId) {
        // Find the job card on the calendar using the WO ID
        // Selector based on your HTML: <div class="title-woheaderid" data-woheaderid="12345">
        const jobTitleEl = document.querySelector(`.title-woheaderid[data-woheaderid="${workOrderId}"]`);
        
        if (!jobTitleEl) {
            console.warn(`BEST@PEST: Could not find job card for WO #${workOrderId} on calendar.`);
            return false; // Assume open if we can't find it (safer)
        }

        // Look for the "Completed" icon (notifC) inside that card or its parent
        // The icon is usually a sibling or child. Based on your HTML, it's inside a .pull-right div inside the title
        // We check the entire job card container just to be safe
        const jobCard = jobTitleEl.closest('.fc-time-grid-event');
        if (jobCard && jobCard.querySelector('.notifC')) {
            return true;
        }
        
        return false;
    }

    // 3. INJECTION LOGIC
    function updateOrInjectButton(container) {
        // A. Extract Data First
        const pTag = container.querySelector('p');
        const titleElem = document.getElementById('modalTitle');

        if (!pTag || !titleElem) return; // Data not ready

        // Regex
        const accMatch = pTag.innerText.match(/Account.*:\s*(\d+)/i);
        const woMatch = titleElem.innerText.match(/#\s*(\d+)/);

        if (!accMatch || !woMatch) return;

        const accountId = accMatch[1];
        const workOrderId = woMatch[1];

        // B. Check Completion Status
        const completed = isJobCompleted(workOrderId);
        const existingBtn = document.getElementById('btn-complete-job-ext');

        // SCENARIO 1: Job is Completed -> Remove button
        if (completed) {
            if (existingBtn) {
                existingBtn.remove();
                console.log(`BEST@PEST: Job #${workOrderId} is COMPLETED. Button removed.`);
            }
            return;
        }

        // SCENARIO 2: Job is Open -> Add/Update button
        if (!existingBtn) {
            // CREATE NEW BUTTON
            const btn = document.createElement('button');
            btn.id = 'btn-complete-job-ext';
            btn.innerText = 'Complete Job';
            
            Object.assign(btn.style, {
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none',
                padding: '8px 12px',
                width: '100%',
                borderRadius: '4px',
                fontWeight: 'bold', 
                fontSize: '13px', 
                cursor: 'pointer',
                marginBottom: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            });

            // Hover
            btn.onmouseover = () => btn.style.backgroundColor = '#218838';
            btn.onmouseout = () => btn.style.backgroundColor = '#28a745';

            // Click Action
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                const url = `https://sprolive.theservicepro.net/office/wocompleted.aspx?accid=${accountId}&woid=${workOrderId}&type=1`;
                window.open(url, '_blank');
            };

            // Inject at Top
            container.insertBefore(btn, container.firstChild);
            console.log(`BEST@PEST: Button CREATED for WO #${workOrderId}`);

        } else {
            // UPDATE EXISTING BUTTON
            existingBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                const url = `https://sprolive.theservicepro.net/office/wocompleted.aspx?accid=${accountId}&woid=${workOrderId}&type=1`;
                window.open(url, '_blank');
            };
            console.log(`BEST@PEST: Button UPDATED for WO #${workOrderId}`);
        }
    }

})();