import * as faceapi from "./face-api.esm.js";

// configuration options
// const modelPath = "../model/"; // path to model folder that will be loaded using http
const modelPath = 'https://vladmandic.github.io/face-api/model/'; // path to model folder that will be loaded using http
const minScore = 0.2; // minimum score
const maxResults = 5; // maximum number of results to return
let optionsSSDMobileNet;

const SERVER_URL = "https://localhost:5001/";
// image constants
const IMAGE_LABEL = "GANESH";
const imageCount = 1;
// Note: Save image as - IMAGE_LABEL-1.jpg 

let recognizedFaceLabel;
let faceMatcher;

// helper function to pretty-print json object to string
function str(json) {
  let text = '<font color="lightblue">';
  text += json
    ? JSON.stringify(json)
        .replace(/{|}|"|\[|\]/g, "")
        .replace(/,/g, ", ")
    : "";
  text += "</font>";
  return text;
}

// helper function to print strings to html document as a log
function log(...txt) {
  // eslint-disable-next-line no-console
  console.log(...txt);
  const div = document.getElementById("logs");
  if (div) div.innerHTML += `<br>${txt}`;
}

// helper function to draw detected faces
function drawFaces(canvas, data, fps) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw title
  ctx.font = 'small-caps 20px "Segoe UI"';
  ctx.fillStyle = "white";
  ctx.fillText(`FPS: ${fps}`, 10, 25);
  for (const person of data) {
    // face matching logic wrt reference label image
    const bestMatch = faceMatcher.findBestMatch(person.descriptor);
    recognizedFaceLabel = bestMatch.toString();

    // draw box around each face
    ctx.lineWidth = 3;
    ctx.strokeStyle = "deepskyblue";
    ctx.fillStyle = "white";
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.rect(
      person.detection.box.x,
      person.detection.box.y,
      person.detection.box.width,
      person.detection.box.height
    );
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillText(
      `Name: ${recognizedFaceLabel}`,
      person.detection.box.x,
      person.detection.box.y - 39
    );

    // draw face points for each face
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "lightblue";
    const pointSize = 2;
    for (let i = 0; i < person.landmarks.positions.length; i++) {
      ctx.beginPath();
      ctx.arc(
        person.landmarks.positions[i].x,
        person.landmarks.positions[i].y,
        pointSize,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  }
}

async function detectVideo(video, canvas) {
  if (!video || video.paused) return false;
  const t0 = performance.now();
  faceapi
    .detectAllFaces(video, optionsSSDMobileNet)
    .withFaceLandmarks()
    // .withFaceExpressions()
    .withFaceDescriptors()
    // .withAgeAndGender()
    .then((result) => {

      console.log(result);
      if(result.length == 0){
        log("User face not detected at " + new Date().toLocaleTimeString());
      }

      if(result.length > 1){
        log("More than one face detected at " + new Date().toLocaleTimeString());
      }
      const fps = 1000 / (performance.now() - t0);
      drawFaces(canvas, result, fps.toLocaleString());
      // call detectVideo in self loop
      requestAnimationFrame(() => detectVideo(video, canvas));
      return true;
    })
    .catch((err) => {
      log(`Detect Error: ${str(err)}`);
      return false;
    });
  return false;
}

// just initialize everything and call main function
async function setupCamera() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  if (!video || !canvas) return null;

  let msg = "";
  log("Setting up camera");
  // setup webcam. note that navigator.mediaDevices requires that page is accessed via https
  if (!navigator.mediaDevices) {
    log("Camera Error: access not supported");
    return null;
  }
  let stream;
  const constraints = {
    audio: false,
    video: { facingMode: "user", resizeMode: "crop-and-scale" },
  };
  if (window.innerWidth > window.innerHeight)
    constraints.video.width = { ideal: window.innerWidth };
  else constraints.video.height = { ideal: window.innerHeight };
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    if (err.name === "PermissionDeniedError" || err.name === "NotAllowedError")
      msg = "camera permission denied";
    else if (err.name === "SourceUnavailableError")
      msg = "camera not available";
    log(`Camera Error: ${msg}: ${err.message || err}`);
    return null;
  }
  // @ts-ignore
  if (stream) video.srcObject = stream;
  else {
    log("Camera Error: stream empty");
    return null;
  }
  const track = stream.getVideoTracks()[0];
  const settings = track.getSettings();
  if (settings.deviceId) delete settings.deviceId;
  if (settings.groupId) delete settings.groupId;
  if (settings.aspectRatio)
    settings.aspectRatio = Math.trunc(100 * settings.aspectRatio) / 100;
  log(`Camera active: ${track.label}`); // ${str(constraints)}
  //   log(`Camera settings: ${str(settings)}`);
  canvas.addEventListener("click", () => {
    // @ts-ignore
    if (video && video.readyState >= 2) {
      // @ts-ignore
      if (video.paused) {
        // @ts-ignore
        video.play();
        detectVideo(video, canvas);
      } else {
        // @ts-ignore
        video.pause();
      }
    }
    // @ts-ignore
    log(`Camera state: ${video.paused ? "paused" : "playing"}`);
  });
  return new Promise((resolve) => {
    video.onloadeddata = async () => {
      // @ts-ignore
      canvas.width = video.videoWidth;
      // @ts-ignore
      canvas.height = video.videoHeight;
      // @ts-ignore
      video.play();
      detectVideo(video, canvas);
      resolve(true);
    };
  });
}

// logic to train model from user image
async function trainModel() {
  console.log("Model training started...");
  let img;
  let descriptor;
  let descriptorList = [];

  for (let i = 1; i <= imageCount; i++) {
    //not working
    // const IMAGE_URL = await fetch(SERVER_URL + "users?label=" + IMAGE_LABEL);
    const IMAGE_URL = "https://localhost:5001/data/GANESH/GANESH.jpg";
    // const IMAGE_URL = "../images/GANESH.jpg";
    // const IMAGE_URL = "https://121quotes.com/wp-content/uploads/2019/09/messi-hd-wallpapers.jpg";
    img = document.getElementById("user-face");
    // img = await faceapi.fetchImage(document.getElementById("user-face").getAttribute("src"));

    // console.log(img);

    descriptor = await faceapi
      .detectAllFaces(img,new faceapi.SsdMobilenetv1Options({
        minConfidence: minScore,
        maxResults,
      }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log(descriptor);

    if(descriptor.length != 0){
      descriptorList.push(descriptor[0].descriptor);
    }
  }

const labeledDescriptors = [
    new faceapi.LabeledFaceDescriptors(IMAGE_LABEL, descriptorList),
  ];

  faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);
}

async function setupFaceAPI() {
  // load face-api models
  // log('Models loading');
  // await faceapi.nets.tinyFaceDetector.load(modelPath); // using ssdMobilenetv1
  await faceapi.nets.ssdMobilenetv1.load(modelPath);
  await faceapi.nets.faceLandmark68Net.load(modelPath);
  await faceapi.nets.faceRecognitionNet.load(modelPath);
  optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({
    minConfidence: minScore,
    maxResults,
  });

  await trainModel()
    .then(() => {    
      console.log("Model training completed successfully");
    })
    .catch((err) => {
      console.log(err);
      console.log("ERROR: Failed to train the Model");
    });
}

async function main() {
  log("FaceAPI WebCam Test");
  await faceapi.tf.setBackend("webgl");

  await faceapi.tf.enableProdMode();
  await faceapi.tf.ENV.set("DEBUG", false);
  await faceapi.tf.ready();

  await setupFaceAPI();
  await setupCamera();
}

// start processing as soon as page is loaded
// window.onload = main;