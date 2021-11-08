
import * as THREE from 'three';
import * as DAT from 'dat.gui';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { OrthographicCamera, PerspectiveCamera } from 'three';
import { Overlay } from './overlay';

export class PointCloudViewer {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;

    overlays: Overlay[] = [];
    overlayContainer: HTMLElement

    perspectiveCamera: THREE.PerspectiveCamera;
    orthographicCamera: THREE.OrthographicCamera;

    controls: TrackballControls;

    gui: DAT.GUI;
    guiCustom: DAT.GUI;

    keyEventHandler = new class {
      onKeyUp: ((ev: KeyboardEvent) => any) | null = null
      onKeyDown: ((ev: KeyboardEvent) => any) | null = null
      onKeyPress: ((ev: KeyboardEvent) => any) | null = null
    }();

    config = new class {
      controls = new class {
        rotateSpeed: number = 2.0
        zoomSpeed: number = 2.0
        panSpeed: number = 2.0
      }();

      camera = new class {
        usePerspective: boolean = true;
        perspective = new class {
          fov: number = 30;
        }();

        orthographic = new class {
          frustum: number = 30;
        }();
      }();

      custom: Object = {};
    }();

    constructor (private container: HTMLDivElement) {
      // シーンのセットアップ
      const cameraNear = Number.EPSILON;
      const cameraFar = Number.MAX_SAFE_INTEGER;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000);

      const aspect = window.innerWidth / window.innerHeight;
      this.perspectiveCamera = new PerspectiveCamera(
        this.config.camera.perspective.fov, aspect, cameraNear, cameraFar);
      this.perspectiveCamera.position.set(1, 1, 1);

      const frustum = this.config.camera.orthographic.frustum;
      this.orthographicCamera = new OrthographicCamera(
        frustum * aspect / -2, frustum * aspect / 2, frustum / 2, frustum / -2,
        cameraNear, cameraFar
      );
      this.orthographicCamera.position.set(1, 1, 1);

      // レンダラーのセットアップ
      this.renderer = new THREE.WebGL1Renderer({
        preserveDrawingBuffer: true,
        logarithmicDepthBuffer: true
      });

      let DPIChangeDetector = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      const handleDPIChange = () => {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        DPIChangeDetector.removeEventListener('change', handleDPIChange);
        DPIChangeDetector = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        DPIChangeDetector.addEventListener('change', handleDPIChange);
      };
      this.renderer.setPixelRatio(window.devicePixelRatio);
      DPIChangeDetector.addEventListener('change', handleDPIChange);

      this.renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(this.renderer.domElement);

      window.addEventListener('resize', () => {
        const aspect = window.innerWidth / window.innerHeight;
        const frustum = this.config.camera.orthographic.frustum;

        this.perspectiveCamera.aspect = aspect;
        this.perspectiveCamera.updateProjectionMatrix();

        this.orthographicCamera.left = -frustum * aspect / 2;
        this.orthographicCamera.right = frustum * aspect / 2;
        this.orthographicCamera.top = frustum / 2;
        this.orthographicCamera.bottom = -frustum / 2;
        this.orthographicCamera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.controls.handleResize();
      });

      // コントロールのセットアップ
      this.gui = new DAT.GUI();

      const guiControl = this.gui.addFolder('control');
      const guiCamera = this.gui.addFolder('camera');
      this.guiCustom = this.gui.addFolder('custom');

      guiCamera.add(this.config.camera, 'usePerspective')
        .name('perspective camera')
        .onChange((perspective: boolean) => this.switchCamera(perspective));

      guiControl.add(this.config.controls, 'rotateSpeed', 0, 10, 0.1).onChange(() => { this.switchCamera(this.config.camera.usePerspective); });
      guiControl.add(this.config.controls, 'zoomSpeed', 0, 10, 0.1).onChange(() => { this.switchCamera(this.config.camera.usePerspective); }); ;
      guiControl.add(this.config.controls, 'panSpeed', 0, 10, 0.1).onChange(() => { this.switchCamera(this.config.camera.usePerspective); });

      // カメラコントロールのセットアップ

      this.controls = this.createControls(this.perspectiveCamera);

      container.style.position = 'relative';
      container.style.height = '100vh';

      this.renderer.domElement.style.position = 'absolute';

      this.overlayContainer = document.createElement('div');
      this.overlayContainer.style.position = 'absolute';
      this.overlayContainer.style.height = '100%';
      this.overlayContainer.style.width = '100%';
      this.overlayContainer.style.pointerEvents = 'none';
      this.overlayContainer.style.overflow = 'hidden';
      container.appendChild(this.overlayContainer);

      // レンダリングループ

      const render = () => {
        const camera = this.config.camera.usePerspective ? this.perspectiveCamera : this.orthographicCamera;
        this.renderer.render(
          this.scene,
          camera
        );
        for (let i = 0; i < this.overlays.length; i++) {
          this.overlays[i].render(this.renderer.domElement, camera);
        }
      };

      const animate = () => {
        requestAnimationFrame(animate);
        this.controls.update();
        render();
      };
      animate();
    }

    get getdiv () {
      return this.container;
    }

    switchCamera (perspective: boolean): void {
      this.controls.dispose();
      if (perspective !== this.config.camera.usePerspective) {
        this.config.camera.usePerspective = perspective;
        this.gui.updateDisplay();
      }

      const newCamera: THREE.Camera = perspective ? this.perspectiveCamera : this.orthographicCamera;
      const oldCamera: THREE.Camera = !perspective ? this.perspectiveCamera : this.orthographicCamera;

      newCamera.position.copy(oldCamera.position);
      newCamera.rotation.copy(oldCamera.rotation);

      this.controls = this.createControls(newCamera);
    }

    private createControls (camera: THREE.Camera): TrackballControls {
      const controls = new TrackballControls(camera, this.renderer.domElement);
      controls.staticMoving = true;
      controls.rotateSpeed = this.config.controls.rotateSpeed;
      controls.zoomSpeed = this.config.controls.zoomSpeed;
      controls.panSpeed = Math.pow(2, this.config.controls.panSpeed);
      controls.keys[2] = 16; // shift to pan
      controls.update();
      return controls;
    }
}
