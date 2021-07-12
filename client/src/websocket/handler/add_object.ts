import * as PB from '../../protobuf/server_pb.js';

import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';

import * as THREE from 'three';
import { Overlay } from '../../overlay';
import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';

export function handleAddObject (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, addObject: PB.AddObject | undefined): void {
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

export function handleOverlay (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, overlay: PB.AddObject.Overlay | undefined) {
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

export function addOverlayHTML (viewer: PointCloudViewer, element: HTMLElement, position: PB.VecXYZf) {
  viewer.overlayContainer.appendChild(element);
  const p = new THREE.Vector3(position.getX(), position.getY(), position.getZ());
  const overlay = new Overlay(element, p);
  viewer.overlays.push(overlay);
}

export function handleLineSet (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, lineset: PB.AddObject.LineSet | undefined): void {
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

export function handlePointCloud (
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
