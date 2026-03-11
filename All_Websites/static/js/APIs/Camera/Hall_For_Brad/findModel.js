//import { Activity } from "react";
import {
  webAddressWithEndSlash,
  WiFiSpeed,
  hasWiFi,
  GPU,
  RAM,
  CPUCores,
} from "../../../globalVars.js"; //from great-grandparent folder

let internetSpeed = null;

async function init() {
  try {
    const { avgMbps, samples } = await WiFiSpeed();
    internetSpeed = Number(avgMbps.toFixed(2));
    console.log("avgMbps", avgMbps);
    console.log("sample", samples[0]);
  } catch (err) {
    console.warn("WiFiSpeed failed:", err);
    internetSpeed = null;
  }

  console.log(GPU);
  console.log(RAM);
  console.log(CPUCores);
  console.log(internetSpeed);
  console.log(chooseAIModel());
  console.log(await actualModelUsed());
}

init();

function chooseAIModel() {
  //Insightface, Loose Face-API, or Strict Face-API!!!

  if (GPU) {
    if (RAM >= 8 && CPUCores >= 6) {
      return "insightface";
    } else if (RAM >= 6 && CPUCores >= 4) {
      return "L-face-api";
    } else {
      return "S-face-api";
    }
  } else {
    if (RAM >= 8 && CPUCores >= 8) {
      return "L-face-api";
    } else {
      return "S-face-api";
    }
  }
}

async function actualModelUsed() {
  let Model = chooseAIModel();

  if (await hasWiFi()) {
    if (Model.includes("face-api")) {
    } else {
    }
  } else {
    return Model;
  }
}
