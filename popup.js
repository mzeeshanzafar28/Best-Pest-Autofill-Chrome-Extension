// -------------------------------------------------------------
// PART 1: MATERIAL AUTOFILL (Existing Logic)
// -------------------------------------------------------------
function fillFormInPage(data) {
    console.log("Extension: Starting autofill with data:", data);

    if (typeof window.jQuery === 'undefined') {
        alert("Error: jQuery is not loaded on this page.");
        return;
    }

    const $ = window.jQuery;

    // 1. Set Material
    if ($('#ddlmaterials').length) {
        $('#ddlmaterials').val(data.materialId).trigger('change');
    }

    // 2. Set other fields after delay
    setTimeout(() => {
        try {
            if(document.getElementById('txtmatamt')) {
                document.getElementById('txtmatamt').value = data.quantity;
                $('#txtmatamt').trigger('keyup').trigger('blur'); 
            }

            if (data.locationVal) {
                const parts = data.locationVal.split('|');
                const valID = data.locationVal;
                const valText = parts[1] || "None"; 
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

// -------------------------------------------------------------
// PART 2: SCHEDULER INJECTOR (New Manual Trigger)
// -------------------------------------------------------------
function startSchedulerMonitor() {
    console.log("BEST@PEST: Manual Injection Started via Toggle!");

    if (window.bpMonitorActive) {
        console.log("BEST@PEST: Monitor already active.");
        return;
    }
    window.bpMonitorActive = true;

    // 1. HELPER: Check Status from Calendar DOM
    function isJobCompleted(workOrderId) {
        const jobTitleEl = document.querySelector(`.title-woheaderid[data-woheaderid="${workOrderId}"]`);
        if (!jobTitleEl) return false;
        
        const jobCard = jobTitleEl.closest('.fc-time-grid-event');
        if (jobCard && jobCard.querySelector('.notifC')) {
            return true;
        }
        return false;
    }

    // 2. INJECTION LOGIC
    function updateOrInjectButton(container) {
        // Extract Data First
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

        // SCENARIO 1: Completed -> Remove
        if (completed) {
            if (existingBtn) {
                existingBtn.remove();
                console.log(`BEST@PEST: Job #${workOrderId} is COMPLETED. Button removed.`);
            }
            return;
        }

        // SCENARIO 2: Open -> Add/Update
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

            btn.onmouseover = () => btn.style.backgroundColor = '#218838';
            btn.onmouseout = () => btn.style.backgroundColor = '#28a745';

            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                const url = `https://sprolive.theservicepro.net/office/wocompleted.aspx?accid=${accountId}&woid=${workOrderId}&type=1`;
                window.open(url, '_blank');
            };

            container.insertBefore(btn, container.firstChild);
            console.log(`BEST@PEST: Button CREATED for WO #${workOrderId}`);

        } else {
            existingBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                const url = `https://sprolive.theservicepro.net/office/wocompleted.aspx?accid=${accountId}&woid=${workOrderId}&type=1`;
                window.open(url, '_blank');
            };
            console.log(`BEST@PEST: Button UPDATED for WO #${workOrderId}`);
        }
    }

    // 3. OBSERVER
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


// -------------------------------------------------------------
// EVENT LISTENERS
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    
    // A. Toggle Listener
    const toggle = document.getElementById('toggle-injection');
    if(toggle) {
        toggle.addEventListener('change', async (e) => {
            if(e.target.checked) {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: startSchedulerMonitor,
                    world: 'MAIN'
                });
            }
        });
    }

    // B. Material Buttons Listener
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