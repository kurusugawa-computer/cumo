import * as PB from '../protobuf/server_pb.js';

import { PointCloudViewer } from '../viewer';
import { sendSuccess, sendFailure, sendImage, sendControlChanged } from './client_command';

import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';

import * as THREE from 'three';
import { Overlay } from '../overlay';

import html2canvas from 'html2canvas';

export function connectWebSocket (viewer: PointCloudViewer, url: string) {
  const websocket = new WebSocket(url);
  websocket.onmessage = function (ev: MessageEvent) {
    const message = PB.ServerCommand.deserializeBinary(ev.data);
    handleProtobuf(websocket, viewer, message);
  };
  websocket.onclose = function () {
    console.log('try to reconnecting');
    setTimeout(() => {
      connectWebSocket(viewer, url);
    }, 3000);
  };
}

function handleProtobuf (websocket: WebSocket, viewer: PointCloudViewer, message: PB.ServerCommand) {
  const commandCase = PB.ServerCommand.CommandCase;
  const commandID = message.getUuid_asU8();
  switch (message.getCommandCase()) {
    case commandCase.LOG_MESSAGE:
      handleLogMessage(websocket, commandID, message.getLogMessage());
      break;
    case commandCase.CAPTURE_SCREEN:
      handleScreenCapture(websocket, commandID, viewer);
      break;
    case commandCase.ADD_CUSTOM_CONTROL:
      handleAddControl(websocket, commandID, viewer, message.getAddCustomControl());
      break;
    case commandCase.SET_CAMERA:
      handleSetCamera(websocket, commandID, viewer, message.getSetCamera());
      break;
    case commandCase.ADD_OBJECT:
      handleAddObject(websocket, commandID, viewer, message.getAddObject());
      break;
    default:
      sendFailure(websocket, message.getUuid_asU8(), 'message has not any command');
      break;
  }
}

function handleAddObject (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, addObject: PB.AddObject | undefined): void {
  if (addObject === undefined) {
    sendFailure(websocket, commandID, 'failed to get add_object command');
    return;
  }
  const objectCase = PB.AddObject.ObjectCase;
  switch (addObject.getObjectCase()) {
    case objectCase.LINE_SET:
      handleLineSet(websocket, commandID, viewer, addObject.getLineSet());
      break;
    case objectCase.POINT_CLOUD:
      handlePointCloud(websocket, commandID, addObject.getPointCloud(), viewer);
      break;
    case objectCase.OVERLAY:
      handleOverlay(websocket, commandID, viewer, addObject.getOverlay());
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any object');
      break;
  }
}

function handleOverlay (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, overlay: PB.AddObject.Overlay | undefined) {
  if (overlay === undefined || !overlay.hasPosition()) {
    sendFailure(websocket, commandID, 'failed to get overlay command');
    return;
  }
  const position = overlay.getPosition();
  if (position === undefined) {
    sendFailure(websocket, commandID, 'message has not position');
    return;
  }
  const contentsCase = PB.AddObject.Overlay.ContentsCase;
  switch (overlay.getContentsCase()) {
    case contentsCase.TEXT:
      {
        const div = document.createElement('div');
        div.innerText = overlay.getText();
        div.style.color = 'white';
        (div.style as any).mixColorBlend = 'difference';
        addOverlayHTML(viewer, div, position);
        sendSuccess(websocket, commandID, 'success');
      }
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any contents');
      break;
  }
}

function addOverlayHTML (viewer: PointCloudViewer, element: HTMLElement, position: PB.VecXYZf) {
  viewer.overlayContainer.appendChild(element);
  const p = new THREE.Vector3(position.getX(), position.getY(), position.getZ());
  const overlay = new Overlay(element, p);
  viewer.overlays.push(overlay);
}

function handleLineSet (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, lineset: PB.AddObject.LineSet | undefined): void {
  if (lineset === undefined) {
    sendFailure(websocket, commandID, 'failed to get lineset');
    return;
  }
  const fromIndex = lineset.getFromIndexList();
  const toIndex = lineset.getToIndexList();
  const points = lineset.getPointsList();
  const positions: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const v = points[i];
    positions.push(v.getX(), v.getY(), v.getZ());
  }
  const indices: number[] = [];
  for (let i = 0; i < fromIndex.length; i++) {
    indices.push(fromIndex[i]);
    indices.push(toIndex[i]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial();
  const linesegments = new THREE.LineSegments(geometry, material);
  viewer.scene.add(linesegments);

  sendSuccess(websocket, commandID, 'success');
}

function handleSetCamera (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, camera: PB.SetCamera | undefined): void {
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
    default:
      sendFailure(websocket, commandID, 'message has not any camera parameters');
      break;
  }
}

function setOrthographicCamera (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, frustumHeight: number) {
  viewer.config.camera.orthographic.frustum = frustumHeight;

  const aspect = window.innerWidth / window.innerHeight;
  viewer.orthographicCamera.left = -frustumHeight * aspect / 2;
  viewer.orthographicCamera.right = frustumHeight * aspect / 2;
  viewer.orthographicCamera.top = frustumHeight / 2;
  viewer.orthographicCamera.bottom = -frustumHeight / 2;

  viewer.orthographicCamera.updateProjectionMatrix();
  if (viewer.config.camera.use_perspective) {
    viewer.switchCamera(false);
  }
  sendSuccess(websocket, commandID, 'success');
}

