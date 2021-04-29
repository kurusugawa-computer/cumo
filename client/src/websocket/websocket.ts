import * as PB from '../protobuf/server_pb.js';

import { PointCloudViewer } from "../viewer";
import { sendSuccess, sendFailure, sendImage, sendControlChanged } from "./client_command";

import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";

import * as THREE from 'three';

const WEBSOCKET_HOST = 'ws://127.0.0.1';
const WEBSOCKET_PORT = '8081';

export function connectWebSocket(viewer: PointCloudViewer) {
    const websocket = new WebSocket(WEBSOCKET_HOST + ':' + WEBSOCKET_PORT);
    websocket.onmessage = function (ev: MessageEvent) {
        let message = PB.ServerCommand.deserializeBinary(ev.data);
        handleProtobuf(websocket, viewer, message);
    }
    websocket.onclose = function () {
        console.log("try to reconnecting");
        setTimeout(() => {
            connectWebSocket(viewer);
        }, 3000);
    }
}

function handleProtobuf(websocket: WebSocket, viewer: PointCloudViewer, message: PB.ServerCommand) {
    const commandCase = PB.ServerCommand.CommandCase;
    const command_id = message.getUuid_asU8();
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
        case commandCase.ADD_CUSTOM_CONTROL:
            handleAddControl(websocket, command_id, viewer, message.getAddCustomControl());
            break;
        default:
            sendFailure(websocket, message.getUuid_asU8(), "message has not any command");
            break;
    }
}

function handleUsePerspectiveCamera(websocket: WebSocket, command_id: Uint8Array, viewer: PointCloudViewer, use_perspective: boolean): void {
    viewer.switchCamera(use_perspective);
    console.log(use_perspective);
    sendSuccess(websocket, command_id, "success");
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
    pb_pointcloud: PB.PointCloud | undefined,
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

        if (pointcloud.material instanceof THREE.PointsMaterial) {
            pointcloud.material.size = 1;
            pointcloud.material.sizeAttenuation = false;
            pointcloud.material.needsUpdate = true;
        }

        const dist_perspective = radius / 2 / Math.tan(Math.PI * viewer.config.camera.perspective.fov / 360);
        const aspect = window.innerWidth / window.innerHeight;
        const center = pointcloud.geometry.boundingSphere.center;
        viewer.perspective_camera.position.set(center.x, center.y, center.z - dist_perspective);
        viewer.perspective_camera.lookAt(center.x, center.y, center.z);
        viewer.orthographic_camera.position.set(center.x, center.y, center.z - 1);
        viewer.orthographic_camera.lookAt(center.x, center.y, center.z);
        viewer.orthographic_camera.left = -aspect * radius / 2;
        viewer.orthographic_camera.right = aspect * radius / 2;
        viewer.orthographic_camera.top = radius / 2;
        viewer.orthographic_camera.bottom = -radius / 2;
        viewer.orthographic_camera.updateProjectionMatrix();

        viewer.controls.target = center;
        viewer.controls.update();
    }
    viewer.scene.add(pointcloud);
    sendSuccess(websocket, command_id, "success");
}

function handleAddControl(
    websocket: WebSocket,
    command_id: Uint8Array,
    viewer: PointCloudViewer,
    control: PB.CustomControl | undefined
) {
    if (!control) {
        sendFailure(websocket, command_id, "failure to get control");
        return;
    }
    let property_name = "custom_" + btoa(String.fromCharCode(...command_id));
    switch (control.getControlCase()) {
        case PB.CustomControl.ControlCase.BUTTON:
            const button = control.getButton();
            if (button) {
                Object.defineProperty(
                    viewer.config.custom,
                    property_name,
                    {
                        value: () => { sendControlChanged(websocket, command_id, true); },
                    },
                );
                viewer.gui_custom.add(viewer.config.custom, property_name).name(button.getName());
            }
            break;
        case PB.CustomControl.ControlCase.CHECKBOX:
            const checkbox = control.getCheckbox();
            if (checkbox) {
                Object.defineProperty(
                    viewer.config.custom,
                    property_name,
                    {
                        value: checkbox.getInitValue(),
                        writable: true,
                    },
                );
                viewer.gui_custom.add(viewer.config.custom, property_name)
                    .name(checkbox.getName())
                    .onChange((v: string | number | boolean) => { sendControlChanged(websocket, command_id, v); });
            }
            break;
        case PB.CustomControl.ControlCase.COLOR_PICKER:
            const picker = control.getColorPicker();
            if (picker) {
                Object.defineProperty(
                    viewer.config.custom,
                    property_name,
                    {
                        value: picker.getInitValue(),
                        writable: true,
                    }
                );
                viewer.gui_custom.addColor(viewer.config.custom, property_name)
                    .name(picker.getName())
                    .onChange((v: string | number | boolean) => { sendControlChanged(websocket, command_id, v); });
            }
            break;
        case PB.CustomControl.ControlCase.SELECTBOX:
            const selectbox = control.getSelectbox();
            if (selectbox) {
                Object.defineProperty(
                    viewer.config.custom,
                    property_name,
                    {
                        value: selectbox.getInitValue(),
                        writable: true,
                    }
                );
                viewer.gui_custom.add(viewer.config.custom, property_name, selectbox.getItemsList())
                    .name(selectbox.getName())
                    .onChange((v: string | number | boolean) => { sendControlChanged(websocket, command_id, v); });
            }
            break;
        case PB.CustomControl.ControlCase.SLIDER:
            const slider = control.getSlider();
            if (slider) {
                Object.defineProperty(
                    viewer.config.custom,
                    property_name,
                    {
                        value: slider.getInitValue(),
                        writable: true,
                    }
                );
                viewer.gui_custom.add(
                    viewer.config.custom,
                    property_name,
                    slider.getMin(),
                    slider.getMax(),
                    slider.getStep()
                )
                    .name(slider.getName())
                    .onChange((v: string | number | boolean) => { sendControlChanged(websocket, command_id, v); });
            }
            break;
        case PB.CustomControl.ControlCase.TEXTBOX:
            const textbox = control.getTextbox();
            if (textbox) {
                Object.defineProperty(
                    viewer.config.custom,
                    property_name,
                    {
                        value: textbox.getInitValue(),
                        writable: true,
                    }
                );
                viewer.gui_custom.add(viewer.config.custom, property_name)
                    .name(textbox.getName())
                    .onChange((v: string | number | boolean) => { sendControlChanged(websocket, command_id, v); });
            }
            break;

        default:
            sendFailure(websocket, command_id, "invalid command");
            return;
    }
    sendSuccess(websocket, command_id, "success");
}
