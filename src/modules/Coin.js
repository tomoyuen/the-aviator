import * as THREE from 'three';

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

export default Coin;
