import * as PB from '../../protobuf/server';
import { PointCloudViewer } from '../../viewer';
import { sendFailure, sendKeyDown, sendKeyPress, sendKeyUp, sendSuccess } from '../client_command';

export function handleSetKeyEvent (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, setKeyEventHandler: PB.SetKeyEventHandler | undefined) {
  if (setKeyEventHandler === undefined) {
    sendFailure(websocket, commandID, 'failed to get command');
    return;
  }
  switch (setKeyEventHandler.Event) {
    case 'keyup':
      handleSetKeyUp(websocket, commandID, viewer, setKeyEventHandler.keyup);
      break;
    case 'keydown':
      handleSetKeyDown(websocket, commandID, viewer, setKeyEventHandler.keydown);
      break;
    case 'keypress':
      handleSetKeyPress(websocket, commandID, viewer, setKeyEventHandler.keypress);
      break;
    default:
      sendFailure(websocket, commandID, 'event not set');
      break;
  }
}

function handleSetKeyUp (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, enable: boolean | undefined) {
  if (enable === undefined) {
    sendFailure(websocket, commandID, 'failed to get command');
    return;
  }
  if (viewer.keyEventHandler.onKeyUp !== null) {
    document.removeEventListener('keyup', viewer.keyEventHandler.onKeyUp);
    viewer.keyEventHandler.onKeyUp = null;
  }
  if (enable) {
    viewer.keyEventHandler.onKeyUp = (ev: KeyboardEvent) => { sendKeyUp(websocket, commandID, ev); };
    document.addEventListener('keyup', viewer.keyEventHandler.onKeyUp);
  }
  sendSuccess(websocket, commandID, 'success');
}

function handleSetKeyDown (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, enable: boolean | undefined) {
  if (enable === undefined) {
    sendFailure(websocket, commandID, 'failed to get command');
    return;
  }
  if (viewer.keyEventHandler.onKeyDown !== null) {
    document.removeEventListener('keydown', viewer.keyEventHandler.onKeyDown);
    viewer.keyEventHandler.onKeyDown = null;
  }
  if (enable) {
    viewer.keyEventHandler.onKeyDown = (ev: KeyboardEvent) => { sendKeyDown(websocket, commandID, ev); };
    document.addEventListener('keydown', viewer.keyEventHandler.onKeyDown);
  }
  sendSuccess(websocket, commandID, 'success');
}

function handleSetKeyPress (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, enable: boolean | undefined) {
  if (enable === undefined) {
    sendFailure(websocket, commandID, 'failed to get command');
    return;
  }
  if (viewer.keyEventHandler.onKeyPress !== null) {
    document.removeEventListener('keypress', viewer.keyEventHandler.onKeyPress);
    viewer.keyEventHandler.onKeyPress = null;
  }
  if (enable) {
    viewer.keyEventHandler.onKeyPress = (ev: KeyboardEvent) => { sendKeyPress(websocket, commandID, ev); };
    document.addEventListener('keypress', viewer.keyEventHandler.onKeyPress);
  }
  sendSuccess(websocket, commandID, 'success');
}
