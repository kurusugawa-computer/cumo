import * as PB from '../../protobuf/server_pb.js';

import * as imageType from 'image-type';
import { Overlay } from '../../overlay';
import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';
import { Lineset } from '../../lineset';
import { PCDLoader } from '@loaders.gl/pcd';
import * as Loaders from '@loaders.gl/core';

import * as BABYLON from '@babylonjs/core';

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
    case objectCase.IMAGE:
      handleImage(websocket, commandID, viewer, addObject.getImage());
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
    case contentsCase.HTML:
      addOverlayHTMLText(websocket, commandID, viewer, overlay.getHtml(), position, coordType);
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

function addOverlayHTMLText (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, html: string, position: PB.VecXYZf, coordType: PB.AddObject.Overlay.CoordinateType) {
  const div = document.createElement('div');
  div.innerHTML = html;
  addOverlayHTML(viewer, div, position, coordType, commandID);
  sendSuccess(websocket, commandID, commandID);
}

function addOverlayHTML (viewer: PointCloudViewer, element: HTMLElement, position: PB.VecXYZf, coordType: PB.AddObject.Overlay.CoordinateType, commandID: string) {
  viewer.overlayContainer.appendChild(element);
  const p = new BABYLON.Vector3(position.getX(), position.getY(), position.getZ());
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
  const material = new BABYLON.StandardMaterial(commandID, viewer.scene);
  material.emissiveColor = new BABYLON.Color3(1, 1, 1);

  const mesh = new BABYLON.Mesh(commandID, viewer.scene);
  mesh.material = material;

  const vertex = new BABYLON.VertexData();
  vertex.positions = positions;
  vertex.indices = indices;

  const PBcolors = PBmesh.getColorsList();
  if (PBcolors.length !== 0) {
    const colors: number[] = [];
    for (let i = 0; i < PBcolors.length; i++) {
      colors.push(
        Math.max(0, Math.min(1, PBcolors[i].getR())),
        Math.max(0, Math.min(1, PBcolors[i].getG())),
        Math.max(0, Math.min(1, PBcolors[i].getB())),
        0
      );
    }
    vertex.colors = colors;
  }

  const normals:BABYLON.FloatArray = [];
  BABYLON.VertexData.ComputeNormals(
    vertex.positions,
    vertex.indices,
    normals
  );
  vertex.normals = normals;

  vertex.applyToMesh(mesh);

  sendSuccess(websocket, commandID, commandID);
}