function setPerspectiveCamera (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, fov: number) {
  viewer.config.camera.perspective.fov = fov;
  viewer.perspectiveCamera.fov = fov;
  viewer.perspectiveCamera.updateProjectionMatrix();
  if (!viewer.config.camera.use_perspective) {
    viewer.switchCamera(true);
  }
  sendSuccess(websocket, commandID, 'success');
}

function setCameraPosition (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, position: PB.VecXYZf | undefined) {
  if (position === undefined) {
    sendFailure(websocket, commandID, 'failed to get camera position');
    return;
  }

  viewer.orthographicCamera.position.set(position.getX(), position.getY(), position.getZ());
  viewer.perspectiveCamera.position.set(position.getX(), position.getY(), position.getZ());
  viewer.controls.update();
  sendSuccess(websocket, commandID, 'success');
}

function setCameraTarget (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, target: PB.VecXYZf | undefined) {
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

function handleScreenCapture (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer) {
  const divcanvas = viewer.getdiv;

  html2canvas(divcanvas).then((canvas) => {
    canvas.toBlob(
      function (blob: Blob | null): void {
        if (blob === null) {
          sendFailure(websocket, commandID, 'failed to generate blob');
        } else {
          sendImage(websocket, commandID, blob).catch(
            function (reason: any): void {
              sendFailure(websocket, commandID, 'failed to send image: ' + reason);
            }
          );
        }
      }
      , 'image/png');
  });
}

function handleLogMessage (websocket: WebSocket, commandID: Uint8Array, message: string): void {
  console.log(message);
  sendSuccess(websocket, commandID, 'success');
}

function handlePointCloud (
  websocket: WebSocket,
  commandID: Uint8Array,
  pbPointcloud: PB.AddObject.PointCloud | undefined,
  viewer: PointCloudViewer
): void {
  if (pbPointcloud === undefined) {
    sendFailure(websocket, commandID, 'failure to get pointcloud');
    return;
  }

  const data = Uint8Array.from(atob(pbPointcloud.getPcdData_asB64()), c => c.charCodeAt(0)).buffer;

  const pointcloud = new PCDLoader().parse(data, 'test');

  if (pointcloud.material instanceof THREE.PointsMaterial) {
    pointcloud.material.size = 1;
    pointcloud.material.sizeAttenuation = false;
    pointcloud.material.needsUpdate = true;
  }
  viewer.scene.add(pointcloud);
  sendSuccess(websocket, commandID, 'success');
}

function handleAddControl (
  websocket: WebSocket,
  commandID: Uint8Array,
  viewer: PointCloudViewer,
  control: PB.CustomControl | undefined
) {
  if (!control) {
    sendFailure(websocket, commandID, 'failure to get control');
    return;
  }
  const propertyName = 'custom_' + btoa(String.fromCharCode(...commandID));
  switch (control.getControlCase()) {
    case PB.CustomControl.ControlCase.BUTTON:
      {
        const button = control.getButton();
        if (button) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: () => { sendControlChanged(websocket, commandID, true); }
            }
          );
          viewer.guiCustom.add(viewer.config.custom, propertyName).name(button.getName());
        }
      }
      break;
    case PB.CustomControl.ControlCase.CHECKBOX:
      {
        const checkbox = control.getCheckbox();
        if (checkbox) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: checkbox.getInitValue(),
              writable: true
            }
          );
          viewer.guiCustom.add(viewer.config.custom, propertyName)
            .name(checkbox.getName())
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case PB.CustomControl.ControlCase.COLOR_PICKER:
      {
        const picker = control.getColorPicker();
        if (picker) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: picker.getInitValue(),
              writable: true
            }
          );
          viewer.guiCustom.addColor(viewer.config.custom, propertyName)
            .name(picker.getName())
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case PB.CustomControl.ControlCase.SELECTBOX:
      {
        const selectbox = control.getSelectbox();
        if (selectbox) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: selectbox.getInitValue(),
              writable: true
            }
          );
          viewer.guiCustom.add(viewer.config.custom, propertyName, selectbox.getItemsList())
            .name(selectbox.getName())
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case PB.CustomControl.ControlCase.SLIDER:
      {
        const slider = control.getSlider();
        if (slider) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: slider.getInitValue(),
              writable: true
            }
          );
          viewer.guiCustom.add(
            viewer.config.custom,
            propertyName,
            slider.getMin(),
            slider.getMax(),
            slider.getStep()
          )
            .name(slider.getName())
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case PB.CustomControl.ControlCase.TEXTBOX:
      {
        const textbox = control.getTextbox();
        if (textbox) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: textbox.getInitValue(),
              writable: true
            }
          );
          viewer.guiCustom.add(viewer.config.custom, propertyName)
            .name(textbox.getName())
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;

    default:
      sendFailure(websocket, commandID, 'invalid command');
      return;
  }
  sendSuccess(websocket, commandID, 'success');
}
