import { Overlay } from './overlay';
import { Canvas2D } from './canvas2d';
import { Lineset } from './lineset';
import { Spinner } from './spinner';

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Legacy/legacy';
import { CustomCameraInput, CustomCameraInputEventHandlers } from './camera_control';
import { GUIManager } from './gui/gui_manager';

export class PointCloudViewer {
  enabled: boolean = true;
  canvas: HTMLCanvasElement;
  engine: BABYLON.Engine;
  scene: BABYLON.Scene;

  overlays: Overlay[] = [];
  overlayContainer: HTMLElement

  canvas2d: Canvas2D
  spinner: Spinner

  linesets: Lineset[] = [];

  camera: BABYLON.TargetCamera;
  cameraInput: CustomCameraInput<PointCloudViewer['camera']>;

  gui: GUIManager

  keyEventHandler = new class {
    onKeyUp: ((ev: KeyboardEvent) => any) | null = null
    onKeyDown: ((ev: KeyboardEvent) => any) | null = null
    onKeyPress: ((ev: KeyboardEvent) => any) | null = null
  }();

  cameraEventHandler: {
    [K in keyof CustomCameraInputEventHandlers]: {
      [uuid: string]: CustomCameraInputEventHandlers[K]
    }
  } = {
    statechange: {}
  }

  config = new class {
    controls = new class {
      rotateSpeed: number = 2.0
      zoomSpeed: number = 2.0
      panSpeed: number = 2.0
      rollSpeed: number = 1.0
    }();

    camera = new class {
      usePerspective: boolean = true;
      perspective = new class {
        fov: number = 30;
      }();

      orthographic = new class {
        frustum: number | null = null;
      }();
    }();
  }();

  constructor (private container: HTMLDivElement) {
    const cameraNear = 0.1;
    const cameraFar = 10000;

    this.canvas = document.createElement('canvas');

    container.appendChild(this.canvas);

    // シーンのセットアップ
    this.engine = new BABYLON.Engine(this.canvas, true,
      {
        adaptToDeviceRatio: true
      }
    );
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0, 0, 0);
    this.scene.lightsEnabled = false;
    this.scene.useRightHandedSystem = true;

    this.camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(-1, -1, -1), this.scene);
    this.camera.fov = (this.config.camera.perspective.fov / 180) * Math.PI;
    this.camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;
    this.camera.maxZ = cameraFar;
    this.camera.minZ = cameraNear;
    this.cameraInput = new CustomCameraInput();
    this.camera.inputs.clear();
    this.camera.inputs.add(this.cameraInput);
    this.camera.attachControl();

    this.canvas2d = new Canvas2D();

    this.canvas.style.position = 'absolute';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    this.canvas2d.domElement.style.pointerEvents = 'none';
    container.appendChild(this.canvas2d.domElement);

    const onResize = () => {
      this.canvas.width = window.innerWidth * window.devicePixelRatio;
      this.canvas.height = window.innerHeight * window.devicePixelRatio;
      this.engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
      this.engine.resize(true);
    };

    window.addEventListener('resize', onResize);

    let removeDPRListener: (()=>void) | null = null;
    const updateDPR = () => {
      if (removeDPRListener !== null) removeDPRListener();
      const mm = window.matchMedia(
        `window and (resolution: ${window.devicePixelRatio}dppx)`
      );
      mm.addEventListener('change', updateDPR);
      removeDPRListener = () => { mm.removeEventListener('change', updateDPR); };

      onResize();
    };
    updateDPR();

    this.gui = new GUIManager(this);

    container.style.position = 'relative';
    container.style.height = '100vh';

    this.canvas.style.position = 'absolute';

    this.overlayContainer = document.createElement('div');
    this.overlayContainer.style.position = 'absolute';
    this.overlayContainer.style.height = '100%';
    this.overlayContainer.style.width = '100%';
    this.overlayContainer.style.pointerEvents = 'none';
    this.overlayContainer.style.overflow = 'hidden';
    container.appendChild(this.overlayContainer);

    // レンダリングループ
    this.engine.runRenderLoop(() => {
      this.render();
    });

    this.spinner = new Spinner(container);
  }

  get getdiv () {
    return this.container;
  }

  render (): void {
    if (!this.enabled) return;

    this.scene.render();
    for (let i = 0; i < this.overlays.length; i++) {
      this.overlays[i].render(this.canvas, this.scene);
    }
    this.canvas2d.ctx.clearRect(0, 0, this.canvas2d.domElement.width, this.canvas2d.domElement.height);

    const mat = this.camera.getTransformationMatrix();

    for (let i = 0; i < this.linesets.length; i++) {
      this.linesets[i].render(this.canvas2d, mat);
    }
  }

  switchCamera (perspective: boolean): void {
    const newMode = perspective ? BABYLON.Camera.PERSPECTIVE_CAMERA : BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

    this.camera.mode = newMode;

    if (perspective !== this.config.camera.usePerspective) {
      this.config.camera.usePerspective = perspective;
      this.gui.updateAll();
    }
  }
}
