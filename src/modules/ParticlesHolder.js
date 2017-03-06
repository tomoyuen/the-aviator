import * as THREE from 'three';
import Particle from './Particle';
import state from '../config';

var { particlesPool } = state;

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

export default ParticlesHolder;
