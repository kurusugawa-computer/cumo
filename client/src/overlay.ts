import * as PB from './protobuf/server';
import * as BABYLON from '@babylonjs/core';

const CoordinateType = PB.AddObjectOverlayCoordinateType;

export class Overlay {
  uuid: string
  __position: BABYLON.Vector3
  __elem: HTMLElement
  __coordType: PB.AddObjectOverlayCoordinateType
  constructor(elem: HTMLElement, position: BABYLON.Vector3, coordType: PB.AddObjectOverlayCoordinateType, uuid: string);

  constructor (elem: HTMLElement, position: BABYLON.Vector3, coordType: PB.AddObjectOverlayCoordinateType, uuid: string) {
    this.__position = position;
    this.__elem = elem;
    this.__coordType = coordType;
    this.__elem.style.position = 'absolute';
    this.uuid = uuid;
  }

  render (canvas: HTMLCanvasElement, scene: BABYLON.Scene) {
    let x: number;
    let y: number;

    const offset = canvas.getClientRects()[0];

    if (this.__coordType === CoordinateType.WORLD_COORDINATE) {
      const p = BABYLON.Vector3.Project(
        this.__position,
        BABYLON.Matrix.IdentityReadOnly,
        scene.getTransformMatrix(),
        new BABYLON.Viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
      );
      x = p.x / window.devicePixelRatio;
      y = p.y / window.devicePixelRatio;
    } else {
      console.assert(this.__coordType === CoordinateType.SCREEN_COORDINATE);
      x = this.__position.x;
      y = this.__position.y;
    }
    this.__elem.style.top = '' + (y + offset.top) + 'px';
    this.__elem.style.left = '' + (x + offset.left) + 'px';
  }

  dispose () {
    this.__elem.remove();
  }
}
