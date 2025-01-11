let facemesh;
let video;
let predictions = [];
let cakesImg = [];
let hatImg;
let xoff;
let cakeX, cakeY;
let eaten = false;
let boomed = false;
let hatX, hatY;
let hat;
let hatSize;

let hatControl = { start: 0 };

let myCanvas;
let duration = 8 * 1000;
let end = Date.now() + duration;

let song, bgm;
let eatSound = [];
let happyBirthdayAnima = [];
let bite = 0;
let biting = false;

function preload() {
  for (let i = 0; i < 7; i++) {
    cakesImg[i] = loadImage(`img/cake0${i}.png`);
  }
  hatImg = loadImage("img/hat.png");
  song = loadSound("./happyBirthday.wav");
  bgm = loadSound("./happyStudent.mp3", () => {
    bgm.stop();
    bgm.setVolume(0.2);
    bgm.play();
  });
  cakesImg.forEach((item, index) => {
    let s = loadSound(`sound/${index}.m4a`, () => {
      eatSound.push(s);
    });
  });
}

function setup() {
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  // Adjust canvas size based on the screen's dimensions
  let aspectRatio = 480 / 880; // Assume 4:3 aspect ratio for video
  let canvasWidth = windowWidth; // Use full screen width
  let canvasHeight = canvasWidth / aspectRatio;

  myCanvas = createCanvas(canvasWidth, canvasHeight);
  myCanvas.class("p5canvas");

  video = createCapture(VIDEO);
  video.size(canvasWidth, canvasHeight);
  video.hide();

  hat = new Hat();

  let string = "Happy Birthday";
  for (let i = 0; i < string.length; i++) {
    happyBirthdayAnima.push(
      new textAnimation(string[i], width * 0.5, height / 2)
    );
  }

  // Initialize facemesh model
  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on("predict", (results) => {
    predictions = results;
  });
}

function modelReady() {
  console.log("Model ready!");
}

function draw() {
  background(255);

  // Flip and display video feed
  push();
  translate(width / 2, height / 2);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  let abite = checkBite();

  xoff = xoff + 0.005;
  cakeX = noise(xoff) * width;
  cakeY = noise(xoff + 1.4) * height;

  if (bite < 7 && !boomed) {
    image(cakesImg[bite], cakeX, cakeY, 250, (250 * 419) / 525);
    if (abite) {
      eatSound[bite - 1].setVolume(1);
      eatSound[bite - 1].play();
    }
    eaten = false;
  } else {
    eaten = true;
  }

  if (eaten) {
    happyBirthdayAnima.forEach((item) => item.display());
    hat.display(hatSize, hatControl.start);

    if (!boomed) {
      end = Date.now() + duration;
      boomed = true;
      bgm.stop();
      song.play();

      anime({
        targets: happyBirthdayAnima,
        size: 60,
        x: anime.stagger(40, { start: 60 }),
        round: 1,
        easing: "spring(0.5, 10, 1.5, 10)",
        duration: 3000,
      });

      anime({
        targets: happyBirthdayAnima,
        y: 0.6 * width,
        round: 1,
        easing: "easeInOutElastic(1, .6)",
        duration: 3000,
        delay: anime.stagger(100, { from: "center", start: 3000 }),
      });

      anime({
        targets: hatControl,
        start: 1,
        easing: "linear(1, .6)",
        duration: 10,
        delay: 6000,
      });
    }

    if (Date.now() < end) {
      myConfetti({
        particleCount: 8,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
      });
      myConfetti({
        particleCount: 8,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
      });
    }
  }
}

function checkBite() {
  let d, mouthX, mouthY;
  biting = false;

  predictions.forEach((prediction) => {
    const keypoints = prediction.scaledMesh;
    let [upperLipX, upperLipY] = keypoints[13];
    upperLipX = width - upperLipX;
    let [lowerLipX, lowerLipY] = keypoints[14];
    lowerLipX = width - lowerLipX;

    mouthX = lowerLipX;
    mouthY = lowerLipY;
    d = dist(upperLipX, upperLipY, lowerLipX, lowerLipY);

    hatX = width - keypoints[10][0];
    hatY = keypoints[10][1];

    const [x2, y2] = keypoints[386];
    let [a, b] = keypoints[374];
    hatSize = dist(a, b, x2, y2) / 10;
  });

  let distMC = dist(mouthX, mouthY, cakeX, cakeY);
  if (d > 20 && distMC < 100) {
    bite++;
    biting = true;
  }

  return biting;
}

function textAnimation(string, x, y) {
  this.x = x;
  this.y = y;
  this.size = 10;
  this.display = function () {
    textSize(this.size);
    stroke(0);
    strokeWeight(8);
    let colors = ["#FFFFFF", "#F9D347", "#F29F39", "#ec4940", "#CF4DEF", "#3F99F7", "#5BC339"];
    fill(colors[int(random(6))]);
    text(string, this.x, this.y);
  };
}

function Hat(x = 0.5 * width, y = -10) {
  this.location = createVector(x, y);
  this.wear = false;

  this.display = function (size, start) {
    if (start) {
      fill(0, 0, 0);
      rectMode(CENTER);
      let v = p5.Vector.sub(createVector(hatX, hatY), this.location);

      if (v.mag() > 0.5 && !this.wear) {
        this.location.add(v.normalize());
      } else {
        this.wear = true;
      }

      push();
      translate(
        this.wear ? hatX : this.location.x,
        this.wear ? hatY - 100 * size : this.location.y - 100 * size
      );
      scale(size);
      image(hatImg, 0, 0, 200, 200);
      pop();
    }
  };
}

let myConfetti = confetti.create(document.querySelector("canvas"), {
  resize: true,
  useWorker: true,
});