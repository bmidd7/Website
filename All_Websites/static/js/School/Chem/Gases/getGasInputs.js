const DEFAULT_AMOUNT_VALUE = "?";
const NUMBER_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/; // scientific notation allowed
const GAS_INPUTS_COOKIE_NAME = "gases-page-inputs";
const GAS_INPUTS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 2.5;
// Collect all input fields for validation
const amountInputs = document.querySelectorAll('#givens input[type="text"]');
const gasFormFields = document.querySelectorAll("#givens input, #givens select");
// Validation function
const validateAmountInput = (input) => {
    const value = input.value.trim();
    if (value === "" || value === DEFAULT_AMOUNT_VALUE) {
        input.setCustomValidity("");
        return;
    }
    // Test using NUMBER_PATTERN, which allows numbers and scientific notation
    if (NUMBER_PATTERN.test(value)) {
        input.setCustomValidity("");
    }
    else {
        input.setCustomValidity("Enter a valid number or ? (scientific notation allowed).");
    }
};
function getCookieValue(cookieName) {
    const cookiePrefix = `${cookieName}=`;
    const matchingCookie = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(cookiePrefix));
    if (!matchingCookie) {
        return null;
    }
    return matchingCookie.slice(cookiePrefix.length);
}
function clearGasInputsCookie() {
    document.cookie = `${GAS_INPUTS_COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
}
function saveGasInputsCookie() {
    const savedValues = {};
    gasFormFields.forEach((field) => {
        if (field.id) {
            savedValues[field.id] = field.value;
        }
    });
    document.cookie = `${GAS_INPUTS_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(savedValues))}; max-age=${GAS_INPUTS_COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
}
function restoreGasInputsFromCookie() {
    const savedCookieValue = getCookieValue(GAS_INPUTS_COOKIE_NAME);
    if (!savedCookieValue) {
        return;
    }
    try {
        const savedValues = JSON.parse(decodeURIComponent(savedCookieValue));
        gasFormFields.forEach((field) => {
            const savedValue = savedValues[field.id];
            if (typeof savedValue !== "string") {
                return;
            }
            if (field instanceof HTMLSelectElement) {
                const hasMatchingOption = Array.from(field.options).some((option) => option.value === savedValue);
                if (hasMatchingOption) {
                    field.value = savedValue;
                }
                return;
            }
            field.value = savedValue;
            validateAmountInput(field);
        });
    }
    catch {
        clearGasInputsCookie();
    }
}
function fixInputValue(value) {
    if (value === DEFAULT_AMOUNT_VALUE) {
        return null;
    }
    return Number(value);
}
function fixInputUnit(unit) {
    if (unit === "Default") {
        return null;
    }
    else {
        return unit;
    }
}
function getInputPair(valueId, unitId) {
    const valueInput = document.getElementById(valueId);
    const unitInput = document.getElementById(unitId);
    return [
        fixInputValue(valueInput.value),
        fixInputUnit(unitInput.value)
    ];
}
export let GBV = [null, null];
export let GBP = [null, null];
export let GBT = [null, null];
export let GBN = [null, null];
export let GAV = [null, null];
export let GAP = [null, null];
export let GAT = [null, null];
export let GAN = [null, null];
export function refreshGasInputs() {
    GBV = getInputPair("before-volume-given", "before-volume-unit-given");
    GBP = getInputPair("before-pressure-given", "before-pressure-unit-given");
    GBT = getInputPair("before-temperature-given", "before-temperature-unit-given");
    GBN = getInputPair("before-particles-given", "before-particles-unit-given");
    GAV = getInputPair("after-volume-given", "after-volume-unit-given");
    GAP = getInputPair("after-pressure-given", "after-pressure-unit-given");
    GAT = getInputPair("after-temperature-given", "after-temperature-unit-given");
    GAN = getInputPair("after-particles-given", "after-particles-unit-given");
    return { GBV, GBP, GBT, GBN, GAV, GAP, GAT, GAN };
}
export function getGasInputs() {
    return refreshGasInputs();
}
// Event listeners for each input
amountInputs.forEach((input) => {
    // Select text when focused if it is the default value
    input.addEventListener("focus", () => {
        if (input.value === DEFAULT_AMOUNT_VALUE) {
            input.select();
        }
    });
    // Validate on input
    input.addEventListener("input", () => {
        validateAmountInput(input);
        refreshGasInputs();
        saveGasInputsCookie();
    });
    // Validate on blur and reset default if invalid
    input.addEventListener("blur", () => {
        if (input.value.trim() === "" || (!NUMBER_PATTERN.test(input.value) && input.value !== DEFAULT_AMOUNT_VALUE)) {
            input.value = DEFAULT_AMOUNT_VALUE;
            input.setCustomValidity("Enter a valid number or ? (scientific notation allowed).");
        }
        validateAmountInput(input);
        input.reportValidity();
        refreshGasInputs();
        saveGasInputsCookie();
    });
});
const amountSelects = document.querySelectorAll('#givens select');
amountSelects.forEach((select) => {
    select.addEventListener("change", () => {
        refreshGasInputs();
        saveGasInputsCookie();
    });
});
// Initialize on load in case there are preset values.
restoreGasInputsFromCookie();
refreshGasInputs();
saveGasInputsCookie();
export function convertToQuadernary() {
}
//# sourceMappingURL=getGasInputs.js.map