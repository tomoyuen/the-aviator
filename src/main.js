/* global window, document */
/* eslint no-console: off */
/* eslint no-param-reassign: ["error", { "props": false }] */
import * as THREE from 'three';

import AirPlane from './modules/Airplane';
import Sea from './modules/Sea';
import Sky from './modules/Sky';
import CoinsHolder from './modules/CoinsHolder';
import Ennemy from './modules/Ennemy';
import EnnemiesHolder from './modules/EnnemiesHolder';
import Particle from './modules/Particle';
import ParticlesHolder from './modules/ParticlesHolder';

// game variables
var game,
  deltaTime = 0,
  newTime = new Date().getTime(),
  oldTime = new Date().getTime(),
  ennemiesPool = [],
  particlesPool = [],
  // three.js related variables
  scene,
  camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  container,
  renderer,
  // screen & mouse variables
  deviceHeight,
  deviceWidth,
  mousePos = { x: 0, y: 0 },
  // lights
  ambientLight,
  hemisphereLight,
  shadowLight,
  // container
  coinsHolder,
  ennemiesHolder,
  particlesHolder,
  // UI
  fieldDistance,
  energyBar,
  replayMessage,
  fieldLevel,
  levelCircle;

let sea;
let sky;
let airplane;

function resetGame() {
  game = {
    speed: 0,
    initSpeed: 0.00035,
    baseSpeed: 0.00035,
    targetBaseSpeed: 0.00035,
    incrementSpeedByTime: 0.0000025,
    incrementSpeedByLevel: 0.000005,
    distanceForSpeedUpdate: 100,
    speedLastUpdate: 0,

    distance: 0,
    ratioSpeedDistance: 50,
    energy: 100,
    ratioSpeedEnergy: 3,

    level: 1,
    levelLastUpdate: 0,
    distanceForLevelUpdate: 1000,

    planeDefaultHeight: 100,
    planeAmpHeight: 80,
    planeAmpWidth: 75,
    planeMoveSensivity: 0.005,
    planeRotXSensivity: 0.0008,
    planeRotZSensivity: 0.0004,
    planeFallSpeed: 0.001,
    planeMinSpeed: 1.2,
    planeMaxSpeed: 1.6,
    planeSpeed: 0,
    planeCollisionDisplacementX: 0,
    planeCollisionSpeedX: 0,

    planeCollisionDisplacementY: 0,
    planeCollisionSpeedY: 0,

    seaRadius: 600,
    seaLength: 800,

    wavesMinAmp: 5,
    wavesMaxAmp: 20,
    wavesMinSpeed: 0.001,
    wavesMaxSpeed: 0.003,

    cameraFarPos: 500,
    cameraNearPos: 150,
    cameraSensivity: 0.002,

    coinDistanceTolerance: 15,
    coinValue: 3,
    coinsSpeed: 0.5,
    coinLastSpawn: 0,
    distanceForCoinsSpawn: 100,

    ennemyDistanceTolerance: 10,
    ennemyValue: 10,
    ennemiesSpeed: 0.6,
    ennemyLastSpawn: 0,
    distanceForEnnemiesSpawn: 50,

    status: 'playing',
  };

  fieldLevel.innerHTML = Math.floor(game.level);
}

function createScene() {
  deviceHeight = window.innerHeight;
  deviceWidth = window.innerWidth;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

  aspectRatio = deviceWidth / deviceHeight;
  fieldOfView = 50;
  nearPlane = 0.1;
  farPlane = 10000;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.set(0, game.planeDefaultHeight, 200);

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });

  renderer.setSize(deviceWidth, deviceHeight);
  renderer.shadowMap.enabled = true;
  container = document.getElementById('world');
  container.appendChild(renderer.domElement);
}

function createSea() {
  sea = new Sea();
  sea.mesh.position.y = -game.seaRadius;
  scene.add(sea.mesh);
}

