import * as PB from '../../protobuf/server_pb.js';
import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';
import * as BABYLON from '@babylonjs/core';

export function handleSetCamera (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, camera: PB.SetCamera | undefined): void {
  if (camera === undefined) {
    sendFailure(websocket, commandID, 'failed to get camera parameter');
    return;
  }
  const cameraCase = PB.SetCamera.CameraCase;
  switch (camera.getCameraCase()) {
    case cameraCase.ORTHOGRAPHIC_FRUSTUM_HEIGHT:
      setOrthographicCamera(websocket, commandID, viewer, camera.getOrthographicFrustumHeight());
      break;
    case cameraCase.PERSPECTIVE_FOV:
      setPerspectiveCamera(websocket, commandID, viewer, camera.getPerspectiveFov());
      break;
    case cameraCase.POSITION:
      setCameraPosition(websocket, commandID, viewer, camera.getPosition());
      break;
    case cameraCase.TARGET:
      setCameraTarget(websocket, commandID, viewer, camera.getTarget());
      break;
    case cameraCase.ROLL:
      setCameraRoll(websocket, commandID, viewer, camera.getRoll());
      break;
    case cameraCase.ROLL_LOCK:
      setCameraRollLock(websocket, commandID, viewer, camera.getRollLock());
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any camera parameters');
      break;
  }
}

function setOrthographicCamera (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, frustumHeight: number) {
  viewer.config.camera.orthographic.frustum = frustumHeight;
  viewer.cameraInput.frustum = frustumHeight;
  viewer.cameraInput.updateCameraFrustum();
  if (viewer.config.camera.usePerspective) {
    viewer.switchCamera(false);
  }

  sendSuccess(websocket, commandID, 'success');
}

function setPerspectiveCamera (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, fov: number) {
  viewer.config.camera.perspective.fov = fov;
  viewer.camera.fov = fov;
  viewer.cameraInput.updateCameraFrustum();
  if (!viewer.config.camera.usePerspective) {
    viewer.switchCamera(true);
  }
  sendSuccess(websocket, commandID, 'success');
}

function setCameraPosition (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, position: PB.VecXYZf | undefined) {
  if (position === undefined) {
    sendFailure(websocket, commandID, 'failed to get camera position');
    return;
  }

  viewer.camera.position.set(position.getX(), position.getY(), position.getZ());
  viewer.cameraInput.checkInputs();

  sendSuccess(websocket, commandID, 'success');
}

function setCameraTarget (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, target: PB.VecXYZf | undefined) {
  if (target === undefined) {
    sendFailure(websocket, commandID, 'failed to get camera position');
    return;
  }

  viewer.cameraInput.target.set(target.getX(), target.getY(), target.getZ());
  viewer.cameraInput.checkInputs();

  sendSuccess(websocket, commandID, 'success');
}

function setCameraRoll (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, roll: PB.SetCamera.Roll | undefined) {
  if (roll === undefined) {
    sendFailure(websocket, commandID, 'failed to get roll');
    return;
  }
  const angle = roll.getAngle();
  if (isNaN(angle)) {
    sendFailure(websocket, commandID, 'angle is NaN');
    return;
  }
  const PBup = roll.getUp();
  const up = new BABYLON.Vector3();
  if (PBup === undefined) {
    up.copyFrom(BABYLON.Vector3.Up());
  } else {
    up.set(PBup.getX(), PBup.getY(), PBup.getZ());
  }

  viewer.cameraInput.setRoll(Math.PI * angle / 180, up);
  viewer.cameraInput.checkInputs();

  sendSuccess(websocket, commandID, 'success');
}

function setCameraRollLock (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, locked: boolean) {
  viewer.cameraInput.noRoll = locked;
  sendSuccess(websocket, commandID, 'success');
}
