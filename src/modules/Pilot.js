import * as THREE from 'three';
import Colors from '../config';

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

export default Pilot;
