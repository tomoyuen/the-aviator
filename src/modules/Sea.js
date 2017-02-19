/* eslint no-param-reassign: ["error", { "props": false }] */
import * as THREE from 'three';
import Colors from '../config';

class Sea {
  constructor() {
    const geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    geom.mergeVertices();

    this.waves = [];

    for (const item of geom.vertices) {
      this.waves.push({
        y: item.y,
        x: item.x,
        z: item.z,
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

    verts.forEach((item, index) => {
      const vprops = this.waves[index];

      item.x = vprops.x + (Math.cos(vprops.ang) * vprops.amp);
      item.y = vprops.y + (Math.sin(vprops.ang) * vprops.amp);

      vprops.ang += vprops.speed;
    });

    this.mesh.geometry.verticesNeedUpdate = true;
    this.mesh.rotation.z += 0.005;
  }
}

export default Sea;
