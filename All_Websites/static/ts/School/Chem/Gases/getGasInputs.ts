const DEFAULT_AMOUNT_VALUE = "?";
const NUMBER_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/; // scientific notation allowed

// Collect all input fields for validation
const amountInputs = document.querySelectorAll<HTMLInputElement>('#givens input[type="text"]');

// Validation function
const validateAmountInput = (input: HTMLInputElement) => {
  const value = input.value.trim();

  if (value === "" || value === DEFAULT_AMOUNT_VALUE) {
    input.setCustomValidity("");
    return;
  }

  // Test using NUMBER_PATTERN, which allows numbers and scientific notation
  if (NUMBER_PATTERN.test(value)) {
    input.setCustomValidity("");
  } else {
    input.setCustomValidity("Enter a valid number or ? (scientific notation allowed).");
  }
};

function fixInputValue(value: string) {
  if (value === DEFAULT_AMOUNT_VALUE) {
    return null;
  }
  return Number(value);
}

function getInputPair(valueId: string, unitId: string): [number | null, string] {
  const valueInput: HTMLInputElement =  document.getElementById(valueId) as HTMLInputElement
  const unitInput: HTMLInputElement = document.getElementById(unitId) as HTMLInputElement
  return [
    fixInputValue(valueInput.value),
    unitInput.value
  ];
}

export let GBV: [number | null, string] = [null, ""];
export let GBP: [number | null, string] = [null, ""];
export let GBT: [number | null, string] = [null, ""];
export let GBN: [number | null, string] = [null, ""];
export let GAV: [number | null, string] = [null, ""];
export let GAP: [number | null, string] = [null, ""];
export let GAT: [number | null, string] = [null, ""];
export let GAN: [number | null, string] = [null, ""];

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
amountInputs.forEach((input: HTMLInputElement) => {
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
