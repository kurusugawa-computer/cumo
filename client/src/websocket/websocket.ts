import * as PB from '../protobuf/server';

import { PointCloudViewer } from '../viewer';
import { sendFailure } from './client_command';

import { handleAddControl } from './handler/add_control';
import { handleAddObject } from './handler/add_object';
import { handleScreenCapture } from './handler/capture_screen';
import { handleLogMessage } from './handler/log_message';
import { handleRemoveControl } from './handler/remove_control';
import { handleRemoveObject } from './handler/remove_object';
import { handleSetCamera } from './handler/set_camera';
import { handleSetControl } from './handler/set_control';
import { handleSetEnable } from './handler/set_enable';
import { handleSetKeyEvent } from './handler/set_key_event';

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
  const commandID = message.UUID.toUpperCase();
  try {
    switch (message.Command) {
      case 'logMessage':
        handleLogMessage(websocket, commandID, message.logMessage);
        break;
      case 'captureScreen':
        handleScreenCapture(websocket, commandID, viewer);
        break;
      case 'addCustomControl':
        handleAddControl(websocket, commandID, viewer, message.addCustomControl);
        break;
      case 'setCamera':
        handleSetCamera(websocket, commandID, viewer, message.setCamera);
        break;
      case 'addObject':
        handleAddObject(websocket, commandID, viewer, message.addObject);
        break;
      case 'setKeyEventHandler':
        handleSetKeyEvent(websocket, commandID, viewer, message.setKeyEventHandler);
        break;
      case 'removeObject':
        handleRemoveObject(websocket, commandID, viewer, message.removeObject);
        break;
      case 'removeCustomControl':
        handleRemoveControl(websocket, commandID, viewer, message.removeCustomControl);
        break;
      case 'setCustomControl':
        handleSetControl(websocket, commandID, viewer, message.setCustomControl);
        break;
      case 'setEnable':
        handleSetEnable(websocket, commandID, viewer, message.setEnable);
        break;
      default:
        sendFailure(websocket, commandID, 'message has not any command');
        break;
    }
  } catch (error) {
    console.error(error);
    sendFailure(websocket, commandID, `uncaught error: ${error}`);
  }
}
