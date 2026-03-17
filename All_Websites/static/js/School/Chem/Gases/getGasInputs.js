const DEFAULT_AMOUNT_VALUE = "?";
const NUMBER_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/; // scientific notation allowed
// Collect all input fields for validation
const amountInputs = document.querySelectorAll('#givens input[type="text"]');
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
function fixInputValue(value) {
    if (value === DEFAULT_AMOUNT_VALUE) {
        return null;
    }
    return Number(value);
}
function getInputPair(valueId, unitId) {
    return [
        fixInputValue(document.getElementById(valueId).value),
        document.getElementById(unitId).value,
    ];
}
export let GBV = [null, ""];
export let GBP = [null, ""];
export let GBT = [null, ""];
export let GBN = [null, ""];
export let GAV = [null, ""];
export let GAP = [null, ""];
export let GAT = [null, ""];
export let GAN = [null, ""];
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
    });
});
const amountSelects = document.querySelectorAll('#givens select');
amountSelects.forEach((select) => {
    select.addEventListener("change", () => {
        refreshGasInputs();
    });
});
// Initialize on load in case there are preset values.
refreshGasInputs();
//# sourceMappingURL=getGasInputs.js.map