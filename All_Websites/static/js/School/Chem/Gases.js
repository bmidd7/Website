

//GB...  (Given (Before), Type, Unit/)
const GBV = [
  document.getElementById("before-volume-given").value,
  document.getElementById("before-volume-unit-given").value,
];
const GBP = [
  document.getElementById("before-pressure-given").value,
  document.getElementById("before-pressure-unit-given").value,
];
const GBT = [
  document.getElementById("before-temperature-given").value,
  document.getElementById("before-temperature-unit-given").value,
];

//GA... (Given (After), Type, Unit/)
const GAV = [
  document.getElementById("after-volume-given").value,
  document.getElementById("after-volume-unit-given").value,
];
const GAP = [
  document.getElementById("after-pressure-given").value,
  document.getElementById("after-pressure-unit-given").value,
];
const GAT = [
  document.getElementById("after-temperature-given").value,
  document.getElementById("after-temperature-unit-given").value,
];

const DEFAULT_AMOUNT_VALUE = "?";
const NUMBER_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const amountInputs = document.querySelectorAll("#givens input[type=\"text\"]");

const validateAmountInput = (input) => {
  const value = input.value.trim();

  if (value === "" || value === DEFAULT_AMOUNT_VALUE) {
    input.setCustomValidity("");
    return;
  }

  if (value === "?" || NUMBER_PATTERN.test(value)) {
    input.setCustomValidity("");
  } else {
    input.setCustomValidity("Enter a number or ?.");
  }
};

amountInputs.forEach((input) => {
  input.addEventListener("focus", () => {
    if (input.value === DEFAULT_AMOUNT_VALUE) {
      input.select();
    }
  });

  input.addEventListener("input", () => {
    validateAmountInput(input);
  });

  input.addEventListener("blur", () => {
    if (input.value.trim() === "") {
      input.value = DEFAULT_AMOUNT_VALUE;
    }
    validateAmountInput(input);
    input.reportValidity();
  });
});

