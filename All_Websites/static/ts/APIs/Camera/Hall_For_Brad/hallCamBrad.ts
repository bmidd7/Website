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

async function init() {
  if (isInitializing || isStarted) return;
  isInitializing = true;
  try {
    try {
      await tf.setBackend("wasm");
      console.log("WASM backend is ready");
    } catch (err) {
      try {
        await tf.setBackend("webgl");
        console.log("WebGL backend is ready");
      } catch {
        await tf.setBackend("cpu");
        console.log("cpu is being used a TF backend :(");
      }
    } finally {
      await tf.ready();
    }

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(300, 400, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append elements to the DOM
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
      // and class labels
      labelContainer.appendChild(document.createElement("div"));
    }

    isStarted = true;
  } finally {
    isInitializing = false;
  }
}

async function loop() {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(loop);
}

// run the webcam image through the image model

async function predict() {
  // predict can take in an image, video or canvas html element
  const prediction = await model.predict(webcam.canvas);
  for (let i = 0; i < prediction.length; i++) {
    const percent = (prediction[i].probability * 100).toFixed(2);

    const classPrediction = prediction[i].className + ": " + percent + "%";
    labelContainer.children[i].innerHTML = classPrediction;
  }
}
