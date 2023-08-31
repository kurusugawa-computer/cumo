import * as PB from '../protobuf/client';

export function sendSuccess (websocket: WebSocket, commandID: string, message: string): void {
  const resultSuccess = new PB.Result();
  resultSuccess.success = message;

  const command = new PB.ClientCommand();
  command.result = resultSuccess;
  command.UUID = commandID;

  websocket.send(command.serializeBinary());
}

export function sendFailure (websocket: WebSocket, commandID: string, message: string): void {
  const resultFailure = new PB.Result();
  resultFailure.failure = message;

  const command = new PB.ClientCommand();
  command.result = resultFailure;
  command.UUID = commandID;

  websocket.send(command.serializeBinary());
  console.error('error: ' + message);
}

export function sendImage (websocket: WebSocket, commandID: string, blob: Blob): Promise<void> {
  return new Promise(function (resolve: () => void, reject: (reason?: any) => void) {
    blob.arrayBuffer().then(
      function (buffer: ArrayBuffer): void {
        const image = new PB.Image();
        image.data = new Uint8Array(buffer);

        const command = new PB.ClientCommand();
        command.image = image;
        command.UUID = commandID;

        websocket.send(command.serializeBinary());
        resolve();
      },
      function (reason: any): void {
        reject(reason);
      }
    );
  });
}

export function sendControlChanged (websocket: WebSocket, commandID: string, value: number | boolean | string) {
  const changed = new PB.ControlChanged();
  switch (typeof (value)) {
    case 'boolean':
      changed.boolean = value;
      break;
    case 'number':
      changed.number = value;
      break;
    case 'string':
      changed.text = value;
      break;
    default:
      console.error('unexpected type:' + typeof (value));
      break;
  }
  const command = new PB.ClientCommand();
  command.controlChanged = changed;
  command.UUID = commandID;
  websocket.send(command.serializeBinary());
}

function KeyboardEvent2Protobuf (event: KeyboardEvent): PB.KeyEventOccurredKeyEvent {
  const ret = new PB.KeyEventOccurredKeyEvent();
  ret.key = event.key;
  ret.code = event.code;
  ret.altKey = event.altKey;
  ret.ctrlKey = event.ctrlKey;
  ret.metaKey = event.metaKey;
  ret.shiftKey = event.shiftKey;
  ret.repeat = event.repeat;
  return ret;
}

export function sendKeyUp (websocket: WebSocket, commandID: string, event: KeyboardEvent) {
  const keyEventOccurred = new PB.KeyEventOccurred();
  keyEventOccurred.keyup = KeyboardEvent2Protobuf(event);
  const command = new PB.ClientCommand();
  command.keyEventOccurred = keyEventOccurred;
  command.UUID = commandID;
  websocket.send(command.serializeBinary());
}

export function sendKeyDown (websocket: WebSocket, commandID: string, event: KeyboardEvent) {
  const keyEventOccurred = new PB.KeyEventOccurred();
  keyEventOccurred.keydown = KeyboardEvent2Protobuf(event);
  const command = new PB.ClientCommand();
  command.keyEventOccurred = keyEventOccurred;
  command.UUID = commandID;
  websocket.send(command.serializeBinary());
}

export function sendKeyPress (websocket: WebSocket, commandID: string, event: KeyboardEvent) {
  const keyEventOccurred = new PB.KeyEventOccurred();
  keyEventOccurred.keypress = KeyboardEvent2Protobuf(event);
  const command = new PB.ClientCommand();
  command.keyEventOccurred = keyEventOccurred;
  command.UUID = commandID;
  websocket.send(command.serializeBinary());
}

export function sendCameraState (websocket: WebSocket, commandID: string, state: PB.CameraState) {
  const command = new PB.ClientCommand();
  command.cameraState = state;
  command.UUID = commandID;
  websocket.send(command.serializeBinary());
}
