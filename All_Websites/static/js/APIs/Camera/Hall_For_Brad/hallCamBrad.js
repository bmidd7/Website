var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const startCamButton = document.getElementById("startCamButton");
let isInitializing = false;
let isStarted = false;
startCamButton.addEventListener("click", init);
// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image
// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/upiTOButL/";
let model, webcam, labelContainer, maxPredictions;
// Load the image model and setup the webcam
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isInitializing || isStarted)
            return;
        isInitializing = true;
        try {
            try {
                yield tf.setBackend("wasm");
                console.log("WASM backend is ready");
            }
            catch (err) {
                try {
                    yield tf.setBackend("webgl");
                    console.log("WebGL backend is ready");
                }
                catch (_a) {
                    yield tf.setBackend("cpu");
                    console.log("cpu is being used a TF backend :(");
                }
            }
            finally {
                yield tf.ready();
            }
            const modelURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";
            // load the model and metadata
            // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
            // or files from your local hard drive
            // Note: the pose library adds "tmImage" object to your window (window.tmImage)
            model = yield tmImage.load(modelURL, metadataURL);
            maxPredictions = model.getTotalClasses();
            // Convenience function to setup a webcam
            const flip = true; // whether to flip the webcam
            webcam = new tmImage.Webcam(300, 400, flip); // width, height, flip
            yield webcam.setup(); // request access to the webcam
            yield webcam.play();
            window.requestAnimationFrame(loop);
            // append elements to the DOM
            document.getElementById("webcam-container").appendChild(webcam.canvas);
            labelContainer = document.getElementById("label-container");
            for (let i = 0; i < maxPredictions; i++) {
                // and class labels
                labelContainer.appendChild(document.createElement("div"));
            }
            isStarted = true;
        }
        finally {
            isInitializing = false;
        }
    });
}
function loop() {
    return __awaiter(this, void 0, void 0, function* () {
        webcam.update(); // update the webcam frame
        yield predict();
        window.requestAnimationFrame(loop);
    });
}
// run the webcam image through the image model
function predict() {
    return __awaiter(this, void 0, void 0, function* () {
        // predict can take in an image, video or canvas html element
        const prediction = yield model.predict(webcam.canvas);
        for (let i = 0; i < prediction.length; i++) {
            const percent = (prediction[i].probability * 100).toFixed(2);
            const classPrediction = prediction[i].className + ": " + percent + "%";
            labelContainer.children[i].innerHTML = classPrediction;
        }
    });
}
//# sourceMappingURL=hallCamBrad.js.map