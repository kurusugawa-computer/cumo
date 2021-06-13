import * as PB from '../protobuf/server_pb.js';

import { PointCloudViewer } from "../viewer";
import { sendSuccess, sendFailure, sendImage, sendControlChanged } from "./client_command";

import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";

import * as THREE from 'three';
import { LineBasicMaterial } from 'three';

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
        case commandCase.CAPTURE_SCREEN:
            handleScreenCapture(websocket, command_id, viewer);
            break;
        case commandCase.ADD_CUSTOM_CONTROL:
            handleAddControl(websocket, command_id, viewer, message.getAddCustomControl());
            break;
        case commandCase.SET_CAMERA:
            handleSetCamera(websocket, command_id, viewer, message.getSetCamera());
            break;
        case commandCase.ADD_OBJECT:
            handleAddObject(websocket, command_id, viewer, message.getAddObject());
            break;
        default:
            sendFailure(websocket, message.getUuid_asU8(), "message has not any command");
            break;
    }
}

function handleAddObject(websocket: WebSocket, command_id: Uint8Array, viewer: PointCloudViewer, add_object: PB.AddObject | undefined): void {
    if (add_object == undefined) {
        sendFailure(websocket, command_id, "failed to get add_object command");
        return;
    }
    const objectCase = PB.AddObject.ObjectCase;
    switch (add_object.getObjectCase()) {
        case objectCase.LINE_SET:
            handleLineSet(websocket, command_id, viewer, add_object.getLineSet());
            break;
        case objectCase.POINT_CLOUD:
            handlePointCloud(websocket, command_id, add_object.getPointCloud(), viewer);
            break;
        default:
            sendFailure(websocket, command_id, "message has not any object");
            break;
    }
}

function handleLineSet(websocket: WebSocket, command_id: Uint8Array, viewer: PointCloudViewer, lineset: PB.AddObject.LineSet | undefined): void {
    if (lineset === undefined) {
        sendFailure(websocket, command_id, "failed to get lineset");
        return;
    }
    const from_index = lineset.getFromIndexList();
    const to_index = lineset.getToIndexList();
    const points = lineset.getPointsList();
    let positions: number[] = [];
    for (let i = 0; i < points.length; i++) {
        const v = points[i];
        positions.push(v.getX(), v.getY(), v.getZ());
    }
    let indices: number[] = [];
    for (let i = 0; i < from_index.length; i++) {
        indices.push(from_index[i]);
        indices.push(to_index[i]);

    }
    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial();
    const linesegments = new THREE.LineSegments(geometry, material);
    viewer.scene.add(linesegments);

    sendSuccess(websocket, command_id, "success");
}

function handleSetCamera(websocket: WebSocket, command_id: Uint8Array, viewer: PointCloudViewer, camera: PB.SetCamera | undefined): void {
    if (camera === undefined) {
        sendFailure(websocket, command_id, "failed to get camera parameter");
        return;
    }
    const cameraCase = PB.SetCamera.CameraCase;
    switch (camera.getCameraCase()) {
        case cameraCase.ORTHOGRAPHIC_FRUSTUM_HEIGHT:
            setOrthographicCamera(websocket, command_id, viewer, camera.getOrthographicFrustumHeight());
            break;
        case cameraCase.PERSPECTIVE_FOV:
            setPerspectiveCamera(websocket, command_id, viewer, camera.getPerspectiveFov());
            break;
        case cameraCase.POSITION:
            setCameraPosition(websocket, command_id, viewer, camera.getPosition());
            break;
        case cameraCase.TARGET:
            setCameraTarget(websocket, command_id, viewer, camera.getTarget());
        default:
            sendFailure(websocket, command_id, "message has not any camera parameters");
            break;
    }
}

function setOrthographicCamera(websocket: WebSocket, command_id: Uint8Array, viewer: PointCloudViewer, frustum_height: number) {
    viewer.config.camera.orthographic.frustum = frustum_height;

    const aspect = window.innerWidth / window.innerHeight;
    viewer.orthographic_camera.left = -frustum_height * aspect / 2;
    viewer.orthographic_camera.right = frustum_height * aspect / 2;
    viewer.orthographic_camera.top = frustum_height / 2;
    viewer.orthographic_camera.bottom = -frustum_height / 2;

    viewer.orthographic_camera.updateProjectionMatrix();
    if (viewer.config.camera.use_perspective) {
        viewer.switchCamera(false);
    }
    sendSuccess(websocket, command_id, "success");
}

function setPerspectiveCamera(websocket: WebSocket, command_id: Uint8Array, viewer: PointCloudViewer, fov: number) {
    viewer.config.camera.perspective.fov = fov;
    viewer.perspective_camera.fov = fov;
    viewer.perspective_camera.updateProjectionMatrix();
    if (!viewer.config.camera.use_perspective) {
        viewer.switchCamera(true);
    }
    sendSuccess(websocket, command_id, "success");
}

function setCameraPosition(websocket: WebSocket, command_id: Uint8Array, viewer: PointCloudViewer, position: PB.VecXYZf | undefined) {
    if (position === undefined) {
        sendFailure(websocket, command_id, "failed to get camera position");
        return;
    }

    viewer.orthographic_camera.position.set(position.getX(), position.getY(), position.getZ());
    viewer.perspective_camera.position.set(position.getX(), position.getY(), position.getZ());
    viewer.controls.update();
    sendSuccess(websocket, command_id, "success");
}

function setCameraTarget(websocket: WebSocket, command_id: Uint8Array, viewer: PointCloudViewer, target: PB.VecXYZf | undefined) {
    if (target === undefined) {
        sendFailure(websocket, command_id, "failed to get camera position");
        return;
    }

    viewer.controls.target.set(target.getX(), target.getY(), target.getZ());
    viewer.orthographic_camera.lookAt(target.getX(), target.getY(), target.getZ());
    viewer.perspective_camera.lookAt(target.getX(), target.getY(), target.getZ());
    viewer.controls.update();
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
    pb_pointcloud: PB.AddObject.PointCloud | undefined,
    viewer: PointCloudViewer
): void {
    if (pb_pointcloud === undefined) {
        sendFailure(websocket, command_id, "failure to get pointcloud");
        return;
    }

    let data = Uint8Array.from(atob(pb_pointcloud.getPcdData_asB64()), c => c.charCodeAt(0)).buffer;

    let pointcloud = new PCDLoader().parse(data, "test");

    if (pointcloud.material instanceof THREE.PointsMaterial) {
        pointcloud.material.size = 1;
        pointcloud.material.sizeAttenuation = false;
        pointcloud.material.needsUpdate = true;
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
