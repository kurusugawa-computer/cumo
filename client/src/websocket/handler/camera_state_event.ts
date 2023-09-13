import { CameraState } from '../../protobuf/client';
import { SetCameraStateEventHandler } from '../../protobuf/server';
import { PointCloudViewer } from '../../viewer';
import { sendCameraStateChanged, sendFailure, sendSuccess } from '../client_command';

export function handleSetCameraStateEventHandler (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, action: SetCameraStateEventHandler) {
  switch (action.Action) {
    case 'addWithInterval':
      handleAddWithInterval(websocket, commandID, viewer, action.addWithInterval);
      break;
    case 'removeAll':
      handleRemoveAll(websocket, commandID, viewer);
      break;
    case 'removeByUuid':
      handleRemoveByUUID(websocket, commandID, viewer, action.removeByUuid);
  }
}

function handleAddWithInterval (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, interval: number) {
  let lastDispatched = performance.now();
  const handler = (e:{ newState: CameraState }) => {
    const now = performance.now();
    if (now - lastDispatched > interval) {
      lastDispatched = now;
      sendCameraStateChanged(websocket, commandID, e.newState);
    }
  };
  viewer.cameraEventHandler.statechange[commandID] = handler;
  viewer.cameraInput.addEventListerner('statechange', handler);
  sendSuccess(websocket, commandID, 'success');
}

function handleRemoveAll (websocket: WebSocket, commandID: string, viewer: PointCloudViewer) {
  for (const uuid in viewer.cameraEventHandler.statechange) {
    const handler = viewer.cameraEventHandler.statechange[uuid];
    viewer.cameraInput.removeEventListener('statechange', handler);
    delete viewer.cameraEventHandler.statechange[uuid];
  }
  sendSuccess(websocket, commandID, 'success');
}

function handleRemoveByUUID (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, uuid: string) {
  const UUID = uuid.toUpperCase();
  if (UUID in viewer.cameraEventHandler.statechange) {
    const handler = viewer.cameraEventHandler.statechange[UUID];
    viewer.cameraInput.removeEventListener('statechange', handler);
    delete viewer.cameraEventHandler.statechange[UUID];
    sendSuccess(websocket, commandID, 'success');
  } else {
    sendFailure(websocket, commandID, `handler ${UUID} not found`);
  }
}
