export function boylesLawP(givenP, givenVSame, givenVOpposite) {
    let knownSide = givenP * givenVSame;
    let derivedPressure = knownSide / givenVOpposite;
    return derivedPressure;
}
export function boylesLawV(givenV, givenPSame, givenPOpposite) {
    let knownSide = givenV * givenPSame;
    let derivedVolume = knownSide / givenPOpposite;
    return derivedVolume;
}
export function charlesLawV(givenV, givenTSame, givenTOpposite) {
    let knownSide = givenV / givenTSame;
    let derivedVolume = knownSide * givenTOpposite;
    return derivedVolume;
}
export function charlesLawT(givenT, givenVSame, givenVOpposite) {
    let knownSide = givenVSame / givenT;
    let derivedTemperature = givenVOpposite / knownSide;
    return derivedTemperature;
}
export function gayLussacsLawP(givenP, givenTSame, givenTOpposite) {
    let knownSide = givenP / givenTSame;
    let derivedPressure = knownSide * givenTOpposite;
    return derivedPressure;
}
export function gayLussacsLawT(givenT, givenPSame, givenPOpposite) {
    let knownSide = givenPSame / givenT;
    let derivedTemperature = givenPOpposite / knownSide;
    return derivedTemperature;
}
export function avogadrosLawV(givenV, givenNSame, givenNOpposite) {
    let knownSide = givenV / givenNSame;
    let derivedVolume = knownSide * givenNOpposite;
    return derivedVolume;
}
export function avogadrosLawN(givenN, givenVSame, givenVOpposite) {
    let knownSide = givenVSame / givenN;
    let derivedParticleAmount = givenVOpposite / knownSide;
    return derivedParticleAmount;
}
//PV=nRT
export function findR(pressureUnit) {
    if (pressureUnit === "Kilopascal") {
        return 8.31;
    }
    else if (pressureUnit === "Atmosphere") {
        return 0.0821;
    }
    else { //(pressureUnit === "mmHg")
        return 62.36;
    }
}
export function idealGasLawP(givenV, givenN, givenT, pressureUnit) {
    let R = findR(pressureUnit);
    //P=nRT/V
    let derivedPressure = givenN * R * givenT / givenV;
    return derivedPressure;
}
export function idealGasLawV(givenP, givenN, givenT, pressureUnit) {
    let R = findR(pressureUnit);
    //V=nRT/P
    let derivedVolume = givenN * R * givenT / givenP;
    return derivedVolume;
}
export function idealGasLawN(givenP, givenV, givenT, pressureUnit) {
    let R = findR(pressureUnit);
    //n=PV/RT
    let derivedParticleAmount = (givenP * givenV) / (R * givenT);
    return derivedParticleAmount;
}
export function idealGasLawT(givenP, givenV, givenN, pressureUnit) {
    let R = findR(pressureUnit);
    //T=PV/nR
    let derivedTemperature = (givenP * givenV) / (R * givenN);
    return derivedTemperature;
}
//# sourceMappingURL=gasFunctions.js.map