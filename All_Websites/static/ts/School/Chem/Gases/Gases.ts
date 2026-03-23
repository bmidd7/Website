declare const katex: {
  render: (
    expression: string,
    element: HTMLElement,
    options?: { throwOnError?: boolean },
  ) => void;
};

import {
  avogadrosLawN,
  avogadrosLawV,
  boylesLawP,
  boylesLawV,
  charlesLawT,
  charlesLawV,
  gayLussacsLawP,
  gayLussacsLawT,
  idealGasLawN,
  idealGasLawP,
  idealGasLawT,
  idealGasLawV,
} from "./gasFunctions.js";
import { get4DigitCode, getGasInputs } from "./getGasInputs.js";
import {
  convertPressureToAtmosphere,
  convertTempToKelvin,
  convertVolumeToLiters,
} from "./preConvertGases.js";
import { defaultColors, InputArray } from "./localModules.js";

const equationsContainer = document.getElementById("equations") as HTMLDivElement;
const givenInputs = document.querySelectorAll("#givens input, #givens select");

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "undefined";
  }

  if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.01)) {
    return value.toExponential(3);
  }

  return Number(value.toFixed(3)).toString();
}

function unitToLatex(unit: string) {
  const unitMap: Record<string, string> = {
    Atmosphere: "atm",
    Kilopascal: "kPa",
    Pascal: "Pa",
    Liters: "L",
    Milliliters: "mL",
    "Cubic Centimeters": "cm^3",
    Kelvin: "K",
    Moles: "mol",
    mmHg: "mmHg",
    Torr: "Torr",
  };

  return unitMap[unit] ?? unit;
}

function appendTextResult(message: string) {
  const resultDiv = document.createElement("div");
  resultDiv.textContent = message;
  equationsContainer.appendChild(resultDiv);
}

function renderKatexResult(expression: string) {
  const resultDiv = document.createElement("div");
  resultDiv.id = "gas-result";
  equationsContainer.appendChild(resultDiv);
  katex.render(expression, resultDiv, { throwOnError: false });
}

function getNormalizedPressure(input: InputArray, colors: string[]) {
  return convertPressureToAtmosphere(equationsContainer, input, colors) ?? input;
}

function getNormalizedVolume(input: InputArray, colors: string[]) {
  return convertVolumeToLiters(equationsContainer, input, colors) ?? input;
}

function getNormalizedTemp(input: InputArray, colors: string[]) {
  return convertTempToKelvin(equationsContainer, input, colors) ?? input;
}

function renderSolvedResult(
  symbol: string,
  formula: string,
  value: number,
  unit: string,
) {
  renderKatexResult(
    `${symbol} = ${formula} = ${formatNumber(value)}\\ \\mathrm{${unitToLatex(unit)}}`,
  );
}

function hasExactlyOneUnknown(values: Array<number | null>) {
  return values.filter((value) => value === null).length === 1;
}

function amountsAreUsable(beforeAmount: InputArray, afterAmount?: InputArray) {
  const units = [beforeAmount[1], afterAmount?.[1]].filter((unit) => unit !== null);
  return units.every((unit) => unit === "Moles");
}

function inputIsReady(input: InputArray, expectedUnit: string) {
  return input[0] === null || input[1] === expectedUnit;
}

