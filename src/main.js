/* global window, document */
/* eslint no-console: off */
/* eslint no-param-reassign: ["error", { "props": false }] */
import * as THREE from 'three';
import TweenMax from 'gsap';

import AirPlane from './modules/Airplane';
import Sea from './modules/Sea';
import Sky from './modules/Sky';

// game variables
var game,
  deltaTime = 0,
  newTime = new Date().getTime(),
  oldTime = new Date().getTime(),
  ennemiesPool = [],
  particlesPool = [],
  particlesInUse = [];

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

  filedLevel.innerHTML = Math.floor(game.level);
}

// three.js related variables
var scene,
  camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  container,
  renderer;

// screen & mouse variables
var deviceHeight,
  deviceWidth,
  mousePos = { x: 0, y: 0 };

class Ennemy {
  constructor() {
    var geom = new THREE.TetrahedronGeometry(8, 2);
    var mat = new THREE.MeshPhongMaterial({
      color: Colors.red,
      shininess: 0,
      specular: 0xffffff,
      shading: THREE.FlatShading,
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.angle = 0;
    this.dist = 0;
  }
}

class EnnemiesHolder {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.ennemiesInUse = [];
  }

  spawnEnnemies() {
    var nEnnemies = game.level;

    for (let i = 0; i < nEnnemies; i++) {
      let ennemy;
      if (ennemiesPool.length) {
        ennemy = ennemiesPool.pop();
      } else {
        ennemy = new Ennemy();
      }
      ennemy.angle = -(i * 0.1);
      ennemy.distance = game.seaRadius
        + game.planeDefaultHeight
        + (-1 + (Math.random() * 2) * (game.planeAmpHeight - 20));
      ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;
      ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;

      this.mesh.add(ennemy.mesh);
      this.ennemiesInUse.push(ennemy);
    }
  }
  rotateEnnemies() {
    this.ennemiesInUse.forEach((ennemy, i) => {
      ennemy.angle += game.speed * deltaTime * game.ennemiesSpeed;
      if (ennemy.angle > Math.PI * 2) ennemy.angle -= Math.PI * 2;

      ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;
      ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
      ennemy.mesh.rotation.y += Math.random() * 0.1;
      ennemy.mesh.rotation.z += Math.random() * 0.1;

      const diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
      const d = diffPos.length();
      if (d < game.ennemyDistanceTolerance) {
        this.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);
        ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
        this.mesh.remove(ennemy.mesh);
        game.planeCollisionSpeedX = 100 * diffPos.x / d;
        game.planeCollisionSpeedY = 100 * diffPos.y / d;
        ambientLight.intensity = 2;

        removeEnergy();
        i--;
      } else if (ennemy.angle > Math.PI) {
        ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
        this.mesh.remove(ennemy.mesh);
        i--;
      }
    });
  }
}

class Particle {
  constructor() {
    const geom = new THREE.TetrahedronGeometry(3, 0);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x009999,
      shininess: 0,
      specular: 0xffffff,
      shading: THREE.FlatShading,
    });
    this.mesh = new THREE.Mesh(geom, mat);
  }

  explode(pos, color, scale) {
    const self = this;
    const p = this.mesh.parent;
    this.mesh.material.color = new THREE.Color(color);
    this.mesh.material.needsUpdate = true;
    this.mesh.scale.set(scale, scale, scale);
    const targetX = pos.x + (-1 + Math.random() * 2) * 50;
    const targetY = pos.y + (-1 + Math.random() * 2) * 50;
    const speed = 0.6 * Math.random() * 0.2;
    TweenMax.to(this.mesh.rotation, speed, {
      x: Math.random() * 12,
      y: Math.random() * 12,
    });
    TweenMax.to(this.mesh.scale, speed, {
      x: 0.1,
      y: 0.1,
      z: 0.1,
    });
    TweenMax.to(this.mesh.position, speed, {
      x: targetX,
      y: targetY,
      delay: Math.random() * 0.1,
      ease: Power2.easeOut,
      onComplete() {
        if (p) p.remove(self.mesh);
        self.mesh.scale.set(1, 1, 1);
        particlesPool.unshift(self);
      },
    });
  }
}

