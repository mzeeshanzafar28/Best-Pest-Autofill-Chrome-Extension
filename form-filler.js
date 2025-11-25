(function() {
    // 1. Get the data injected by content.js
    const dataElement = document.getElementById('extension-autofill-data');
    if (!dataElement) return;

    const data = JSON.parse(dataElement.value);
    console.log("Autofilling Best@Pest Form with:", data);

    // --- Helper Functions ---

    // Sets Select2 dropdowns (Materials, Target)
    function setSelect2(id, value) {
        if (window.jQuery && window.jQuery('#' + id).length) {
            window.jQuery('#' + id).val(value).trigger('change');
        } else {
            // Fallback for standard select if Select2 isn't initialized
            const el = document.getElementById(id);
            if(el) { el.value = value; el.dispatchEvent(new Event('change')); }
        }
    }

    // Sets standard text inputs (Quantity, Notes)
    function setInput(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
            // Trigger events that the site might listen to for calculations
            el.dispatchEvent(new Event('keyup'));
            el.dispatchEvent(new Event('blur'));
            el.dispatchEvent(new Event('change'));
        }
    }

    // Sets standard dropdowns (Method, Equipment)
    function setStandardSelect(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
            el.dispatchEvent(new Event('change'));
        }
    }

    // Sets the custom B@P Location Combobox
    function setLocationComboBox(fullValue) {
        // fullValue comes in as "16|Kitchen"
        if (!fullValue) return;

        try {
            const parts = fullValue.split('|');
            const valueID = fullValue; // The hidden input needs "16|Kitchen"
            const textLabel = parts.length > 1 ? parts[1] : ''; // The text input needs "Kitchen"

            // 1. Set the hidden value required by the database
            const hiddenInput = document.getElementById('ddllocations_comboboxValue');
            if (hiddenInput) hiddenInput.value = valueID;

            // 2. Set the visible text for the user
            const textInput = document.getElementById('ddllocations_textFilter');
            if (textInput) textInput.value = textLabel;

            // 3. Trigger the specific site function found in HTML source line 24
            if (typeof window.setlocation_V3 === 'function') {
                window.setlocation_V3(valueID);
            } else {
                // If function not found, try triggering change on the wrapper or inputs
                if(hiddenInput) hiddenInput.dispatchEvent(new Event('change'));
            }
        } catch (e) {
            console.error("Autofill Error (Location):", e);
        }
    }

    // --- Execution Sequence ---

    // Step 1: Set Material (This usually triggers an AJAX load for unit price, etc.)
    setSelect2('ddlmaterials', data.materialId);

    // Step 2: Set Quantity immediately
    setInput('txtmatamt', data.quantity);

    // Step 3: Wait a moment for any page scripts to settle, then set the rest
    setTimeout(() => {
        
        // Set Location
        setLocationComboBox(data.locationVal);

        // Set Application Method
        setStandardSelect('ddlappmethod', data.methodId);

        // Set Equipment
        setStandardSelect('ddlequipment', data.equipmentId);

        // Set Target Pest
        // The target dropdown might be Select2 or Standard depending on page state
        setSelect2('ddlmattarget', data.targetId);

        // Set Target Quantity (Always 1)
        setInput('txtmattargetqty', '1');

    }, 200); // 200ms delay

})();