function createLights() {
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
  shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
  ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.deviceWidth = 4096;
  shadowLight.shadow.mapSize.deviceHeight = 4096;

  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);
}

function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -game.seaRadius;
  scene.add(sky.mesh);
}

function createPlane() {
  airplane = new AirPlane();
  airplane.mesh.scale.set(0.25, 0.25, 0.25);
  airplane.mesh.position.y = 100;
  scene.add(airplane.mesh);
}

function createCoins() {
  coinsHolder = new CoinsHolder(20, game, airplane, deltaTime, particlesHolder);
  scene.add(coinsHolder.mesh);
}

function createEnnemies() {
  for (let i = 0; i < 10; i++) {
    const ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  scene.add(ennemiesHolder.mesh);
}

function createParticles() {
  for (let i = 0; i < 10; i++) {
    const particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  scene.add(particlesHolder);
}


function normalize(v, vmin, vmax, tmin, tmax) {
  const nv = Math.max(Math.min(v, vmax), vmin);
  const dv = vmax - vmin;
  const pc = (nv - vmin) / dv;
  const dt = tmax - tmin;
  const tv = tmin + (pc * dt);
  return tv;
}

function updateEnergy() {
  game.energy -= game.speed * deltaTime * game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);
  energyBar.style.right = `${(100 - game.energy)}%`;
  energyBar.style.backgroundColor = game.energy < 40 ? '#f25346' : '#68c3c0';
  if (game.energy < 30) {
    energyBar.style.animationName = 'blinking';
  } else {
    energyBar.style.animationName = 'none';
  }

  if (game.energy < 1) {
    game.status = 'gameover';
  }
}

function addEnergy() {
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);
}

function removeEnergy() {
  game.energy -= game.ennemyValue;
  game.energy = Math.max(0, game.energy);
}

function updateDistance() {
  game.distance += game.speed * deltaTime * game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
  const d = 502 * (1 - (game.distance % game.distanceForSpeedUpdate)
    / game.distanceForLevelUpdate);
  levelCircle.setAttribute('stroke-dashoffset', d);
}

function updatePlane() {
  game.planeSpeed = normalize(mousePos.x, -0.5, 0.5, game.planeMinSpeed, game.planeMaxSpeed);
  const targetY = normalize(mousePos.y, -0.75, 0.75, game.planeDefaultHeight - game.planeAmpHeight,
    game.planeDefaultHeight + game.planeAmpHeight);
  const targetX = normalize(mousePos.x, -1, 1, -game.planeAmpWidth * 0.7, -game.planeAmpWidth);

  game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
  targetX += game.planeCollisionDisplacementX;

  game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
  targetY += game.planeCollisionDisplacementY;

  airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * deltaTime * game.planeMoveSensivity;
  airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * deltaTime * game.planeMoveSensivity;

  airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * deltaTime * game.planeRotXSensivity;
  airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * deltaTime * game.planeRotZSensivity;

  const targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed,
      game.cameraNearPos, game.cameraFarPos);
  camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
  camera.updateProjectionMatrix();
  camera.position.y += (airplane.mesh.position.y - camera.position.y) * deltaTime * game.cameraSensivity;

  game.planeCollisionSpeedX += (0 - game.planeCollisionSpeedX) * deltaTime * 0.03;
  game.planeCollisionDisplacementX += (0 - game.planeCollisionDisplacementX) * deltaTime * 0.01;
  game.planeCollisionSpeedY += (0 - game.planeCollisionSpeedY) * deltaTime * 0.03;
  game.planeCollisionDisplacementY += (0 - game.planeCollisionDisplacementY) * deltaTime * 0.01;

  airplane.pilot.updateHairs();
}

function showReplay() {
  replayMessage.style.display = 'block';
}

function hideReplay() {
  replayMessage.style.display = 'none';
}

function updateCameraFov() {
  camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
  camera.updateProjectionMatrix();
}

