import * as THREE from 'three';
import Cloud from './Cloud';
import state from '../config';

var { game, deltaTime } = state;

class Sky {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.nClouds = 20;
    this.clouds = [];
    const stepAngle = (Math.PI * 2) / this.nClouds;
    for (let i = 0; i < this.nClouds; i += 1) {
      const c = new Cloud();
      this.clouds.push(c);
      const a = stepAngle * i;
      const h = 750 + (Math.random() * 200);
      c.mesh.position.y = Math.sin(a) * h;
      c.mesh.position.x = Math.cos(a) * h;
      c.mesh.position.z = -400 - (Math.random() * 400);
      c.mesh.rotation.z = a + (Math.PI / 2);

      const s = 1 + (Math.random() * 2);
      c.mesh.scale.set(s, s, s);

      this.mesh.add(c.mesh);
    }
  }
  moveClouds() {
    for (let i = 0; i < this.nClouds; i++) {
      const c = this.clouds[i];
      c.rotate();
    }
    this.mesh.rotation.z += game.speed * deltaTime;
  }
}

export default Sky;
