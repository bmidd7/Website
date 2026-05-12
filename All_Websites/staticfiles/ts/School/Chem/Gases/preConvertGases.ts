declare const katex: {
  render: (
    expression: string,
    element: HTMLElement,
    options?: { throwOnError?: boolean },
  ) => void;
};

import { ColorArray, InputArray, removeColor } from "./localModules.js";

const KELVIN_OFFSET = 273;
const KPA_PER_ATM = 101.325;
const MMHG_PER_ATM = 760;
const ML_PER_LITER = 1000;

function formatNumber(value: number) {
  return Number(value.toFixed(3));
}

export function convertTempToKelvin(
  div: HTMLDivElement,
  temp: InputArray,
  colors: ColorArray,
): InputArray | undefined {
  const [tempNumber, tempUnit] = temp;
  if (tempNumber === null || tempUnit === null) {
    return;
  }

  if (tempUnit === "Kelvin") {
    return [tempNumber, "Kelvin"];
  }

  const tempConvertDiv = div.appendChild(document.createElement("div"));
  tempConvertDiv.id = "preconvert-to-kelvin";

  const startColor = colors[0];
  const middleColor = colors[1];
  const endColor = colors[2];
  removeColor(colors, 3);

  if (tempUnit === "Celsius") {
    const newTemp = tempNumber + KELVIN_OFFSET;

    katex.render(
      `\\textcolor{${startColor}}{${formatNumber(tempNumber)}\\ ^{\\circ}\\mathrm{C}} + ` +
        `\\textcolor{${middleColor}}{273\\ \\mathrm{K}} = ` +
        `\\textcolor{${endColor}}{${formatNumber(newTemp)}\\ \\mathrm{K}}`,
      tempConvertDiv,
      { throwOnError: false },
    );

    return [newTemp, "Kelvin"];
  }

  const newTemp = ((tempNumber - 32) * 5) / 9 + KELVIN_OFFSET;
  katex.render(
    `(\\textcolor{${startColor}}{${formatNumber(tempNumber)}\\ ^{\\circ}\\mathrm{F}} - ` +
      `\\textcolor{${startColor}}{32\\ ^{\\circ}\\mathrm{F}}) ` +
      `\\cdot \\frac{\\textcolor{${middleColor}}{5\\ ^{\\circ}\\mathrm{C}}}{\\textcolor{${startColor}}{9\\ ^{\\circ}\\mathrm{F}}} + ` +
      `\\textcolor{${middleColor}}{273\\ \\mathrm{K}} = ` +
      `\\textcolor{${endColor}}{${formatNumber(newTemp)}\\ \\mathrm{K}}`,
    tempConvertDiv,
    { throwOnError: false },
  );

  return [newTemp, "Kelvin"];
}

export function convertPressureToAtmosphere(
  div: HTMLDivElement,
  pressure: InputArray,
  colors: ColorArray,
): InputArray | undefined {
  const [pressureNumber, pressureUnit] = pressure;
  if (pressureNumber === null || pressureUnit === null) {
    return;
  }

  if (pressureUnit === "Atmosphere") {
    return [pressureNumber, "Atmosphere"];
  }

  const pressureConvertDiv = div.appendChild(document.createElement("div"));
  pressureConvertDiv.id = "preconvert-pressure";

  const startColor = colors[0];
  const endColor = colors[1];
  removeColor(colors, 2);

  let newPressure = pressureNumber;
  let equation = "";

  if (pressureUnit === "Kilopascal") {
    newPressure = pressureNumber / KPA_PER_ATM;
    equation =
      `\\textcolor{${startColor}}{${formatNumber(pressureNumber)}\\ \\mathrm{kPa}} \\cdot ` +
      `\\frac{\\textcolor{${endColor}}{1\\ \\mathrm{atm}}}{\\textcolor{${startColor}}{101.325\\ \\mathrm{kPa}}} = ` +
      `\\textcolor{${endColor}}{${formatNumber(newPressure)}\\ \\mathrm{atm}}`;
  } else if (pressureUnit === "Pascal") {
    newPressure = pressureNumber / (KPA_PER_ATM * 1000);
    equation =
      `\\textcolor{${startColor}}{${formatNumber(pressureNumber)}\\ \\mathrm{Pa}} \\cdot ` +
      `\\frac{\\textcolor{${endColor}}{1\\ \\mathrm{atm}}}{\\textcolor{${startColor}}{101325\\ \\mathrm{Pa}}} = ` +
      `\\textcolor{${endColor}}{${formatNumber(newPressure)}\\ \\mathrm{atm}}`;
  } else if (pressureUnit === "mmHg" || pressureUnit === "Torr") {
    newPressure = pressureNumber / MMHG_PER_ATM;
    equation =
      `\\textcolor{${startColor}}{${formatNumber(pressureNumber)}\\ \\mathrm{${pressureUnit}}} \\cdot ` +
      `\\frac{\\textcolor{${endColor}}{1\\ \\mathrm{atm}}}{\\textcolor{${startColor}}{760\\ \\mathrm{${pressureUnit}}}} = ` +
      `\\textcolor{${endColor}}{${formatNumber(newPressure)}\\ \\mathrm{atm}}`;
  } else {
    pressureConvertDiv.remove();
    return [pressureNumber, pressureUnit];
  }

  katex.render(equation, pressureConvertDiv, { throwOnError: false });
  return [newPressure, "Atmosphere"];
}

export function convertVolumeToLiters(
  div: HTMLDivElement,
  volume: InputArray,
  colors: ColorArray,
): InputArray | undefined {
  const [volumeNumber, volumeUnit] = volume;
  if (volumeNumber === null || volumeUnit === null) {
    return;
  }

  if (volumeUnit === "Liters") {
    return [volumeNumber, "Liters"];
  }

  const volumeConvertDiv = div.appendChild(document.createElement("div"));
  volumeConvertDiv.id = "preconvert-volume";

  const startColor = colors[0];
  const endColor = colors[1];
  removeColor(colors, 2);

  if (volumeUnit === "Milliliters" || volumeUnit === "Cubic Centimeters") {
    const newVolume = volumeNumber / ML_PER_LITER;
    const shortUnit = volumeUnit === "Milliliters" ? "mL" : "cm^3";

    katex.render(
      `\\textcolor{${startColor}}{${formatNumber(volumeNumber)}\\ \\mathrm{${shortUnit}}} \\cdot ` +
        `\\frac{\\textcolor{${endColor}}{1\\ \\mathrm{L}}}{\\textcolor{${startColor}}{1000\\ \\mathrm{${shortUnit}}}} = ` +
        `\\textcolor{${endColor}}{${formatNumber(newVolume)}\\ \\mathrm{L}}`,
      volumeConvertDiv,
      { throwOnError: false },
    );

    return [newVolume, "Liters"];
  }

  volumeConvertDiv.remove();
  return [volumeNumber, volumeUnit];
}
