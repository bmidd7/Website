import { boylesLawP, boylesLawV, charlesLawV, charlesLawT, gayLussacsLawP, gayLussacsLawT, avogadrosLawV, avogadrosLawN, } from "./gasFunctions.js";
import { getGasInputs } from "./getGasInputs.js";
import { convertInputs } from "./preConvertGases.js";
import { defaultColors } from "./localModules.js";
// PV=nRT
// Known:
// 0 = neither, 1 = both, b = before, a = after
// [pressure][volume][amount][temperature]
function getWhatAreWeWorkingWith() {
    const { GBV, GBP, GBT, GBN, GAV, GAP, GAT, GAN } = getGasInputs();
    return {
        // n & T are constant here (Boyle)
        '1b00': boylesLawV(GBV[0], GBP[0], GAP[0]),
        '1a00': boylesLawV(GAV[0], GAP[0], GBP[0]),
        'b100': boylesLawP(GBP[0], GBV[0], GAV[0]),
        'a100': boylesLawP(GAP[0], GAV[0], GBV[0]),
        // n & P are constant here (Charles)
        '0b01': charlesLawV(GBV[0], GBT[0], GAT[0]),
        '0a01': charlesLawV(GAV[0], GAT[0], GBT[0]),
        '010b': charlesLawT(GBT[0], GBV[0], GAV[0]),
        '010a': charlesLawT(GAT[0], GAV[0], GBV[0]),
        // V & n are constant here (Gay-Lussac)
        '100b': gayLussacsLawT(GBT[0], GBP[0], GAP[0]),
        '100a': gayLussacsLawT(GAT[0], GAP[0], GBP[0]),
        'b001': gayLussacsLawP(GBP[0], GBT[0], GAT[0]),
        'a001': gayLussacsLawP(GAP[0], GAT[0], GBT[0]),
        // P & T are constant here (Avogadro)
        '01b0': avogadrosLawN(GBN[0], GBV[0], GAV[0]),
        '01a0': avogadrosLawN(GAN[0], GAV[0], GBV[0]),
        '0b10': avogadrosLawV(GBV[0], GBN[0], GAN[0]),
        '0a10': avogadrosLawV(GAV[0], GAN[0], GBN[0]),
    };
}
let numberOfEquations = 3;
const givenInputs = document.querySelectorAll('#givens input, #givens select');
// for (let i = 0; i < numberOfEquations; i++) {
//   const newDiv = document.createElement('div')
//   newDiv.id = `equation${i + 1}`
//   equationsContainer.appendChild(newDiv)
//   const equationDiv = document.getElementById(`equation${i + 1}`) as HTMLDivElement
//   equationDiv.textContent = 'Hi!'
// }
const equationsContainer = document.getElementById('equations');
function renderEquations() {
    equationsContainer.innerHTML = '';
    convertInputs(equationsContainer, getGasInputs().GBT, [...defaultColors]);
}
givenInputs.forEach((input) => {
    input.addEventListener('input', renderEquations);
    input.addEventListener('change', renderEquations);
});
renderEquations();
// for (let i = 0; i < numberOfEquations; i++) {
//   const newDiv = document.createElement('div');
//   newDiv.id = `equation${i + 1}`;
//   newDiv.textContent = 'Hi!';
//   equationsContainer.appendChild(newDiv);
// }
//# sourceMappingURL=Gases.js.map