import * as THREE from 'three';

import * as PB from './protobuf/server_pb';

const CoordinateType = PB.AddObject.Overlay.CoordinateType;

export class Overlay {
  uuid: string
  __position: THREE.Vector3
  __elem: HTMLElement
  __coordType: PB.AddObject.Overlay.CoordinateType
  constructor(elem: HTMLElement, position: THREE.Vector3, coordType:PB.AddObject.Overlay.CoordinateType, uuid: string);

  constructor (elem: HTMLElement, position: THREE.Vector3, coordType:PB.AddObject.Overlay.CoordinateType, uuid: string) {
    this.__position = position;
    this.__elem = elem;
    this.__coordType = coordType;
    this.__elem.style.position = 'absolute';
    this.uuid = uuid;
  }

  render (canvas: HTMLCanvasElement, camera: THREE.Camera) {
    let x = this.__position.x;
    let y = this.__position.y;

    if (this.__coordType === CoordinateType.WORLD_COORDINATE) {
      const p = new THREE.Vector3().copy(this.__position);
      p.project(camera);
      x = (canvas.width / 2) * (p.x + 1.0);
      y = (canvas.height / 2) * (-p.y + 1.0);
    } else {
      console.assert(this.__coordType === CoordinateType.SCREEN_COORDINATE);
    }
    this.__elem.style.top = '' + y + 'px';
    this.__elem.style.left = '' + x + 'px';
  }

  dispose () {
    this.__elem.remove();
  }
}
