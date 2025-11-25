// The function that runs INSIDE the web page
function fillFormInPage(data) {
    console.log("Extension: Starting autofill with data:", data);

    // Helper to check if jQuery is loaded
    if (typeof window.jQuery === 'undefined') {
        alert("Error: jQuery is not loaded on this page. The extension cannot control the form.");
        return;
    }

    const $ = window.jQuery; // Use the page's jQuery

    // 1. Set Material (Select2)
    // We target the ID directly.
    if ($('#ddlmaterials').length) {
        $('#ddlmaterials').val(data.materialId).trigger('change');
        console.log("Set Material to:", data.materialId);
    } else {
        console.warn("Could not find #ddlmaterials");
    }

    // 2. Wait 300ms for the page to update (prices/units), then set the rest
    setTimeout(() => {
        try {
            // Set Quantity
            if(document.getElementById('txtmatamt')) {
                document.getElementById('txtmatamt').value = data.quantity;
                // Trigger events so totals calculate
                $('#txtmatamt').trigger('keyup').trigger('blur'); 
            }

            // Set Location (Custom ComboBox)
            // Fix: We now allow "0|None" to run so it correctly CLEARS previous locations
            if (data.locationVal) {
                const parts = data.locationVal.split('|');
                const valID = data.locationVal;
                const valText = parts[1] || "None"; // Default to None if text missing

                // Set hidden value and visible text
                $('#ddllocations_comboboxValue').val(valID);
                $('#ddllocations_textFilter').val(valText);

                // Try calling the page's specific function to register the change
                if (typeof window.setlocation_V3 === 'function') {
                    window.setlocation_V3(valID);
                }
            }

            // Set Application Method
            $('#ddlappmethod').val(data.methodId).trigger('change');

            // Set Equipment
            $('#ddlequipment').val(data.equipmentId).trigger('change');

            // Set Target Pest
            // Check if target is Select2 or standard
            if ($('#ddlmattarget').hasClass('select2-hidden-accessible')) {
                $('#ddlmattarget').val(data.targetId).trigger('change');
            } else {
                $('#ddlmattarget').val(data.targetId).trigger('change');
            }

            // Set Target Quantity (Always 1)
            $('#txtmattargetqty').val('1').trigger('blur');
            
            console.log("Autofill Complete");

        } catch (err) {
            console.error("Error in autofill timeout:", err);
        }
    }, 300);
}

// Event Listener for the Popup Buttons
document.addEventListener('DOMContentLoaded', () => {
    // FIX: Listen to the whole body so ALL sections work, not just the first one
    document.body.addEventListener('click', async (e) => {
        
        // Ensure a button was clicked
        if (e.target.tagName !== 'BUTTON') return;

        const btn = e.target;
        const data = {
            materialId: btn.getAttribute('data-id'),
            quantity: btn.getAttribute('data-qty'),
            locationVal: btn.getAttribute('data-loc'),
            methodId: btn.getAttribute('data-method'),
            equipmentId: btn.getAttribute('data-equip'),
            targetId: btn.getAttribute('data-target')
        };

        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Execute the function in the "MAIN" world (where page JS lives)
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: fillFormInPage,
            args: [data],
            world: 'MAIN' // <--- CRITICAL: Allows access to window.$ and window.setlocation_V3
        });
    });
});