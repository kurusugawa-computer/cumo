import * as THREE from 'three';

export class Overlay {
  uuid: string
  __position: THREE.Vector3
  __elem: HTMLElement
  constructor(elem: HTMLElement, position: THREE.Vector3, uuid: string);

  constructor (elem: HTMLElement, position: THREE.Vector3, uuid: string) {
    this.__position = position;
    this.__elem = elem;
    this.__elem.style.position = 'absolute';
    this.uuid = uuid;
  }

  render (canvas: HTMLCanvasElement, camera: THREE.Camera) {
    const p = new THREE.Vector3().copy(this.__position);
    p.project(camera);
    const x = (canvas.width / 2) * (p.x + 1.0);
    const y = (canvas.height / 2) * (-p.y + 1.0);
    this.__elem.style.top = '' + y + 'px';
    this.__elem.style.left = '' + x + 'px';
  }

  dispose () {
    this.__elem.remove();
  }
}
