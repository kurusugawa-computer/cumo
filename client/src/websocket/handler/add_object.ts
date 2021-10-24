import * as PB from '../../protobuf/server_pb.js';

import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';

import * as THREE from 'three';
import * as imageType from 'image-type';
import { Overlay } from '../../overlay';
import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';

export function handleAddObject (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, addObject: PB.AddObject | undefined): void {
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
      handlePointCloud(websocket, commandID, viewer, addObject.getPointCloud());
      break;
    case objectCase.OVERLAY:
      handleOverlay(websocket, commandID, viewer, addObject.getOverlay());
      break;
    case objectCase.MESH:
      handleMesh(websocket, commandID, viewer, addObject.getMesh());
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any object');
      break;
  }
}

function handleOverlay (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, overlay: PB.AddObject.Overlay | undefined) {
  if (overlay === undefined || !overlay.hasPosition()) {
    sendFailure(websocket, commandID, 'failed to get overlay command');
    return;
  }
  const position = overlay.getPosition();
  if (position === undefined) {
    sendFailure(websocket, commandID, 'message has not position');
    return;
  }
  const coordType = overlay.getType();
  const contentsCase = PB.AddObject.Overlay.ContentsCase;
  switch (overlay.getContentsCase()) {
    case contentsCase.TEXT:
      addOverlayText(websocket, commandID, viewer, overlay.getText(), position, coordType);
      break;
    case contentsCase.IMAGE:
      addOverlayImage(websocket, commandID, viewer, overlay.getImage(), position, coordType);
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any contents');
      break;
  }
}

function addOverlayImage (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, image: PB.AddObject.Overlay.Image | undefined, position: PB.VecXYZf, coordType: PB.AddObject.Overlay.CoordinateType) {
  if (image === undefined) {
    sendFailure(websocket, commandID, 'failed to get image');
    return;
  }
  const div = document.createElement('div');
  const img = document.createElement('img');

  const data = image.getData_asU8();
  const type = imageType.default(data);
  if (type === null) {
    sendFailure(websocket, commandID, 'unknown data type');
    return;
  }

  img.src = 'data:' + type.mime + ';base64,' + image.getData_asB64();
  img.style.width = '100%';
  div.style.width = image.getWidth() + 'px';
  div.appendChild(img);
  addOverlayHTML(viewer, div, position, coordType, commandID);
  sendSuccess(websocket, commandID, commandID);
}

function addOverlayText (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, text: string, position: PB.VecXYZf, coordType: PB.AddObject.Overlay.CoordinateType) {
  const div = document.createElement('div');
  div.innerText = text;
  div.style.color = 'white';
  div.style.mixBlendMode = 'difference';
  addOverlayHTML(viewer, div, position, coordType, commandID);
  sendSuccess(websocket, commandID, commandID);
}

function addOverlayHTML (viewer: PointCloudViewer, element: HTMLElement, position: PB.VecXYZf, coordType: PB.AddObject.Overlay.CoordinateType, commandID: string) {
  viewer.overlayContainer.appendChild(element);
  const p = new THREE.Vector3(position.getX(), position.getY(), position.getZ());
  const overlay = new Overlay(element, p, coordType, commandID);
  viewer.overlays.push(overlay);
}

function handleMesh (websocket: WebSocket, commandID:string, viewer: PointCloudViewer, PBmesh: PB.AddObject.Mesh | undefined):void {
  if (PBmesh === undefined) {
    sendFailure(websocket, commandID, 'failed to get mesh');
    return;
  }
  const points = PBmesh.getPointsList();
  const positions: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const v = points[i];
    positions.push(v.getX(), v.getY(), v.getZ());
  }
  const a = PBmesh.getVertexAIndexList();
  const b = PBmesh.getVertexBIndexList();
  const c = PBmesh.getVertexCIndexList();
  const indices: number[] = [];
  for (let i = 0; i < a.length; i++) {
    indices.push(a[i], b[i], c[i]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.MeshBasicMaterial();

  const PBcolors = PBmesh.getColorsList();
  if (PBcolors.length !== 0) {
    material.vertexColors = true;
    const colors: number[] = [];
    for (let i = 0; i < PBcolors.length; i++) {
      colors.push(
        Math.max(Math.min(1, PBcolors[i].getR())),
        Math.max(Math.min(1, PBcolors[i].getG())),
        Math.max(Math.min(1, PBcolors[i].getB()))
      );
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }

  const mesh = new THREE.Mesh(geometry, material);
  viewer.scene.add(mesh);
  sendSuccess(websocket, commandID, mesh.uuid);
}

function handleLineSet (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, lineset: PB.AddObject.LineSet | undefined): void {
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
  const material = new THREE.LineBasicMaterial();

  const PBcolors = lineset.getColorsList();
  if (PBcolors.length !== 0) {
    material.vertexColors = true;
    const colors: number[] = [];
    for (let i = 0; i < PBcolors.length; i++) {
      colors.push(
        Math.max(Math.min(1, PBcolors[i].getR())),
        Math.max(Math.min(1, PBcolors[i].getG())),
        Math.max(Math.min(1, PBcolors[i].getB()))
      );
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }

  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const linesegments = new THREE.LineSegments(geometry, material);
  viewer.scene.add(linesegments);
  sendSuccess(websocket, commandID, linesegments.uuid);
}

function handlePointCloud (
  websocket: WebSocket,
  commandID: string,
  viewer: PointCloudViewer,
  pbPointcloud: PB.AddObject.PointCloud | undefined
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
  sendSuccess(websocket, commandID, pointcloud.uuid);
}
