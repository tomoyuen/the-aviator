/* global window, document */
/* eslint no-console: off */
/* eslint no-var: off */
import * as THREE from 'three';

const Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xF5986E,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
};

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

function handleWindowResize() {
  deviceHeight = window.innerHeight;
  deviceWidth = window.innerWidth;
  renderer.setSize(deviceWidth, deviceHeight);
  camera.aspect = deviceWidth / deviceHeight;
  camera.updateProjectionMatrix();
}

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

  window.addEventListener('resize', handleWindowResize, false);
}

class Sea {
  constructor() {
    const geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    geom.mergeVertices();

    const l = geom.vertices.length;

    this.waves = [];

    for (let i = 0; i < l; i += 1) {
      const v = geom.vertices[i];

      this.waves.push({
        y: v.y,
        x: v.x,
        z: v.z,
        ang: Math.random() * Math.PI * 2,
        amp: 5 + (Math.random() * 15),
        speed: 0.016 + (Math.random() * 0.032),
      });
    }

    const mat = new THREE.MeshPhongMaterial({
      color: Colors.blue,
      transparent: true,
      opacity: 0.8,
      shading: THREE.FlatShading,
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
  }
  moveWaves() {
    const verts = this.mesh.geometry.vertices;
    const l = verts.length;

    for (let i = 0; i < l; i += 1) {
      const v = verts[i];
      const vprops = this.waves[i];

      v.x = vprops.x + (Math.cos(vprops.ang) * vprops.amp);
      v.y = vprops.y + (Math.sin(vprops.ang) * vprops.amp);

      vprops.ang += vprops.speed;
    }

    this.mesh.geometry.verticesNeedUpdate = true;

    this.mesh.rotation.z += 0.005;
  }
}

class Cloud {
  constructor() {
    this.mesh = new THREE.Object3D();
    const geom = new THREE.BoxGeometry(20, 20, 20);

    const mat = new THREE.MeshPhongMaterial({
      color: Colors.white,
    });

    const nBlocs = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < nBlocs; i += 1) {
      const m = new THREE.Mesh(geom, mat);
      m.position.x = i * 15;
      m.position.y = Math.random() * 10;
      m.position.z = Math.random() * 10;
      m.rotation.z = Math.random() * Math.PI * 2;
      m.rotation.y = Math.random() * Math.PI * 2;

      const s = 0.1 + (Math.random() * 0.9);
      m.scale.set(s, s, s);

      m.castShadow = true;
      m.receiveShadow = true;

      this.mesh.add(m);
    }
  }
}

class Sky {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.nClouds = 20;
    const stepAngle = (Math.PI * 2) / this.nClouds;
    for (let i = 0; i < this.nClouds; i += 1) {
      const c = new Cloud();
      const a = stepAngle * i;
      const h = 750 + (Math.random() * 200);
      c.mesh.position.y = Math.sin(a) * h;
      c.mesh.position.x = Math.cos(a) * h;

      c.mesh.rotation.z = a + (Math.PI / 2);

      c.mesh.position.z = -400 - (Math.random() * 400);

      const s = 1 + (Math.random() * 2);
      c.mesh.scale.set(s, s, s);

      this.mesh.add(c.mesh);
    }
  }
}

class Pilot {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = 'pilot';

    this.angleHairs = 0;

    const bodyGeom = new THREE.BoxGeometry(15, 15, 15);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      shading: THREE.FlatShading,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(2, -12, 0);
    this.mesh.add(body);

    const faceGeom = new THREE.BoxGeometry(10, 10, 10);
    const faceMat = new THREE.MeshLambertMaterial({ color: Colors.pink });
    const face = new THREE.Mesh(faceGeom, faceMat);
    this.mesh.add(face);

    const hairGeom = new THREE.BoxGeometry(4, 4, 4);
    const hairMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
    const hair = new THREE.Mesh(hairGeom, hairMat);
    hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));

    const hairs = new THREE.Object3D();

    this.hairsTop = new THREE.Object3D();

    for (let i = 0; i < 12; i += 1) {
      const h = hair.clone();
      const col = i % 3;
      const row = Math.floor(i / 3);
      const startPosZ = -4;
      const startPosX = -4;
      h.position.set(startPosX + (row * 4), 0, startPosZ + (col * 4));
      this.hairsTop.add(h);
    }
    hairs.add(this.hairsTop);

    const hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
    hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
    const hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
    const hairSideL = hairSideR.clone();
    hairSideR.position.set(8, -2, 6);
    hairSideL.position.set(8, -2, -6);
    hairs.add(hairSideR);
    hairs.add(hairSideL);

    const hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
    const hairBack = new THREE.Mesh(hairBackGeom, hairMat);
    hairBack.position.set(-1, -4, 0);
    hairs.add(hairBack);
    hairs.position.set(-5, 5, 0);

    this.mesh.add(hairs);

    const glassGeom = new THREE.BoxGeometry(5, 5, 5);
    const glassMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
    const glassR = new THREE.Mesh(glassGeom, glassMat);
    glassR.position.set(6, 0, 3);
    const glassL = glassR.clone();
    glassL.position.z = -glassR.position.z;

    const glassAGeom = new THREE.BoxGeometry(11, 1, 11);
    const glassA = new THREE.Mesh(glassAGeom, glassMat);
    this.mesh.add(glassR);
    this.mesh.add(glassL);
    this.mesh.add(glassA);

    const earGeom = new THREE.BoxGeometry(2, 3, 2);
    const earL = new THREE.Mesh(earGeom, faceMat);
    earL.position.set(0, 0, -6);
    const earR = earL.clone();
    earR.position.set(0, 0, 6);
    this.mesh.add(earL);
    this.mesh.add(earR);
  }

  updateHairs() {
    const hairs = this.hairsTop.children;

    const l = hairs.length;
    for (let i = 0; i < l; i += 1) {
      const h = hairs[i];
      h.scale.y = 0.75 + (Math.cos(this.angleHairs + (i / 3)) * 0.25);
    }
    this.angleHairs += 0.16;
  }
}