function handleLineSet (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, lineset: PB.AddObject.LineSet | undefined): void {
  if (lineset === undefined) {
    sendFailure(websocket, commandID, 'failed to get lineset');
    return;
  }
  const points = lineset.getPointsList();
  const positions: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const v = points[i];
    positions.push(v.getX(), v.getY(), v.getZ());
  }

  const fromIndex = lineset.getFromIndexList();
  const toIndex = lineset.getToIndexList();
  const indices: number[] = [];
  for (let i = 0; i < fromIndex.length; i++) {
    indices.push(fromIndex[i]);
    indices.push(toIndex[i]);
  }

  const PBcolors = lineset.getColorsList();
  const colors: number[] = [];
  for (let i = 0; i < PBcolors.length; i++) {
    colors.push(
      Math.max(0, Math.min(255, PBcolors[i].getR())),
      Math.max(0, Math.min(255, PBcolors[i].getG())),
      Math.max(0, Math.min(255, PBcolors[i].getB()))
    );
  }

  const widths = lineset.getWidthsList();

  viewer.linesets.push(new Lineset(positions, indices, colors, widths, commandID));

  sendSuccess(websocket, commandID, commandID);
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

  const data_ = pbPointcloud.getPcdData_asU8();
  const data = data_.buffer.slice(data_.byteOffset);

  const pc = Loaders.parseSync(data, PCDLoader);

  const vertexData = new BABYLON.VertexData();

  // https://loaders.gl/docs/specifications/category-mesh#gltf-attribute-name-mapping

  if ('POSITION' in pc.attributes) {
    const positions:Float32Array = pc.attributes.POSITION.value;
    vertexData.set(positions, BABYLON.VertexBuffer.PositionKind);
  }

  if ('COLOR_0' in pc.attributes) {
    const color: Uint8Array | Uint16Array | Float32Array = pc.attributes.COLOR_0.value;
    const size: number = pc.attributes.COLOR_0.size;
    const normalizedColor: Float32Array | null = (() => {
      switch (color.BYTES_PER_ELEMENT) {
        case 1:
          return Float32Array.from(color, v => v / 255);
        case 2:
          return Float32Array.from(color, v => v / 65535);
        case 4:
          if (color instanceof Float32Array) {
            return color;
          }
          break;
        default:
          break;
      }
      sendFailure(websocket, commandID, `unsupported type: ${Object.prototype.toString.call(color)}, BYTES_PER_ELEMENT: ${color.BYTES_PER_ELEMENT}`);
      return null;
    })();
    if (normalizedColor === null) { return; };
    if (size === 4) {
      const n = normalizedColor.length / 4;
      const rgba = new Float32Array(n * 4);

      for (let i = 0; i < n; i++) {
        rgba[i * 4 + 0] = normalizedColor[i * 3 + 2];
        rgba[i * 4 + 1] = normalizedColor[i * 3 + 1];
        rgba[i * 4 + 2] = normalizedColor[i * 3 + 0];
        rgba[i * 4 + 3] = normalizedColor[i * 4 + 3];
      }
      vertexData.set(rgba, BABYLON.VertexBuffer.ColorKind);
    } else if (size === 3) {
      const n = normalizedColor.length / 3;
      const rgba = new Float32Array(n * 4);

      for (let i = 0; i < n; i++) {
        rgba[i * 4 + 0] = normalizedColor[i * 3 + 2];
        rgba[i * 4 + 1] = normalizedColor[i * 3 + 1];
        rgba[i * 4 + 2] = normalizedColor[i * 3 + 0];
        rgba[i * 4 + 3] = 1.0;
      }
      vertexData.set(rgba, BABYLON.VertexBuffer.ColorKind);
    } else {
      sendFailure(websocket, commandID, `unsupported element size: ${color.BYTES_PER_ELEMENT}`);
    }
  }

  const mat = new BABYLON.StandardMaterial(commandID, viewer.scene);
  mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
  mat.disableLighting = true;
  mat.pointsCloud = true;
  mat.pointSize = pbPointcloud.getPointSize();

  const mesh = new BABYLON.Mesh(commandID, viewer.scene);
  vertexData.applyToMesh(mesh, true);
  mesh.material = mat;

  sendSuccess(websocket, commandID, commandID);
}

function handleImage (
  websocket: WebSocket,
  commandID: string,
  viewer: PointCloudViewer,
  pbImage: PB.AddObject.Image | undefined
) {
  if (pbImage === undefined) {
    sendFailure(websocket, commandID, 'failed to get image');
    return;
  }

  const data = pbImage.getData_asU8();
  const type = imageType.default(data);
  if (type === null) {
    sendFailure(websocket, commandID, 'unknown data type');
    return;
  }

  const texture = new BABYLON.Texture(
    'data:' + type.mime + ';base64,' + pbImage.getData_asB64(),
    viewer.scene,
    undefined, // noMipmapOrOptions
    undefined, // invertY
    undefined, // samplingMode
    () => {
      // onLoad
      console.log('load');
      const mat = new BABYLON.StandardMaterial(commandID, viewer.scene);
      mat.diffuseTexture = texture;
      mat.diffuseTexture.hasAlpha = true;
      mat.backFaceCulling = !pbImage.getDoubleSide();
      mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
      mat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
      mat.useAlphaFromDiffuseTexture = true;

      const ul = pbImage.getUpperLeft();
      const ll = pbImage.getLowerLeft();
      const lr = pbImage.getLowerRight();
      if (ul === undefined || ll === undefined || lr === undefined) {
        sendFailure(websocket, commandID, 'failed to get position');
        return;
      }

      const vertexData = new BABYLON.VertexData();

      vertexData.positions = [
        ll.getX(), ll.getY(), ll.getZ(),
        lr.getX(), lr.getY(), lr.getZ(),
        ul.getX(), ul.getY(), ul.getZ(),
        ul.getX() + (lr.getX() - ll.getX()), ul.getY() + (lr.getY() - ll.getY()), ul.getZ() + (lr.getZ() - ll.getZ())
      ];
      vertexData.indices = [
        1, 2, 0,
        1, 3, 2
      ];
      vertexData.uvs = [
        0, 0,
        1, 0,
        0, 1,
        1, 1
      ];

      const mesh = new BABYLON.Mesh(commandID, viewer.scene);
      vertexData.applyToMesh(mesh);
      mesh.material = mat;

      sendSuccess(websocket, commandID, commandID);
    },
    () => {
      // onError
      sendFailure(websocket, commandID, 'failed to load texture');
    }
  );
}
