const beforeMolOrGram = document.getElementById("before-particles-unit-given") as HTMLSelectElement;
const afterMolOrGram = document.getElementById("after-particles-unit-given") as HTMLSelectElement;

const beforeParticleSelect = document.getElementById("before-amount-grams") as HTMLSelectElement;
const afterParticleSelect = document.getElementById("after-amount-grams") as HTMLSelectElement;

document.addEventListener("input", () => {
    if (beforeMolOrGram.value === "Moles" || beforeMolOrGram.value === "Default") {
        beforeParticleSelect.classList.add("hidden")
    } else if (beforeMolOrGram.value == "Grams") {
        beforeParticleSelect.classList.remove("hidden")
    }
}
)

document.addEventListener("input", () => {
    if (afterMolOrGram.value === "Moles" || afterMolOrGram.value === "Default") {
        afterParticleSelect.classList.add("hidden")
    } else if (afterMolOrGram.value == "Grams") {
        afterParticleSelect.classList.remove("hidden")
    }
}
)