class AirPlane {
  constructor() {
    this.mesh = new THREE.Object3D();
    const geomCockpit = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
    const matCockpit = new THREE.MeshPhongMaterial({
      color: Colors.red,
      shading: THREE.FlatShading,
    });
    geomCockpit.vertices[4].y -= 10;
    geomCockpit.vertices[4].z += 20;
    geomCockpit.vertices[5].y -= 10;
    geomCockpit.vertices[5].z -= 20;
    geomCockpit.vertices[6].y += 30;
    geomCockpit.vertices[6].z += 20;
    geomCockpit.vertices[7].y += 30;
    geomCockpit.vertices[7].z -= 20;

    const cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    const geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
    const matEngine = new THREE.MeshPhongMaterial({
      color: Colors.white,
      shading: THREE.FlatShading,
    });
    const engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    const geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
    const matTailPlane = new THREE.MeshPhongMaterial({
      color: Colors.red,
      shading: THREE.FlatShading,
    });
    const tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35, 25, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);

    const geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
    const matSideWing = new THREE.MeshPhongMaterial({
      color: Colors.red,
      shading: THREE.FlatShading,
    });
    const sideWing = new THREE.Mesh(geomSideWing, matSideWing);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);

    const geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
    const matPropeller = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      shading: THREE.FlatShading,
    });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    const geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
    const matBlade = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      shading: THREE.FlatShading,
    });

    const blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8, 0, 0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    this.propeller.position.set(50, 0, 0);
    this.mesh.add(this.propeller);

    const wheelProtecGeom = new THREE.BoxGeometry(30, 15, 10, 1, 1, 1);
    const wheelProtecMat = new THREE.MeshPhongMaterial({
      color: Colors.red,
      shading: THREE.FlatShading,
    });
    const wheelProtecR = new THREE.Mesh(wheelProtecGeom, wheelProtecMat);
    wheelProtecR.position.set(25, -20, 25);
    this.mesh.add(wheelProtecR);

    const wheelTireGeom = new THREE.BoxGeometry(24, 24, 4);
    const wheelTireMat = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      shading: THREE.FlatShading,
    });
    const wheelTireR = new THREE.Mesh(wheelTireGeom, wheelTireMat);
    wheelTireR.position.set(25, -28, 25);

    const wheelAxisGeom = new THREE.BoxGeometry(10, 10, 6);
    const wheelAxisMat = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      shading: THREE.FlatShading,
    });
    const wheelAxis = new THREE.Mesh(wheelAxisGeom, wheelAxisMat);
    wheelTireR.add(wheelAxis);

    this.mesh.add(wheelTireR);

    const wheelProtecL = wheelProtecR.clone();
    wheelProtecL.position.z = -wheelProtecR.position.z;
    this.mesh.add(wheelProtecL);

    const wheelTireL = wheelTireR.clone();
    wheelTireL.position.z = -wheelTireR.position.z;
    this.mesh.add(wheelTireL);

    const wheelTireB = wheelTireR.clone();
    wheelTireB.scale.set(0.5, 0.5, 0.5);
    wheelTireB.position.set(-35, -5, 0);
    this.mesh.add(wheelTireB);

    const suspensionGeom = new THREE.BoxGeometry(4, 20, 4);
    suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 10, 0));
    const suspensionMat = new THREE.MeshPhongMaterial({
      color: Colors.red,
      shading: THREE.FlatShading,
    });
    const suspension = new THREE.Mesh(suspensionGeom, suspensionMat);
    suspension.position.set(-35, -5, 0);
    suspension.rotation.z = -0.3;
    this.mesh.add(suspension);

    this.pilot = new Pilot();
    this.pilot.mesh.position.set(-10, 27, 0);
    this.mesh.add(this.pilot.mesh);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }
}

const sea = new Sea();
let sky;
let airplane;

function createSea() {
  sea.mesh.position.y = -600;
  scene.add(sea.mesh);
}

sea.moveWaves();

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

function handleMouseMove(event) {
  var tx = -1 + ((event.clientX / deviceWidth) * 2);

  var ty = 1 - ((event.clientY / deviceHeight) * 2);
  mousePos = { x: tx, y: ty };
}

function loop() {
  airplane.propeller.rotation.x += 0.3;
  sea.mesh.rotation.z += 0.005;
  sky.mesh.rotation.z += 0.01;

  updatePlane();
  airplane.pilot.updateHairs();

  renderer.render(scene, camera);
}

function init() {
  createScene();
  createLights();
  createPlane();
  createSea();
  createSky();

  document.addEventListener('mousemove', handleMouseMove, false);

  loop();
}

window.addEventListener('load', init, false);
