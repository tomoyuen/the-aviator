import * as THREE from 'three';
import { TweenMax, Power2 } from 'gsap';
import { particlesPool } from '../config';

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

export default Particle;
