import * as BABYLON from '@babylonjs/core';
import { VecXYZf } from '../../protobuf/client';

export function Vector32VecXYZf (v: BABYLON.Vector3): VecXYZf {
  return new VecXYZf({
    x: v.x,
    y: v.y,
    z: v.z
  });
}
