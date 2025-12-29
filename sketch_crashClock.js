/*!
 * This file is part of Space Type Generator.
 *
 * Copyright (c) Kiel Mutschelknaus
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.
 */

const {
  Engine,
  World,
  Bodies,
  Composite,
  Constraint,
  Mouse,
  MouseConstraint
} = Matter;

let engine;
let world;
let testPart;
let boundaries = [];
let spokeBound;
var hourGroup = [];
let hourHand, minHand, secHand;
let hourAngle, minAngle, secAngle;
let mConstraint;

/* ✅ Defaults de color */
var bkgdColor = '#000000';     // fons negre
var fillColor = '#EDEDED';     // text rgb(237,237,237)
var handColor = '#FFFFFF';     // agulles blanques
var accentColor = '#FF0000';   // accent vermell

var textScaler = 1;
var pg = [];
var pgTextSizeHour = 200;
var pgTextSizeMin = 35;
var pgTextSizeHead = 250;

var pgTextSizeHourMax = 200;
var pgTextSizeMinMax = 35;
var pgTextSizeHeadMax = 250;

var tFont = [];
var pgTextFactor = [];

var keyTextHour = "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12";
var keyTextMin = "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20\n21\n22\n23\n24\n25\n26\n27\n28\n29\n30\n31\n32\n33\n34\n35\n36\n37\n38\n39\n40\n41\n42\n43\n44\n45\n46\n47\n48\n49\n50\n51\n52\n53\n54\n55\n56\n57\n58\n59\n60\n";

var keyTextTop = "&ALBA";
var keyTextBottom = "AICARD16";

var inputTextHour = [];
var inputTextMin = [];
var inputTextTop = [];
var inputTextBottom = [];

let dropGroupHour;
let dropGroupMin;
let dropGroupHead;
let dropGroupParticles;

var widgetOn = true;

var fps = 60;
var secSmoothAng = 0;
var smoothAng = 0;
var secHold = 0;
var holdMin = 0;

/* ✅ Per defecte: TEXT */
var setMode = 2;

/* ✅ Reinici sempre Mai */
var resetMode = 0;

var gravityAng = 1.5708;

/* ✅ Intensitat física 50% */
var gravityStrength = 0.00025;

var boundCount = 16;
var constrainMode = 2;

var handsRadius = 0;
var borderRadius, secHandLength, minHandLength, hourHandLength;

var borderPadding = 100;
var borderExtra = 0;

var clockBorder;

var fontSelect = 0;
var borderDraw = 2;

var fullScale = 1;
var styleMode = 0;

var fontLoadedOk = true;

function preload(){
  tFont[0] = loadFont(
    "resources/SeasonMix-TRIAL-Medium.ttf",
    () => { fontLoadedOk = true; },
    () => { fontLoadedOk = false; }
  );
  pgTextFactor[0] = 0.78;
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);

  setText();

  secSmoothAng = (TWO_PI/60)/fps;
  configureClock();
  holdMin = minute();

  engine = Engine.create({
    positionIterations: 10,
    velocityIterations: 10
  });
  world = engine.world;

  if(fontLoadedOk && tFont[0]) {
    textFont(tFont[0]);
  } else {
    textFont('sans-serif');
  }
  strokeJoin(ROUND);

  frameRate(fps);

  $("#handle2").roundSlider({
    animation:false,
    min:0,
    max:TWO_PI,
    sliderType: "default",
    radius:50,
    handsRadius: 50,
    showTooltip: false,
    width: 50,
    value: 3/2 * PI,
    step: 0.001,
    handleSize: 0,
    handleShape: "square",
    tooltipFormat: "adjustGravity"
  });

  dropGroupHead = new DropAll(2);

  boundaries = [];
  for(let m = 0; m < boundCount; m++){
    boundaries.push(new Boundary(0, 0, height + width, borderPadding * 2, 0));
  }
  positionBoundaries();

  spokeBound = new Particle(width/2, height/2, 30, true);

  secHand = new Hand(width/2, height/2, secHandLength, 5, 0);
  minHand = new Hand(width/2, height/2, minHandLength, 10, 1);
  hourHand = new Hand(width/2, height/2, hourHandLength, 20, 2);

  let canvasMouse = Mouse.create(canvas.elt);
  canvasMouse.pixelRatio = pixelDensity();
  mConstraint = MouseConstraint.create(engine, { mouse: canvasMouse });
  World.add(world, mConstraint);
}

