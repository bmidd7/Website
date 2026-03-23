const beforeMolOrGram = document.getElementById("before-particles-unit-given");
const afterMolOrGram = document.getElementById("after-particles-unit-given");
const beforeParticleSelect = document.getElementById("before-amount-grams");
const afterParticleSelect = document.getElementById("after-amount-grams");
document.addEventListener("input", () => {
    if (beforeMolOrGram.value === "Moles" || beforeMolOrGram.value === "Default") {
        beforeParticleSelect.classList.add("hidden");
    }
    else if (beforeMolOrGram.value == "Grams") {
        beforeParticleSelect.classList.remove("hidden");
    }
});
document.addEventListener("input", () => {
    if (afterMolOrGram.value === "Moles" || afterMolOrGram.value === "Default") {
        afterParticleSelect.classList.add("hidden");
    }
    else if (afterMolOrGram.value == "Grams") {
        afterParticleSelect.classList.remove("hidden");
    }
});
//# sourceMappingURL=showAndHideParticleSelect.js.map