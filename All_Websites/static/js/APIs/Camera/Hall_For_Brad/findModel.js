var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//import { Activity } from "react";
import { WiFiSpeed, hasWiFi, GPU, RAM, CPUCores, } from "../../../globalVars.js"; //from great-grandparent folder
let internetSpeed = null;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { avgMbps, samples } = yield WiFiSpeed();
            internetSpeed = Number(avgMbps.toFixed(2));
            console.log("avgMbps", avgMbps);
            console.log("sample", samples[0]);
        }
        catch (err) {
            console.warn("WiFiSpeed failed:", err);
            internetSpeed = null;
        }
        console.log(GPU);
        console.log(RAM);
        console.log(CPUCores);
        console.log(internetSpeed);
        console.log(chooseAIModel());
        console.log(yield actualModelUsed());
    });
}
init();
function chooseAIModel() {
    //Insightface, Loose Face-API, or Strict Face-API!!!
    if (GPU) {
        if (RAM >= 8 && CPUCores >= 6) {
            return "insightface";
        }
        else if (RAM >= 6 && CPUCores >= 4) {
            return "L-face-api";
        }
        else {
            return "S-face-api";
        }
    }
    else {
        if (RAM >= 8 && CPUCores >= 8) {
            return "L-face-api";
        }
        else {
            return "S-face-api";
        }
    }
}
function actualModelUsed() {
    return __awaiter(this, void 0, void 0, function* () {
        let Model = chooseAIModel();
        if (yield hasWiFi()) {
            if (Model.includes("face-api")) {
            }
            else {
            }
        }
        else {
            return Model;
        }
    });
}
//# sourceMappingURL=findModel.js.map