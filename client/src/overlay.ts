import * as PB from './protobuf/server_pb';
import * as BABYLON from '@babylonjs/core';

const CoordinateType = PB.AddObject.Overlay.CoordinateType;

export class Overlay {
  uuid: string
  __position: BABYLON.Vector3
  __elem: HTMLElement
  __coordType: PB.AddObject.Overlay.CoordinateType
  constructor(elem: HTMLElement, position: BABYLON.Vector3, coordType: PB.AddObject.Overlay.CoordinateType, uuid: string);

  constructor (elem: HTMLElement, position: BABYLON.Vector3, coordType: PB.AddObject.Overlay.CoordinateType, uuid: string) {
    this.__position = position;
    this.__elem = elem;
    this.__coordType = coordType;
    this.__elem.style.position = 'absolute';
    this.uuid = uuid;
  }

  render (canvas: HTMLCanvasElement, scene: BABYLON.Scene) {
    let x: number;
    let y: number;

    if (this.__coordType === CoordinateType.WORLD_COORDINATE) {
      const p = BABYLON.Vector3.Project(
        this.__position,
        BABYLON.Matrix.Identity(),
        scene.getTransformMatrix(),
        new BABYLON.Viewport(0, 0, canvas.width, canvas.height)
      );
      x = p.x;
      y = p.y;
    } else {
      console.assert(this.__coordType === CoordinateType.SCREEN_COORDINATE);
      x = this.__position.x;
      y = this.__position.y;
    }
    this.__elem.style.top = '' + y + 'px';
    this.__elem.style.left = '' + x + 'px';
  }

  dispose () {
    this.__elem.remove();
  }
}