function handleWindowResize() {
  deviceHeight = window.innerHeight;
  deviceWidth = window.innerWidth;
  renderer.setSize(deviceWidth, deviceHeight);
  camera.aspect = deviceWidth / deviceHeight;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  const tx = -1 + ((event.clientX / deviceWidth) * 2);
  const ty = 1 - ((event.clientY / deviceHeight) * 2);

  mousePos = { x: tx, y: ty };
}

function handleTouchMove(event) {
  event.preventDefault();
  const tx = -1 + (event.touches[0].pageX / deviceWidth) * 2;
  const ty = 1 - (event.clientY / deviceHeight) * 2;
  mousePos = { x: tx, y: ty };
}

function handleMouseUp(event) {
  if (game.status === 'waitingReplay') {
    resetGame();
    hideReplay();
  }
}

function handleTouchEnd(event) {
  if (game.status === 'waitingReplay') {
    resetGame();
    hideReplay();
  }
}

function loop() {
  newTime = new Date().getTime();
  deltaTime = newTime - oldTime;
  oldTime = newTime;
  if (game.status === 'playing') {
    if (Math.floor(game.distance) % game.distanceForCoinsSpawn === 0
      && Math.floor(game.distance) > game.coinLastSpawn) {
      game.coinLastSpawn = Math.floor(game.distance);
      coinsHolder.spawnCoins();
    }
    if (Math.floor(game.distance) % game.distanceForSpeedUpdate === 0
      && Math.floor(game.distance) > game.speedLastUpdate) {
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime * deltaTime;
    }
    if (Math.floor(game.distance) % game.distanceForEnnemiesSpawn === 0
      && Math.floor(game.distance) > game.ennemyLastSpawn) {
      game.ennemyLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }
    if (Math.floor(game.distance) % game.distanceForLevelUpdate === 0
      && Math.floor(game.distance) > game.levelLastUpdate) {
      game.levelLastUpdate = Math.floor(game.distance);
      game.level++;
      filedLevel.innerHTML = Math.floor(game.level);
      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel * game.level;
    }
    updatePlane();
    updateDistance();
    updateEnergy();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.planeSpeed;
  } else if (game.status === 'gameover') {
    game.speed *= 0.99;
    airplane.mesh.rotation.z += (-Math.PI / 2 - airplane.mesh.rotation.z) * 0.0002 * deltaTime;
    airplane.mesh.rotation.x += 0.0003 * deltaTime;
    game.planeFallSpeed *= 1.05;
    airplane.mesh.position.y -= game.planeFallSpeed * deltaTime;
    if (airplane.mesh.position.y < -200) {
      showReplay();
      game.status = 'waitingReplay';
    }
  }
  airplane.propeller.rotation.x += 0.2 + game.planeSpeed * deltaTime * 0.005;
  sea.mesh.rotation.z += game.speed * deltaTime;

  if (sea.mesh.rotation.z > 2 * Math.PI) sea.mesh.rotation.z -= 2 * Math.PI;
  ambientLight.intensity += (0.5 - ambientLight.intensity) * deltaTime * 0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();

  sky.moveClouds();
  sea.moveWaves();
  airplane.pilot.updateHairs();
  updateCameraFov();
  // sea.moveWaves();

  // sky.mesh.rotation.z += 0.01;

  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
}

function init() {
  // UI
  fieldDistance = document.getElementById('distValue');
  energyBar = document.getElementById('energyBar');
  replayMessage = document.getElementById('replayMessage');
  fieldLevel = document.getElementById('levelValue');
  levelCircle = document.getElementById('levelCircleStroke');

  resetGame();
  createScene();

  createLights();
  createPlane();
  createSea();
  createSky();
  createCoins();
  createEnnemies();
  createParticles();

  window.addEventListener('resize', handleWindowResize, false);
  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);

  loop();
}

window.addEventListener('load', init, false);
