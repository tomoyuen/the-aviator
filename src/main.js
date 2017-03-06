/* eslint no-console: off */
/* eslint one-var: off */
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

import state from './config';

var { game, deltaTime, ennemiesPool, particlesPool } = state;

// game variables
var newTime = new Date().getTime(),
  oldTime = new Date().getTime(),
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
  hemisphereLight,
  shadowLight,
  // container
  coinsHolder,
  ennemiesHolder,
  // UI
  fieldLevel,
  fieldDistance,
  energyBar,
  replayMessage,
  levelCircle,
  sea,
  sky;

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
  game.ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);
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
  scene.add(game.ambientLight);
}

function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -game.seaRadius;
  scene.add(sky.mesh);
}

function createPlane() {
  game.airplane = new AirPlane();
  game.airplane.mesh.scale.set(0.25, 0.25, 0.25);
  game.airplane.mesh.position.y = 100;
  scene.add(game.airplane.mesh);
}

function createCoins() {
  coinsHolder = new CoinsHolder(20, game, game.airplane, deltaTime, game.particlesHolder);
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
  game.particlesHolder = new ParticlesHolder();
  console.log(game.particlesHolder);
  scene.add(game.particlesHolder.mesh);
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

function updateDistance() {
  game.distance += game.speed * deltaTime * game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
  const d = 502 * (1 - (game.distance % game.distanceForSpeedUpdate)
    / game.distanceForLevelUpdate);
  levelCircle.setAttribute('stroke-dashoffset', d);
}

function updatePlane() {
  var targetY = normalize(mousePos.y, -0.75, 0.75, game.planeDefaultHeight - game.planeAmpHeight,
    game.planeDefaultHeight + game.planeAmpHeight);
  var targetX = normalize(mousePos.x, -1, 1, -game.planeAmpWidth * 0.7, -game.planeAmpWidth);
  game.planeSpeed = normalize(mousePos.x, -0.5, 0.5, game.planeMinSpeed, game.planeMaxSpeed);

  game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
  targetX += game.planeCollisionDisplacementX;

  game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
  targetY += game.planeCollisionDisplacementY;

  game.airplane.mesh.position.y
    += (targetY - game.airplane.mesh.position.y)
    * deltaTime
    * game.planeMoveSensivity;
  game.airplane.mesh.position.x
    += (targetX - game.airplane.mesh.position.x)
    * deltaTime
    * game.planeMoveSensivity;

  game.airplane.mesh.rotation.z
    = (targetY - game.airplane.mesh.position.y)
    * deltaTime
    * game.planeRotXSensivity;
  game.airplane.mesh.rotation.x
    = (game.airplane.mesh.position.y - targetY)
    * deltaTime
    * game.planeRotZSensivity;

  // const targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed,
  //     game.cameraNearPos, game.cameraFarPos);
  camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
  camera.updateProjectionMatrix();
  camera.position.y
    += (game.airplane.mesh.position.y - camera.position.y)
    * deltaTime
    * game.cameraSensivity;

  game.planeCollisionSpeedX += (0 - game.planeCollisionSpeedX) * deltaTime * 0.03;
  game.planeCollisionDisplacementX += (0 - game.planeCollisionDisplacementX) * deltaTime * 0.01;
  game.planeCollisionSpeedY += (0 - game.planeCollisionSpeedY) * deltaTime * 0.03;
  game.planeCollisionDisplacementY += (0 - game.planeCollisionDisplacementY) * deltaTime * 0.01;

  game.airplane.pilot.updateHairs();
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

function handleMouseUp() {
  if (game.status === 'waitingReplay') {
    state.resetGame(fieldLevel);
    hideReplay();
  }
}

function handleTouchEnd() {
  if (game.status === 'waitingReplay') {
    state.resetGame(fieldLevel);
    hideReplay();
  }
}

function loop() {
  newTime = new Date().getTime();
  state.updateTime(newTime, oldTime);
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
      fieldLevel.innerHTML = Math.floor(game.level);
      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel * game.level;
    }
    updatePlane();
    updateDistance();
    updateEnergy();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.planeSpeed;
  } else if (game.status === 'gameover') {
    game.speed *= 0.99;
    game.airplane.mesh.rotation.z
      += (-Math.PI / 2 - game.airplane.mesh.rotation.z)
      * 0.0002
      * deltaTime;
    game.airplane.mesh.rotation.x += 0.0003 * deltaTime;
    game.planeFallSpeed *= 1.05;
    game.airplane.mesh.position.y -= game.planeFallSpeed * deltaTime;
    if (game.airplane.mesh.position.y < -200) {
      showReplay();
      game.status = 'waitingReplay';
    }
  }
  game.airplane.propeller.rotation.x += 0.2 + game.planeSpeed * deltaTime * 0.005;
  sea.mesh.rotation.z += game.speed * deltaTime;

  if (sea.mesh.rotation.z > 2 * Math.PI) sea.mesh.rotation.z -= 2 * Math.PI;
  game.ambientLight.intensity += (0.5 - game.ambientLight.intensity) * deltaTime * 0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();

  sky.moveClouds();
  sea.moveWaves();
  game.airplane.pilot.updateHairs();
  updateCameraFov();
  // sea.moveWaves();

  // sky.mesh.rotation.z += 0.01;

  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
}

function init() {
  // UI
  fieldLevel = document.getElementById('levelValue');
  fieldDistance = document.getElementById('distValue');
  energyBar = document.getElementById('energyBar');
  replayMessage = document.getElementById('replayMessage');
  levelCircle = document.getElementById('levelCircleStroke');

  state.resetGame(fieldLevel);
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