function draw() {
  world.gravity.x = cos(gravityAng);
  world.gravity.y = sin(gravityAng);
  world.gravity.scale = gravityStrength;

  background(bkgdColor);

  Engine.update(engine);

  if(styleMode == 0){
    stroke(fillColor);
    noFill();
    if(borderDraw > 0.15){
      strokeWeight(borderDraw);
      ellipse(width/2, height/2, clockBorder);
    }
  } else if(styleMode == 1){
    stroke(fillColor);
    noFill();
    strokeWeight(3);
    ellipse(width/2, height/2, clockBorder);
  } else {
    background(handColor);
    fill(bkgdColor);
    stroke(bkgdColor);
    strokeWeight(4);
    ellipse(width/2, height/2, clockBorder);
  }

  noStroke();
  fill(fillColor);
  if(dropGroupHour != null){ dropGroupHour.run(); }
  if(dropGroupMin != null){ dropGroupMin.run(); }
  if(dropGroupHead != null){ dropGroupHead.run(); }
  if(dropGroupParticles != null){ dropGroupParticles.run(); }

  minHand.show();
  hourHand.show();

  noStroke();
  fill(handColor);
  ellipse(width/2, height/2, 50, 50);

  secHand.show();
  fill(accentColor);
  ellipse(width/2, height/2, 20, 20);

  runClock();

  if(borderDraw > 0.1){
    borderDraw -= 0.05;
  } else {
    borderDraw = 0;
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  configureClock();
  if(boundaries && boundaries.length === boundCount){
    positionBoundaries();
  }
}

function runClock(){
  var currentSec = second();
  if(secHold != currentSec){
    smoothAng = 0;
    secHold = currentSec;
  } else {
    smoothAng += secSmoothAng;
  }

  secAngle = map(currentSec, 0, 60, -PI/2, PI * 3/2) + smoothAng;
  var secX = width/2 + cos(secAngle) * (secHandLength/2 - 50);
  var secY = height/2 + sin(secAngle) * (secHandLength/2 - 50);

  Matter.Body.setPosition(secHand.body, {x: secX, y: secY});
  Matter.Body.setAngle(secHand.body, secAngle);

  minAngle = map(minute(), 0, 60, -PI/2, PI * 3/2);
  var minX = width/2 + cos(minAngle) * minHandLength/2;
  var minY = height/2 + sin(minAngle) * minHandLength/2;

  Matter.Body.setPosition(minHand.body, {x: minX, y: minY});
  Matter.Body.setAngle(minHand.body, minAngle);

  hourAngle = map(hour(), 0, 12, -PI/2, PI * 3/2);
  var hourX = width/2 + cos(hourAngle) * hourHandLength/2;
  var hourY = height/2 + sin(hourAngle) * hourHandLength/2;

  Matter.Body.setPosition(hourHand.body, {x: hourX, y: hourY});
  Matter.Body.setAngle(hourHand.body, hourAngle);
}

function configureClock(){
  if(width > height){
    handsRadius = (height)/2 * fullScale;
  } else {
    handsRadius = (width)/2 * fullScale;
  }
  borderRadius = handsRadius * 2 + 6;

  var holdSec = secHandLength;
  secHandLength = handsRadius;
  var secFactor = secHandLength/holdSec;

  var holdMin = minHandLength;
  minHandLength = handsRadius * 3/4;
  var minFactor = minHandLength/holdMin;

  var holdHour = hourHandLength;
  hourHandLength = handsRadius/2;
  var hourFactor = hourHandLength/holdHour;

  clockBorder = (handsRadius + borderExtra - 25) * 2;

  if(secHand != null){
    Matter.Body.setAngle(secHand.body, 0);
    Matter.Body.setAngle(minHand.body, 0);
    Matter.Body.setAngle(hourHand.body, 0);
    Matter.Body.scale(secHand.body, secFactor, 1);
    Matter.Body.scale(minHand.body, minFactor, 1);
    Matter.Body.scale(hourHand.body, hourFactor, 1);
    Matter.Body.setAngle(secHand.body, secAngle);
    Matter.Body.setAngle(minHand.body, minAngle);
    Matter.Body.setAngle(hourHand.body, hourAngle);

    secHand.w = secHandLength;
    minHand.w = minHandLength;
    hourHand.w = hourHandLength;

    Matter.Body.setPosition(spokeBound.body, {x: width/2, y: height/2});
  }

  pgTextSizeHourMax = ((TWO_PI * handsRadius)/keyTextHour.length) * 1.5;
  pgTextSizeMinMax = ((TWO_PI * (handsRadius - pgTextSizeHourMax))/inputTextMin.length) * 0.75;

  if(inputTextTop.length > inputTextBottom.length){
    pgTextSizeHeadMax = ((PI * handsRadius)/inputTextTop.length) * 1.0;
  } else {
    pgTextSizeHeadMax = ((PI * handsRadius)/inputTextBottom.length) * 1.0;
  }

  pgTextSizeHour = textScaler * pgTextSizeHourMax;
  pgTextSizeMin = textScaler * pgTextSizeMinMax;
  pgTextSizeHead = textScaler * pgTextSizeHeadMax;
}

function positionBoundaries(){
  if(!boundaries || boundaries.length !== boundCount) return;

  var boundAng = TWO_PI/boundCount;
  clockBorder = (handsRadius + borderExtra - 25) * 2;

  for(var m = 0; m < boundCount; m++){
    if(!boundaries[m] || !boundaries[m].body) continue;

    var ang = m * boundAng;
    var rad = (clockBorder)/2 + borderPadding;

    var xB = width/2 + cos(ang) * rad;
    var yB = height/2 + sin(ang) * rad;

    Matter.Body.setPosition(boundaries[m].body, {x: xB, y: yB});
    Matter.Body.setAngle(boundaries[m].body, ang + PI/2);
  }
}

function randomStart(){ }