class ParticlesHolder {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.particlesInUse = [];
  }

  spawnParticles(pos, density, color, scale) {
    var nParticles = density;
    for (let i = 0; i < nParticles; i++) {
      let particle;
      if (particlesPool.length) {
        particle = particlesPool.pop();
      } else {
        particle = new Particle();
      }
      this.mesh.add(particle.mesh);
      particle.mesh.visible = true;
      particle.mesh.position.x = pos.x;
      particle.mesh.position.y = pos.y;
      particle.explode(pos, color, scale);
    }
  }
}

class Coin {
  constructor() {
    const geom = new THREE.TetrahedronGeometry(5, 0);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x009999,
      shininess: 0,
      specular: 0xffffff,
      shading: THREE.FlatShading,
    });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.angle = 0;
    this.dist = 0;
  }
}

class CoinsHolder {
  constructor(nCoins) {
    this.mesh = new THREE.Object3D();
    this.coinsInUse = [];
    this.coinsPool = [];
    for (let i = 0; i < nCoins; i++) {
      const coin = new Coin();
      this.coinsPool.push(coin);
    }
  }

  spawnCoins() {
    const nCoins = 1 + Math.floor(Math.random() * 10);
    const d = game.seaRadius
      + game.planeDefaultHeight
      + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
    const amplitude = 10 + Math.round(Math.random() * 10);
    for (let i = 0; i < nCoins; i++) {
      let coin;
      if (this.coinsPool.length) {
        coin = this.coinsPool.pop();
      } else {
        coin = new Coin();
      }
      this.mesh.add(coin.mesh);
      this.coinsInUse.push(coin);
      coin.angle = -(i * 0.02);
      coin.distance = d + Math.cos(i * 0.5) * amplitude;
      coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
      coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
    }
  }
  rotateCoins() {
    for (let i = 0; i < this.coinsInUse.length; i++) {
      const coin = this.coinsInUse[i];
      if (coin.exploding) continue;
      coin.angle += game.speed * deltaTime * game.coinsSpeed;
      if (coin.angle > Math.PI * 2) coin.angle -= Math.PI * 2;
      coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
      coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
      coin.mesh.rotation.z += Math.random() * 0.1;
      coin.mesh.rotation.y += Math.random() * 0.1;

      const diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
      const d = diffPos.length();
      if (d < game.coinDistanceTolerance) {
        this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
        this.mesh.remove(coin.mesh);
        particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, 0.8);
        addEnergy();
        i--;
      } else if (coin.angle > Math.PI) {
        this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
        this.mesh.remove(coin.mesh);
        i--;
      }
    }
  }
}
const sea = new Sea();
let sky;
let airplane;

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
  sea.mesh.position.y = -600;
  scene.add(sea.mesh);
}

function createLights() {
  const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
  const shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
  const ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);
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
  sky.mesh.position.y = -600;
  scene.add(sky.mesh);
}

function createPlane() {
  airplane = new AirPlane();
  airplane.mesh.scale.set(0.25, 0.25, 0.25);
  airplane.mesh.position.y = 100;
  scene.add(airplane.mesh);
}

function createCoins() {
  coinsHolder = new CoinsHolder(20);
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

function updatePlane() {
  game.planeSpeed = normalize(mousePos.x, -0.5, 0.5, game.planeMinSpeed, game.planeMaxSpeed);

  const targetY = normalize(mousePos.y, -0.75, 0.75, 25, 175);

  airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * 0.1;
  airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * 0.0128;
  airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * 0.0064;

  airplane.propeller.rotation.x += 0.3;
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
      filedLevel.innerHTML = Math.incrementSpeedByLevel * game.level;
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
  window.addEventListener('resize', handleWindowResize, false);
  document.addEventListener('mousemove', handleMouseMove, false);

  createScene();
  createLights();
  createPlane();
  createSea();
  createSky();

  loop();
  window.scene = scene;
}

window.addEventListener('load', init, false);