function renderIdealGasEquation(colors: string[]) {
  const { GBV, GBP, GBT, GBN, GAV, GAP, GAT, GAN } = getGasInputs();
  const afterValues = [GAV[0], GAP[0], GAT[0], GAN[0]].filter((value) => value !== null);

  if (afterValues.length > 0) {
    return false;
  }

  const pressure = getNormalizedPressure(GBP, colors);
  const volume = getNormalizedVolume(GBV, colors);
  const temperature = getNormalizedTemp(GBT, colors);
  const amount = GBN;


  if (!hasExactlyOneUnknown([pressure[0], volume[0], amount[0], temperature[0]])) {
    return false;
  }

  if (pressure[0] === null) {
    if (volume[0] === null || amount[0] === null || temperature[0] === null) {
      return true;
    }

    const result = idealGasLawP(volume[0], amount[0], temperature[0], "Atmosphere");
    renderSolvedResult(
      "P",
      `\\frac{nRT}{V} = \\frac{(${formatNumber(amount[0])})(0.0821)(${formatNumber(temperature[0])})}{${formatNumber(volume[0])}}`,
      result,
      "Atmosphere",
    );
    return true;
  }

  if (volume[0] === null) {
    if (pressure[0] === null || amount[0] === null || temperature[0] === null) {
      return true;
    }

    const result = idealGasLawV(pressure[0], amount[0], temperature[0], "Atmosphere");
    renderSolvedResult(
      "V",
      `\\frac{nRT}{P} = \\frac{(${formatNumber(amount[0])})(0.0821)(${formatNumber(temperature[0])})}{${formatNumber(pressure[0])}}`,
      result,
      "Liters",
    );
    return true;
  }

  if (amount[0] === null) {
    if (pressure[0] === null || volume[0] === null || temperature[0] === null) {
      return true;
    }

    const result = idealGasLawN(pressure[0], volume[0], temperature[0], "Atmosphere");
    renderSolvedResult(
      "n",
      `\\frac{PV}{RT} = \\frac{(${formatNumber(pressure[0])})(${formatNumber(volume[0])})}{(0.0821)(${formatNumber(temperature[0])})}`,
      result,
      "Moles",
    );
    return true;
  }

  if (pressure[0] === null || volume[0] === null || amount[0] === null) {
    return true;
  }

  const result = idealGasLawT(pressure[0], volume[0], amount[0], "Atmosphere");
  renderSolvedResult(
    "T",
    `\\frac{PV}{nR} = \\frac{(${formatNumber(pressure[0])})(${formatNumber(volume[0])})}{(${formatNumber(amount[0])})(0.0821)}`,
    result,
    "Kelvin",
  );
  return true;
}

