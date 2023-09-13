import { CameraState, CameraStateCameraMode } from '../../protobuf/client';
import { PointCloudViewer } from '../../viewer';
import * as BABYLON from '@babylonjs/core';
import { sendCameraState } from '../client_command';
import { Vector32VecXYZf } from '../handler/util';

export function handleGetCameraState (websocket: WebSocket, commandID: string, viewer: PointCloudViewer): void {
  viewer.cameraInput.updateCameraFrustum();
  const cameraState = new CameraState({
    position: Vector32VecXYZf(viewer.camera.position),
    target: Vector32VecXYZf(viewer.cameraInput.target),
    up: Vector32VecXYZf(viewer.camera.upVector),
    mode: viewer.camera.mode === BABYLON.Camera.PERSPECTIVE_CAMERA ? CameraStateCameraMode.PERSPECTIVE : CameraStateCameraMode.ORTHOGRAPHIC,
    rollLock: viewer.cameraInput.noRoll,
    fov: viewer.camera.fov,
    frustumHeight: (viewer.camera.orthoTop ?? 0) - (viewer.camera.orthoBottom ?? 0)
  });
  sendCameraState(websocket, commandID, cameraState);
}
