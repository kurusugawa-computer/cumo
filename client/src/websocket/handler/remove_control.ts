import * as PB from '../../protobuf/server';
import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';
import { removeAllInCustom, removeByUUID } from '../../gui/remove_control';

export function handleRemoveControl (
  websocket: WebSocket,
  commandID: string,
  viewer: PointCloudViewer,
  removeControl: PB.RemoveCustomControl | undefined
) {
  if (removeControl === undefined) {
    sendFailure(websocket, commandID, 'failure to get command');
    return;
  }
  switch (removeControl.Object) {
    case 'all':
      handleRemoveAll(websocket, commandID, viewer);
      break;
    case 'byUuid':
      handleRemoveByUUID(websocket, commandID, viewer, removeControl.byUuid);
      break;
    default:
      break;
  }
}

function handleRemoveAll (websocket: WebSocket, commandID: string, viewer: PointCloudViewer) {
  removeAllInCustom(viewer.gui);
  sendSuccess(websocket, commandID, 'success');
}

function handleRemoveByUUID (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, uuid: string) {
  removeByUUID(viewer.gui, uuid);
  sendSuccess(websocket, commandID, 'success');
}
