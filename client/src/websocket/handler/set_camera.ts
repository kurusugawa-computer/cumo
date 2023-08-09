import * as PB from '../../protobuf/server';
import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';
import * as BABYLON from '@babylonjs/core';

export function handleSetCamera (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, camera: PB.SetCamera | undefined): void {
  if (camera === undefined) {
    sendFailure(websocket, commandID, 'failed to get camera parameter');
    return;
  }
  switch (camera.Camera) {
    case 'orthographicFrustumHeight':
      setOrthographicCamera(websocket, commandID, viewer, camera.orthographicFrustumHeight);
      break;
    case 'perspectiveFov':
      setPerspectiveCamera(websocket, commandID, viewer, camera.perspectiveFov);
      break;
    case 'position':
      setCameraPosition(websocket, commandID, viewer, camera.position);
      break;
    case 'target':
      setCameraTarget(websocket, commandID, viewer, camera.target);
      break;
    case 'roll':
      setCameraRoll(websocket, commandID, viewer, camera.roll);
      break;
    case 'rollLock':
      setCameraRollLock(websocket, commandID, viewer, camera.rollLock);
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any camera parameters');
      break;
  }
}

function setOrthographicCamera (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, frustumHeight: number) {
  viewer.config.camera.orthographic.frustum = frustumHeight;
  const eye = viewer.cameraInput.target.subtract(viewer.camera.position);
  const eyeLength = (() => {
    if (viewer.camera.fovMode === BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED) {
      const frustumWidth = frustumHeight * (viewer.canvas.height / viewer.canvas.width);
      return (frustumWidth / 2) / Math.tan(viewer.camera.fov / 2);
    } else {
      return (frustumHeight / 2) / Math.tan(viewer.camera.fov / 2);
    }
  })();
  eye.normalize().scaleInPlace(eyeLength);
  viewer.cameraInput.target.subtractToRef(eye, viewer.camera.position);
  viewer.cameraInput.checkInputs();
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

  viewer.camera.position.set(position.x, position.y, position.z);
  viewer.cameraInput.checkInputs();

  sendSuccess(websocket, commandID, 'success');
}

function setCameraTarget (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, target: PB.VecXYZf | undefined) {
  if (target === undefined) {
    sendFailure(websocket, commandID, 'failed to get camera position');
    return;
  }

  viewer.cameraInput.target.set(target.x, target.y, target.z);
  viewer.cameraInput.checkInputs();

  sendSuccess(websocket, commandID, 'success');
}

function setCameraRoll (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, roll: PB.SetCameraRoll | undefined) {
  if (roll === undefined) {
    sendFailure(websocket, commandID, 'failed to get roll');
    return;
  }
  const angle = roll.angle;
  if (isNaN(angle)) {
    sendFailure(websocket, commandID, 'angle is NaN');
    return;
  }
  const PBup = roll.up;
  const up = new BABYLON.Vector3();
  if (PBup === undefined) {
    up.copyFrom(BABYLON.Vector3.Up());
  } else {
    up.set(PBup.x, PBup.y, PBup.z);
  }

  viewer.cameraInput.setRoll(Math.PI * angle / 180, up);
  viewer.cameraInput.checkInputs();

  sendSuccess(websocket, commandID, 'success');
}

function setCameraRollLock (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, locked: boolean) {
  viewer.cameraInput.noRoll = locked;
  sendSuccess(websocket, commandID, 'success');
}
