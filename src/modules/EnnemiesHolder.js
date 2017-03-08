/* eslint no-param-reassign: off */
import * as THREE from 'three';
import { Colors, game, deltaTime, ennemiesPool } from '../config';
import Ennemy from './Ennemy';

function removeEnergy() {
  game.energy -= game.ennemyValue;
  game.energy = Math.max(0, game.energy);
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

      const diffPos = game.airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
      const d = diffPos.length();
      if (d < game.ennemyDistanceTolerance) {
        this.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);
        ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
        this.mesh.remove(ennemy.mesh);
        game.planeCollisionSpeedX = 100 * diffPos.x / d;
        game.planeCollisionSpeedY = 100 * diffPos.y / d;
        game.ambientLight.intensity = 2;

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

export default EnnemiesHolder;
