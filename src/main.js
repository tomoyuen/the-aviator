/* global window, document */
/* eslint no-console: off */
/* eslint no-var: off */
/* eslint no-param-reassign: ["error", { "props": false }] */
import * as THREE from 'three';

import AirPlane from './modules/Airplane';
import Sea from './modules/Sea';
import Sky from './modules/Sky';

let scene;
let camera;
let fieldOfView;
let aspectRatio;
let nearPlane;
let farPlane;
let deviceHeight;
let deviceWidth;
let container;
var renderer;
var mousePos = { x: 0, y: 0 };

const sea = new Sea();
let sky;
let airplane;

function createScene() {
  deviceHeight = window.innerHeight;
  deviceWidth = window.innerWidth;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

  aspectRatio = deviceWidth / deviceHeight;
  fieldOfView = 60;
  nearPlane = 1;
  farPlane = 10000;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );

  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = 100;

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
  shadowLight.shadow.mapSize.deviceWidth = 2048;
  shadowLight.shadow.mapSize.deviceHeight = 2048;

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

function normalize(v, vmin, vmax, tmin, tmax) {
  const nv = Math.max(Math.min(v, vmax), vmin);
  const dv = vmax - vmin;
  const pc = (nv - vmin) / dv;
  const dt = tmax - tmin;
  const tv = tmin + (pc * dt);
  return tv;
}

function updatePlane() {
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

function loop() {
  updatePlane();
  airplane.pilot.updateHairs();
  updateCameraFov();
  sea.moveWaves();

  sky.mesh.rotation.z += 0.01;

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
