import { getGasInputs } from "./getGasInputs.js"
const { GBV, GBP, GBT, GBN, GAV, GAP, GAT, GAN } = getGasInputs();


//export function 









function convertUnits() {
  const { GBV, GBP, GBT, GBN, GAV, GAP, GAT, GAN } = getGasInputs();

  //convert temps to Kelvin
  const toKelvin = ([value, unit]: [number | null, string]) => {
    if (!value) {
      return
    }
    if (unit === "Celsius") {
      return value + 273;
    } else if (unit === "Fahrenheit") {
      return (value - 32) * 5/9 + 273;
    } else {
      return value; // assume Kelvin
    }
  };
  const [BT, AT] = [GBT, GAT].map(toKelvin);

  //

  
  return {  }
}