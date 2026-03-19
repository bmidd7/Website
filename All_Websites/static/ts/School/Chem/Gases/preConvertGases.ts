declare const katex: {
  render: (
    expression: string,
    element: HTMLElement,
    options?: { throwOnError?: boolean },
  ) => void;
};

import { getGasInputs } from "./getGasInputs.js";
import { InputArray, ColorArray, removeColor } from "./localModules.js";
const { GBV, GBP, GBT, GBN, GAV, GAP, GAT, GAN } = getGasInputs();

export function convertInputs(
  div: HTMLDivElement,
  temp: InputArray,
  colors: ColorArray,
) {
  convertTemps(div, temp, colors);
}

function convertTemps(
  div: HTMLDivElement,
  temp: InputArray,
  color: ColorArray,
) {
  const [tempNumber, tempUnit] = temp;
  if (tempNumber === null || tempUnit === null) {
    return;
  }
  if (tempUnit !== "Kelvin") {
    const tempConvertDiv = div.appendChild(document.createElement("div"));
    tempConvertDiv.id = "preconvert-to-Kelvin";
    const CelciusColor = color[0]
    const KelvinColor = color[1]
    const FinalColor = color[2]

    removeColor(color, 3);

    if (tempUnit === "Celsius") {
      let newTemp = tempNumber + 273;
      katex.render(
        `\\textcolor{${CelciusColor}}{${tempNumber}°C} + \
        \\textcolor{${KelvinColor}}{273K} = \
        \\textcolor{${FinalColor}}{${newTemp}K}`,
        tempConvertDiv,
        { throwOnError: false },
      );
    } else {
      const FahrenheitColor = color[0]

      let newTemp = ((tempNumber - 32) * 5) / 9 + 273;
      katex.render(
        `(\\textcolor{${FahrenheitColor}}{${tempNumber}°F} - \\textcolor{${FahrenheitColor}}{32°F}) \
        \\cdot \\frac{\\textcolor{${CelciusColor}}{5°C}}{\\textcolor{${FahrenheitColor}}{9°F}} \
        \\cdot \\frac{\\textcolor{${KelvinColor}}{1K}}{\\textcolor{${CelciusColor}}{1°C}} + \\textcolor{${KelvinColor}}{273K} = \
        \\textcolor{${FinalColor}}{${Number(newTemp.toFixed(2))} K}`,
        tempConvertDiv,
        { throwOnError: false },
      );
      removeColor(color);
    }
  }
}

function convertPressure(div: HTMLDivElement, pressure: InputArray) {}

function convertUnits() {
  const { GBV, GBP, GBT, GBN, GAV, GAP, GAT, GAN } = getGasInputs();

  //convert temps to Kelvin
  const toKelvin = ([value, unit]: [number | null, string]) => {
    if (value === null) {
      return;
    }
    if (unit === "Celsius") {
      return value + 273;
    } else if (unit === "Fahrenheit") {
      return ((value - 32) * 5) / 9 + 273;
    } else {
      return value; // assume Kelvin
    }
  };
  const [BT, AT] = [GBT, GAT].map(toKelvin);

  //

  return {};
}
