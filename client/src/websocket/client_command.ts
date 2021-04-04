import * as PB from "../protobuf/client_pb.js";

export function sendSuccess(websocket: WebSocket, command_id: Uint8Array, message: string): void {
    let result_success = new PB.Result();
    result_success.setSuccess(message);
    result_success.setUuid(command_id);

    let command = new PB.PBClientCommand();
    command.setResult(result_success);

    websocket.send(command.serializeBinary());
}

export function sendFailure(websocket: WebSocket, command_id: Uint8Array, message: string): void {
    let result_failure = new PB.Result();
    result_failure.setFailure(message);
    result_failure.setUuid(command_id);

    let command = new PB.PBClientCommand();
    command.setResult(result_failure);

    websocket.send(command.serializeBinary());
}

export function sendImage(websocket: WebSocket, command_id: Uint8Array, blob: Blob): Promise<void> {
    return new Promise(function (resolve: () => void, reject: (reason?: any) => void) {
        blob.arrayBuffer().then(
            function (buffer: ArrayBuffer): void {
                let image = new PB.Image();
                image.setData(new Uint8Array(buffer));
                image.setUuid(command_id);

                let command = new PB.PBClientCommand();
                command.setImage(image);

                websocket.send(command.serializeBinary());
                resolve();
            },
            function (reason: any): void {
                reject(reason);
            }
        )
    })
}