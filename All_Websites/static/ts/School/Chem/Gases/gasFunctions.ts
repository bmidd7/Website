export function boylesLawP(givenP: number, givenVSame: number, givenVOpposite: number) {
    let knownSide = givenP*givenVSame;
    let derivedPressure = knownSide/givenVOpposite;
    return derivedPressure;
}

export function boylesLawV(givenV: number, givenPSame: number, givenPOpposite: number) {
    let knownSide = givenV*givenPSame;
    let derivedVolume = knownSide/givenPOpposite;
    return derivedVolume;
}


export function charlesLawV(givenV: number, givenTSame: number, givenTOpposite: number) {
    let knownSide = givenV/givenTSame;
    let derivedVolume = knownSide*givenTOpposite;
    return derivedVolume;
}

export function charlesLawT(givenT: number, givenVSame: number, givenVOpposite: number) {
    let knownSide = givenVSame/givenT;
    let derivedTemperature = givenVOpposite/knownSide;
    return derivedTemperature;
}


export function gayLussacsLawP(givenP: number, givenTSame: number, givenTOpposite: number) {
    let knownSide = givenP/givenTSame;
    let derivedPressure = knownSide*givenTOpposite;
    return derivedPressure;
}

export function gayLussacsLawT(givenT: number, givenPSame: number, givenPOpposite: number) {
    let knownSide = givenPSame/givenT;
    let derivedTemperature = givenPOpposite/knownSide;
    return derivedTemperature;
}

export function avogadrosLawV(givenV: number, givenNSame: number, givenNOpposite: number) {
    let knownSide = givenV/givenNSame;
    let derivedVolume = knownSide*givenNOpposite;
    return derivedVolume;
}

export function avogadrosLawN(givenN: number, givenVSame: number, givenVOpposite: number) {
    let knownSide = givenVSame/givenN;
    let derivedParticleAmount = givenVOpposite/knownSide;
    return derivedParticleAmount;
}

//PV=nRT
export function findR(pressureUnit: string) {
    if (pressureUnit === "Kilopascal") {
        return 8.31;
    } else if (pressureUnit === "Atmosphere") {
        return 0.0821;
    } else {  //(pressureUnit === "mmHg")
        return 62.36;
    }
}

export function idealGasLawP(givenV: number, givenN: number, givenT: number, pressureUnit: string) {
    let R = findR(pressureUnit)
    //P=nRT/V
    let derivedPressure = givenN*R*givenT/givenV;
    return derivedPressure;
}

export function idealGasLawV(givenP: number, givenN: number, givenT: number, pressureUnit: string) {
    let R = findR(pressureUnit)
    //V=nRT/P
    let derivedVolume = givenN*R*givenT/givenP;
    return derivedVolume;
}

export function idealGasLawN(givenP: number, givenV: number, givenT: number, pressureUnit: string) {
    let R = findR(pressureUnit)
    //n=PV/RT
    let derivedParticleAmount = (givenP*givenV)/(R*givenT);
    return derivedParticleAmount;
}

export function idealGasLawT(givenP: number, givenV: number, givenN: number, pressureUnit: string) {
    let R = findR(pressureUnit)
    //T=PV/nR
    let derivedTemperature = (givenP*givenV)/(R*givenN);
    return derivedTemperature;
}