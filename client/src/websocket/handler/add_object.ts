import * as PB from '../../protobuf/server';

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
  switch (addObject.Object) {
    case 'lineSet':
      handleLineSet(websocket, commandID, viewer, addObject.lineSet);
      break;
    case 'pointCloud':
      handlePointCloud(websocket, commandID, viewer, addObject.pointCloud);
      break;
    case 'overlay':
      handleOverlay(websocket, commandID, viewer, addObject.overlay);
      break;
    case 'mesh':
      handleMesh(websocket, commandID, viewer, addObject.mesh);
      break;
    case 'image':
      handleImage(websocket, commandID, viewer, addObject.image);
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any object');
      break;
  }
}

function handleOverlay (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, overlay: PB.AddObjectOverlay | undefined) {
  if (overlay === undefined || !overlay.hasPosition) {
    sendFailure(websocket, commandID, 'failed to get overlay command');
    return;
  }
  const position = overlay.position;
  if (position === undefined) {
    sendFailure(websocket, commandID, 'message has not position');
    return;
  }
  const coordType = overlay.type;
  switch (overlay.Contents) {
    case 'html':
      addOverlayHTMLText(websocket, commandID, viewer, overlay.html, position, coordType);
      break;
    case 'image':
      addOverlayImage(websocket, commandID, viewer, overlay.image, position, coordType);
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any contents');
      break;
  }
}

function addOverlayImage (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, image: PB.AddObjectOverlayImage | undefined, position: PB.VecXYZf, coordType: PB.AddObjectOverlayCoordinateType) {
  if (image === undefined) {
    sendFailure(websocket, commandID, 'failed to get image');
    return;
  }
  const div = document.createElement('div');
  const img = document.createElement('img');

  const data = image.data;
  const type = imageType.default(data);
  if (type === null) {
    sendFailure(websocket, commandID, 'unknown data type');
    return;
  }

  const url = URL.createObjectURL(new Blob([image.data], {
    type: type.mime
  }));

  img.src = url;
  img.style.width = '100%';
  div.style.width = image.width + 'px';
  div.appendChild(img);
  addOverlayHTML(viewer, div, position, coordType, commandID);
  sendSuccess(websocket, commandID, commandID);
}

function addOverlayHTMLText (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, html: string, position: PB.VecXYZf, coordType: PB.AddObjectOverlayCoordinateType) {
  const div = document.createElement('div');
  div.innerHTML = html;
  addOverlayHTML(viewer, div, position, coordType, commandID);
  sendSuccess(websocket, commandID, commandID);
}

function addOverlayHTML (viewer: PointCloudViewer, element: HTMLElement, position: PB.VecXYZf, coordType: PB.AddObjectOverlayCoordinateType, commandID: string) {
  viewer.overlayContainer.appendChild(element);
  const p = new BABYLON.Vector3(position.x, position.y, position.z);
  const overlay = new Overlay(element, p, coordType, commandID);
  viewer.overlays.push(overlay);
}

function handleMesh (websocket: WebSocket, commandID:string, viewer: PointCloudViewer, PBmesh: PB.AddObjectMesh | undefined):void {
  if (PBmesh === undefined) {
    sendFailure(websocket, commandID, 'failed to get mesh');
    return;
  }
  const points = PBmesh.points;
  const positions: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const v = points[i];
    positions.push(v.x, v.y, v.z);
  }
  const a = PBmesh.vertexAIndex;
  const b = PBmesh.vertexBIndex;
  const c = PBmesh.vertexCIndex;
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

  const PBcolors = PBmesh.colors;
  if (PBcolors.length !== 0) {
    const colors: number[] = [];
    for (let i = 0; i < PBcolors.length; i++) {
      colors.push(
        Math.max(0, Math.min(1, PBcolors[i].r)),
        Math.max(0, Math.min(1, PBcolors[i].g)),
        Math.max(0, Math.min(1, PBcolors[i].b)),
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

function handleLineSet (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, lineset: PB.AddObjectLineSet | undefined): void {
  if (lineset === undefined) {
    sendFailure(websocket, commandID, 'failed to get lineset');
    return;
  }
  const points = lineset.points;
  const positions: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const v = points[i];
    positions.push(v.x, v.y, v.z);
  }

  const fromIndex = lineset.fromIndex;
  const toIndex = lineset.toIndex;
  const indices: number[] = [];
  for (let i = 0; i < fromIndex.length; i++) {
    indices.push(fromIndex[i]);
    indices.push(toIndex[i]);
  }

  const PBcolors = lineset.colors;
  const colors: number[] = [];
  for (let i = 0; i < PBcolors.length; i++) {
    colors.push(
      Math.max(0, Math.min(255, PBcolors[i].r)),
      Math.max(0, Math.min(255, PBcolors[i].g)),
      Math.max(0, Math.min(255, PBcolors[i].b))
    );
  }

  const widths = lineset.widths;

  viewer.linesets.push(new Lineset(positions, indices, colors, widths, commandID));

  sendSuccess(websocket, commandID, commandID);
}

function handlePointCloud (
  websocket: WebSocket,
  commandID: string,
  viewer: PointCloudViewer,
  pbPointcloud: PB.AddObjectPointCloud | undefined
): void {
  if (pbPointcloud === undefined) {
    sendFailure(websocket, commandID, 'failure to get pointcloud');
    return;
  }

  const data_ = pbPointcloud.pcdData;
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
  mat.pointSize = pbPointcloud.pointSize;

  const mesh = new BABYLON.Mesh(commandID, viewer.scene);
  vertexData.applyToMesh(mesh, true);
  mesh.material = mat;

  sendSuccess(websocket, commandID, commandID);
}

function handleImage (
  websocket: WebSocket,
  commandID: string,
  viewer: PointCloudViewer,
  pbImage: PB.AddObjectImage | undefined
) {
  if (pbImage === undefined) {
    sendFailure(websocket, commandID, 'failed to get image');
    return;
  }

  const data = pbImage.data;
  const type = imageType.default(data);
  if (type === null) {
    sendFailure(websocket, commandID, 'unknown data type');
    return;
  }

  const url = URL.createObjectURL(new Blob([data], {
    type: type.mime
  }));

  const texture = new BABYLON.Texture(
    url,
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
      mat.backFaceCulling = !pbImage.doubleSide;
      mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
      mat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
      mat.useAlphaFromDiffuseTexture = true;

      const ul = pbImage.upperLeft;
      const ll = pbImage.lowerLeft;
      const lr = pbImage.lowerRight;
      if (ul === undefined || ll === undefined || lr === undefined) {
        sendFailure(websocket, commandID, 'failed to get position');
        return;
      }

      const vertexData = new BABYLON.VertexData();

      vertexData.positions = [
        ll.x, ll.y, ll.z,
        lr.x, lr.y, lr.z,
        ul.x, ul.y, ul.z,
        ul.x + (lr.x - ll.x), ul.y + (lr.y - ll.y), ul.z + (lr.z - ll.z)
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
