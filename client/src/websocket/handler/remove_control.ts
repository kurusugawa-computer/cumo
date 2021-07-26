import * as PB from '../../protobuf/server_pb.js';
import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';

export function handleRemoveControl (
  websocket: WebSocket,
  commandID: Uint8Array,
  viewer: PointCloudViewer,
  removeControl: PB.RemoveCustomControl | undefined
) {
  if (removeControl === undefined) {
    sendFailure(websocket, commandID, 'failure to get command');
    return;
  }
  const ObjectCase = PB.RemoveCustomControl.ObjectCase;
  switch (removeControl.getObjectCase()) {
    case ObjectCase.ALL:
      handleRemoveAll(websocket, commandID, viewer);
      break;
    case ObjectCase.BY_UUID:
      console.error('unimplemented');
      break;
    default:
      break;
  }
}

function handleRemoveAll (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer) {
  for (let i = viewer.guiCustom.__controllers.length - 1; i >= 0; i--) {
    viewer.guiCustom.__controllers[i].remove();
  }

  sendSuccess(websocket, commandID, 'success');
}