function renderTwoStateLaw(colors: string[]) {
  const { GBV, GBP, GBT, GBN, GAV, GAP, GAT, GAN } = getGasInputs();
  const code = get4DigitCode();

  const beforePressure = getNormalizedPressure(GBP, colors);
  const afterPressure = getNormalizedPressure(GAP, colors);
  const beforeVolume = getNormalizedVolume(GBV, colors);
  const afterVolume = getNormalizedVolume(GAV, colors);
  const beforeTemp = getNormalizedTemp(GBT, colors);
  const afterTemp = getNormalizedTemp(GAT, colors);


  switch (code) {
    case "1b00": {
      if (beforePressure[0] === null || afterPressure[0] === null || beforeVolume[0] === null) {
        return true;
      }

      const result = boylesLawV(beforeVolume[0], beforePressure[0], afterPressure[0]);
      renderSolvedResult(
        "V_2",
        `\\frac{P_1V_1}{P_2} = \\frac{(${formatNumber(beforePressure[0])})(${formatNumber(beforeVolume[0])})}{${formatNumber(afterPressure[0])}}`,
        result,
        "Liters",
      );
      return true;
    }
    case "1a00": {
      if (beforePressure[0] === null || afterPressure[0] === null || afterVolume[0] === null) {
        return true;
      }

      const result = boylesLawV(afterVolume[0], afterPressure[0], beforePressure[0]);
      renderSolvedResult(
        "V_1",
        `\\frac{P_2V_2}{P_1} = \\frac{(${formatNumber(afterPressure[0])})(${formatNumber(afterVolume[0])})}{${formatNumber(beforePressure[0])}}`,
        result,
        "Liters",
      );
      return true;
    }
    case "b100": {
      if (beforePressure[0] === null || beforeVolume[0] === null || afterVolume[0] === null) {
        return true;
      }

      const result = boylesLawP(beforePressure[0], beforeVolume[0], afterVolume[0]);
      renderSolvedResult(
        "P_2",
        `\\frac{P_1V_1}{V_2} = \\frac{(${formatNumber(beforePressure[0])})(${formatNumber(beforeVolume[0])})}{${formatNumber(afterVolume[0])}}`,
        result,
        "Atmosphere",
      );
      return true;
    }
    case "a100": {
      if (afterPressure[0] === null || beforeVolume[0] === null || afterVolume[0] === null) {
        return true;
      }

      const result = boylesLawP(afterPressure[0], afterVolume[0], beforeVolume[0]);
      renderSolvedResult(
        "P_1",
        `\\frac{P_2V_2}{V_1} = \\frac{(${formatNumber(afterPressure[0])})(${formatNumber(afterVolume[0])})}{${formatNumber(beforeVolume[0])}}`,
        result,
        "Atmosphere",
      );
      return true;
    }
    case "0b01": {
      if (beforeVolume[0] === null || beforeTemp[0] === null || afterTemp[0] === null) {
        return true;
      }

      const result = charlesLawV(beforeVolume[0], beforeTemp[0], afterTemp[0]);
      renderSolvedResult(
        "V_2",
        `\\frac{V_1T_2}{T_1} = \\frac{(${formatNumber(beforeVolume[0])})(${formatNumber(afterTemp[0])})}{${formatNumber(beforeTemp[0])}}`,
        result,
        "Liters",
      );
      return true;
    }
    case "0a01": {
      if (afterVolume[0] === null || beforeTemp[0] === null || afterTemp[0] === null) {
        return true;
      }

      const result = charlesLawV(afterVolume[0], afterTemp[0], beforeTemp[0]);
      renderSolvedResult(
        "V_1",
        `\\frac{V_2T_1}{T_2} = \\frac{(${formatNumber(afterVolume[0])})(${formatNumber(beforeTemp[0])})}{${formatNumber(afterTemp[0])}}`,
        result,
        "Liters",
      );
      return true;
    }
    case "010b": {
      if (beforeTemp[0] === null || beforeVolume[0] === null || afterVolume[0] === null) {
        return true;
      }

      const result = charlesLawT(beforeTemp[0], beforeVolume[0], afterVolume[0]);
      renderSolvedResult(
        "T_2",
        `\\frac{T_1V_2}{V_1} = \\frac{(${formatNumber(beforeTemp[0])})(${formatNumber(afterVolume[0])})}{${formatNumber(beforeVolume[0])}}`,
        result,
        "Kelvin",
      );
      return true;
    }
    case "010a": {
      if (afterTemp[0] === null || beforeVolume[0] === null || afterVolume[0] === null) {
        return true;
      }

      const result = charlesLawT(afterTemp[0], afterVolume[0], beforeVolume[0]);
      renderSolvedResult(
        "T_1",
        `\\frac{T_2V_1}{V_2} = \\frac{(${formatNumber(afterTemp[0])})(${formatNumber(beforeVolume[0])})}{${formatNumber(afterVolume[0])}}`,
        result,
        "Kelvin",
      );
      return true;
    }
    case "100b": {
      if (beforeTemp[0] === null || beforePressure[0] === null || afterPressure[0] === null) {
        return true;
      }

      const result = gayLussacsLawT(beforeTemp[0], beforePressure[0], afterPressure[0]);
      renderSolvedResult(
        "T_2",
        `\\frac{T_1P_2}{P_1} = \\frac{(${formatNumber(beforeTemp[0])})(${formatNumber(afterPressure[0])})}{${formatNumber(beforePressure[0])}}`,
        result,
        "Kelvin",
      );
      return true;
    }
    case "100a": {
      if (afterTemp[0] === null || beforePressure[0] === null || afterPressure[0] === null) {
        return true;
      }

      const result = gayLussacsLawT(afterTemp[0], afterPressure[0], beforePressure[0]);
      renderSolvedResult(
        "T_1",
        `\\frac{T_2P_1}{P_2} = \\frac{(${formatNumber(afterTemp[0])})(${formatNumber(beforePressure[0])})}{${formatNumber(afterPressure[0])}}`,
        result,
        "Kelvin",
      );
      return true;
    }
    case "b001": {
      if (beforePressure[0] === null || beforeTemp[0] === null || afterTemp[0] === null) {
        return true;
      }

      const result = gayLussacsLawP(beforePressure[0], beforeTemp[0], afterTemp[0]);
      renderSolvedResult(
        "P_2",
        `\\frac{P_1T_2}{T_1} = \\frac{(${formatNumber(beforePressure[0])})(${formatNumber(afterTemp[0])})}{${formatNumber(beforeTemp[0])}}`,
        result,
        "Atmosphere",
      );
      return true;
    }
    case "a001": {
      if (afterPressure[0] === null || beforeTemp[0] === null || afterTemp[0] === null) {
        return true;
      }

      const result = gayLussacsLawP(afterPressure[0], afterTemp[0], beforeTemp[0]);
      renderSolvedResult(
        "P_1",
        `\\frac{P_2T_1}{T_2} = \\frac{(${formatNumber(afterPressure[0])})(${formatNumber(beforeTemp[0])})}{${formatNumber(afterTemp[0])}}`,
        result,
        "Atmosphere",
      );
      return true;
    }
    case "01b0": {
      if (GBN[0] === null || beforeVolume[0] === null || afterVolume[0] === null) {
        return true;
      }

      const result = avogadrosLawN(GBN[0], beforeVolume[0], afterVolume[0]);
      renderSolvedResult(
        "n_2",
        `\\frac{n_1V_2}{V_1} = \\frac{(${formatNumber(GBN[0])})(${formatNumber(afterVolume[0])})}{${formatNumber(beforeVolume[0])}}`,
        result,
        "Moles",
      );
      return true;
    }
    case "01a0": {
      if (GAN[0] === null || beforeVolume[0] === null || afterVolume[0] === null) {
        return true;
      }

      const result = avogadrosLawN(GAN[0], afterVolume[0], beforeVolume[0]);
      renderSolvedResult(
        "n_1",
        `\\frac{n_2V_1}{V_2} = \\frac{(${formatNumber(GAN[0])})(${formatNumber(beforeVolume[0])})}{${formatNumber(afterVolume[0])}}`,
        result,
        "Moles",
      );
      return true;
    }
    case "0b10": {
      if (GBN[0] === null || GAN[0] === null || beforeVolume[0] === null) {
        return true;
      }

      const result = avogadrosLawV(beforeVolume[0], GBN[0], GAN[0]);
      renderSolvedResult(
        "V_2",
        `\\frac{V_1n_2}{n_1} = \\frac{(${formatNumber(beforeVolume[0])})(${formatNumber(GAN[0])})}{${formatNumber(GBN[0])}}`,
        result,
        "Liters",
      );
      return true;
    }
    case "0a10": {
      if (GBN[0] === null || GAN[0] === null || afterVolume[0] === null) {
        return true;
      }

      const result = avogadrosLawV(afterVolume[0], GAN[0], GBN[0]);
      renderSolvedResult(
        "V_1",
        `\\frac{V_2n_1}{n_2} = \\frac{(${formatNumber(afterVolume[0])})(${formatNumber(GBN[0])})}{${formatNumber(GAN[0])}}`,
        result,
        "Liters",
      );
      return true;
    }
    default:
      return false;
  }
}

function renderEquations() {
  equationsContainer.innerHTML = "";
  const colors = [...defaultColors];

  if (renderTwoStateLaw(colors)) {
    return;
  }

  if (renderIdealGasEquation(colors)) {
    return;
  }

}
givenInputs.forEach((input) => {
  input.addEventListener("input", renderEquations);
  input.addEventListener("change", renderEquations);
});

renderEquations();
