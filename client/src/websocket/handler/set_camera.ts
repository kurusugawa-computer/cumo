import * as PB from '../../protobuf/server_pb.js';
import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';
import * as THREE from 'three';

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
    default:
      sendFailure(websocket, commandID, 'message has not any camera parameters');
      break;
  }
}

function setOrthographicCamera (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, frustumHeight: number) {
  viewer.config.camera.orthographic.frustum = frustumHeight;

  const aspect = window.innerWidth / window.innerHeight;
  viewer.orthographicCamera.left = -frustumHeight * aspect / 2;
  viewer.orthographicCamera.right = frustumHeight * aspect / 2;
  viewer.orthographicCamera.top = frustumHeight / 2;
  viewer.orthographicCamera.bottom = -frustumHeight / 2;

  viewer.orthographicCamera.updateProjectionMatrix();
  if (viewer.config.camera.usePerspective) {
    viewer.switchCamera(false);
  }
  sendSuccess(websocket, commandID, 'success');
}

function setPerspectiveCamera (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, fov: number) {
  viewer.config.camera.perspective.fov = fov;
  viewer.perspectiveCamera.fov = fov;
  viewer.perspectiveCamera.updateProjectionMatrix();
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

  viewer.orthographicCamera.position.set(position.getX(), position.getY(), position.getZ());
  viewer.perspectiveCamera.position.set(position.getX(), position.getY(), position.getZ());
  viewer.controls.update();
  sendSuccess(websocket, commandID, 'success');
}

function setCameraTarget (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, target: PB.VecXYZf | undefined) {
  if (target === undefined) {
    sendFailure(websocket, commandID, 'failed to get camera position');
    return;
  }

  viewer.controls.target.set(target.getX(), target.getY(), target.getZ());
  viewer.orthographicCamera.lookAt(target.getX(), target.getY(), target.getZ());
  viewer.perspectiveCamera.lookAt(target.getX(), target.getY(), target.getZ());
  viewer.controls.update();
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
  const up = new THREE.Vector3();
  if (PBup === undefined) {
    up.copy(THREE.Object3D.DefaultUp);
  } else {
    up.set(PBup.getX(), PBup.getY(), PBup.getZ());
  }

  viewer.controls.setRoll(angle, up);
  viewer.controls.update();
  sendSuccess(websocket, commandID, 'success');
}
