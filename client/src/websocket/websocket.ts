import { PBServerCommand, PBPointCloud } from '../protobuf/server_pb.js';

import { PointCloudViewer } from "../viewer";
import { sendSuccess, sendFailure, sendImage } from "./client_command";

import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";

import * as THREE from 'three';

const WEBSOCKET_HOST = 'ws://127.0.0.1';
const WEBSOCKET_PORT = '8081';

export function connectWebSocket(viewer: PointCloudViewer) {
    const websocket = new WebSocket(WEBSOCKET_HOST + ':' + WEBSOCKET_PORT);
    websocket.onmessage = function (ev: MessageEvent) {
        let message = PBServerCommand.deserializeBinary(ev.data);
        handleProtobuf(websocket, viewer, message);
    }
    websocket.onclose = function () {
        console.log("try to reconnecting");
        setTimeout(() => {
            connectWebSocket(viewer);
        }, 3000);
    }
}

function handleProtobuf(websocket: WebSocket, viewer: PointCloudViewer, message: PBServerCommand) {
    const commandCase = PBServerCommand.CommandCase;
    const command_id = message.getUuid_asU8();
    console.log(message.getCommandCase());
    switch (message.getCommandCase()) {
        case commandCase.LOG_MESSAGE:
            handleLogMessage(websocket, command_id, message.getLogMessage());
            break;
        case commandCase.POINT_CLOUD:
            handlePointCloud(websocket, command_id, message.getPointCloud(), viewer);
            break;
        case commandCase.CAPTURE_SCREEN:
            handleScreenCapture(websocket, command_id, viewer);
            break;
        default:
            sendFailure(websocket, message.getUuid_asU8(), "message has not any command");
            break;
    }
}

function handleScreenCapture(websocket: WebSocket, command_id: Uint8Array, viewer: PointCloudViewer) {
    viewer.renderer.domElement.toBlob(
        function (blob: Blob | null): void {
            if (blob === null) {
                sendFailure(websocket, command_id, "failed to generate blob");
            } else {
                sendImage(websocket, command_id, blob).catch(
                    function (reason: any): void {
                        sendFailure(websocket, command_id, "failed to send image: " + reason);
                    }
                );
            }
        }
        , "image/png");
}

function handleLogMessage(websocket: WebSocket, command_id: Uint8Array, message: string): void {
    console.log(message);
    sendSuccess(websocket, command_id, "success");
}

function handlePointCloud(
    websocket: WebSocket,
    command_id: Uint8Array,
    pb_pointcloud: PBPointCloud | undefined,
    viewer: PointCloudViewer
): void {
    if (!pb_pointcloud) {
        sendFailure(websocket, command_id, "failure to get pointcloud");
        return;
    }

    let pointcloud = new PCDLoader().parse(pb_pointcloud.getData_asU8().buffer, "test");
    console.log(command_id);
    console.log(pointcloud);
    if (pointcloud.geometry.boundingSphere) {
        console.log(pointcloud.geometry.boundingSphere);
        const radius = pointcloud.geometry.boundingSphere.radius;
        const dist = radius / 2 / Math.tan(Math.PI * viewer.fov / 360);

        if (pointcloud.material instanceof THREE.PointsMaterial) {
            pointcloud.material.size = 1;
            pointcloud.material.sizeAttenuation = false;
            pointcloud.material.needsUpdate = true;
        }

        let center = pointcloud.geometry.boundingSphere.center;
        viewer.perspective_camera.position.set(center.x, center.y, center.z - dist);
        viewer.perspective_camera.lookAt(center.x, center.y, center.z);
        viewer.controls.target = center;
        viewer.controls.update();
    }
    viewer.scene.add(pointcloud);
    sendSuccess(websocket, command_id, "success");
}
