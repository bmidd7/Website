import { webAddressWithEndSlash } from '../../../globalVars.js' //from great-grandparent folder


const GPU = !!navigator.gpu;
const RAM = navigator.deviceMemory;
const CPUCores = navigator.hardwareConcurrency;


function chooseAIModel() {

    if (GPU) {
        if (RAM >= 12 && CPUCores >= 6) {
            return 'insightface';
        } else if (RAM >= 6 && CPUCores >= 4) {
            return 'L-face-api';
        }
    } else {
        if (RAM >= 12 && CPUCores >= 6) {}
        return 'face-api'
    }

}

async function hasWiFi(retries = 3, delay = 500) {

    if (!navigator.onLine) {
        console.log("No WiFi Connection")
        return false
    }

    let attempt = 1;
    let internetAccess = false;

    while (attempt <= retries) {
        try {
            const response = await fetch(
                webAddressWithEndSlash + 'API/WiFi'
            )

            if (response.ok) {
                console.log("Internet Works likely")
                internetAccess = true
                break
            }
        } catch(err) {

        }
    }
    
    return internetAccess
}