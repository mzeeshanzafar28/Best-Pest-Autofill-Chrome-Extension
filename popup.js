// =================================================================
// 1. HELPER: LIVE CHECKER
// =================================================================
// This function runs IN the web page to check if our script is active
function checkScriptStatus() {
    return !!window.bpMonitorActive; // Returns true if running
}

// =================================================================
// 2. MATERIAL AUTOFILL (Runs in Main World)
// =================================================================
function fillFormInPage(data) {
    console.log("Extension: Starting autofill with data:", data);

    if (typeof window.jQuery === 'undefined') {
        alert("Error: jQuery is not loaded on this page.");
        return;
    }

    const $ = window.jQuery;

    if ($('#ddlmaterials').length) {
        $('#ddlmaterials').val(data.materialId).trigger('change');
    }

    setTimeout(() => {
        try {
            if(document.getElementById('txtmatamt')) {
                document.getElementById('txtmatamt').value = data.quantity;
                $('#txtmatamt').trigger('keyup').trigger('blur'); 
            }

            if (data.locationVal && data.locationVal !== "0|None") {
                const parts = data.locationVal.split('|');
                const valID = data.locationVal;
                const valText = parts[1] || ""; 
                $('#ddllocations_comboboxValue').val(valID);
                $('#ddllocations_textFilter').val(valText);
                if (typeof window.setlocation_V3 === 'function') {
                    window.setlocation_V3(valID);
                }
            }

            $('#ddlappmethod').val(data.methodId).trigger('change');
            $('#ddlequipment').val(data.equipmentId).trigger('change');

            if ($('#ddlmattarget').hasClass('select2-hidden-accessible')) {
                $('#ddlmattarget').val(data.targetId).trigger('change');
            } else {
                $('#ddlmattarget').val(data.targetId).trigger('change');
            }

            $('#txtmattargetqty').val('1').trigger('blur');
            console.log("Autofill Complete");

        } catch (err) {
            console.error("Error in autofill:", err);
        }
    }, 300);
}

// =================================================================
// 3. SCHEDULER INJECTOR
// =================================================================
function startSchedulerMonitor() {
    console.log("BEST@PEST: Manual Injection Started!");

    // Prevents double-injection if button is clicked multiple times
    if (window.bpMonitorActive) return;
    window.bpMonitorActive = true;

    function isJobCompleted(workOrderId) {
        const jobTitleEl = document.querySelector(`.title-woheaderid[data-woheaderid="${workOrderId}"]`);
        if (!jobTitleEl) return false;
        
        const jobCard = jobTitleEl.closest('.fc-time-grid-event');
        if (jobCard && jobCard.querySelector('.notifC')) {
            return true;
        }
        return false;
    }

    function updateOrInjectButton(container) {
        const pTag = container.querySelector('p');
        const titleElem = document.getElementById('modalTitle');

        if (!pTag || !titleElem) return; 

        const accMatch = pTag.innerText.match(/Account.*:\s*(\d+)/i);
        const woMatch = titleElem.innerText.match(/#\s*(\d+)/);

        if (!accMatch || !woMatch) return;

        const accountId = accMatch[1];
        const workOrderId = woMatch[1];

        const completed = isJobCompleted(workOrderId);
        const existingBtn = document.getElementById('btn-complete-job-ext');

        if (completed) {
            if (existingBtn) existingBtn.remove();
            return;
        }

        if (!existingBtn) {
            const btn = document.createElement('button');
            btn.id = 'btn-complete-job-ext';
            btn.innerText = 'Complete Job';
            
            Object.assign(btn.style, {
                backgroundColor: '#28a745', color: 'white', border: 'none',
                padding: '8px 12px', width: '100%', borderRadius: '4px',
                fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
                marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            });

            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                const url = `https://sprolive.theservicepro.net/office/wocompleted.aspx?accid=${accountId}&woid=${workOrderId}&type=1`;
                window.open(url, '_blank');
            };

            container.insertBefore(btn, container.firstChild);
        } else {
            existingBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                const url = `https://sprolive.theservicepro.net/office/wocompleted.aspx?accid=${accountId}&woid=${workOrderId}&type=1`;
                window.open(url, '_blank');
            };
        }
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                const container = document.getElementById('paragrafwotab');
                if (container) {
                    updateOrInjectButton(container);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    alert("Best@Pest: Scheduler Monitor is now ACTIVE!");
}


// =================================================================
// 4. EVENT LISTENERS
// =================================================================
document.addEventListener('DOMContentLoaded', async () => {
    
    // A. CHECK IF SCRIPT IS ALREADY RUNNING
    const toggleContainer = document.getElementById('injection-container');
    const statusDiv = document.getElementById('injection-status');
    const toggle = document.getElementById('toggle-injection');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Only check on ServicePro
        if(tab.url && tab.url.includes("theservicepro.net")) {
            
            // Execute the checker function
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: checkScriptStatus,
                world: 'MAIN'
            });

            // If it returns true, the script is running -> Hide toggle
            if (results && results[0] && results[0].result === true) {
                toggleContainer.style.display = 'none';
                statusDiv.style.display = 'block';
            }
        }
    } catch (e) {
        console.log("Not on ServicePro or script error", e);
    }

    // B. HANDLE TOGGLE CLICK
    if(toggle) {
        toggle.addEventListener('change', async (e) => {
            if(e.target.checked) {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                // Inject the script
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: startSchedulerMonitor,
                    world: 'MAIN'
                });

                // Update UI immediately (Hide toggle, show text)
                toggleContainer.style.display = 'none';
                statusDiv.style.display = 'block';
            }
        });
    }

    // C. HANDLE MATERIAL BUTTONS
    document.body.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('mat-btn')) return;

        const btn = e.target;
        const data = {
            materialId: btn.getAttribute('data-id'),
            quantity: btn.getAttribute('data-qty'),
            locationVal: btn.getAttribute('data-loc'),
            methodId: btn.getAttribute('data-method'),
            equipmentId: btn.getAttribute('data-equip'),
            targetId: btn.getAttribute('data-target')
        };

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: fillFormInPage,
            args: [data],
            world: 'MAIN'
        });
    });
});