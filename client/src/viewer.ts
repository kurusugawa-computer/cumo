
import * as THREE from 'three';
import * as DAT from 'dat.gui';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { Camera, OrthographicCamera, PerspectiveCamera } from 'three';

export class PointCloudViewer {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;

    perspective_camera: THREE.PerspectiveCamera;
    orthographic_camera: THREE.OrthographicCamera;

    controls: TrackballControls;

    gui: DAT.GUI;
    gui_custom: DAT.GUI;

    config = {
        controls: {
            rotateSpeed: 2.0,
            zoomSpeed: 2.0,
            panSpeed: 2.0,
        },
        camera: {
            use_perspective: true,
            perspective: {
                fov: 30,
            },
            orthographic: {
                frustum: 30,
            }
        },
        custom: {},
    };
    constructor(container: HTMLDivElement) {
        const camera_near = Number.EPSILON;
        const camera_far = Number.MAX_SAFE_INTEGER;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000);

        let aspect = window.innerWidth / window.innerHeight;
        this.perspective_camera = new PerspectiveCamera(
            this.config.camera.perspective.fov, aspect, camera_near, camera_far);
        this.perspective_camera.position.set(1, 1, 1);

        let frustum = this.config.camera.orthographic.frustum;
        this.orthographic_camera = new OrthographicCamera(
            frustum * aspect / - 2, frustum * aspect / 2, frustum / 2, frustum / - 2,
            camera_near, camera_far
        );
        this.orthographic_camera.position.set(1, 1, 1);

        this.renderer = new THREE.WebGL1Renderer({
            preserveDrawingBuffer: true,
            logarithmicDepthBuffer: true,
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            let aspect = window.innerWidth / window.innerHeight;
            let frustum = this.config.camera.orthographic.frustum;

            this.perspective_camera.aspect = aspect;
            this.perspective_camera.updateProjectionMatrix();

            this.orthographic_camera.left = -frustum * aspect / 2;
            this.orthographic_camera.right = frustum * aspect / 2;
            this.orthographic_camera.top = frustum / 2;
            this.orthographic_camera.bottom = -frustum / 2;
            this.orthographic_camera.updateProjectionMatrix();

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.controls.handleResize();
        });

        this.gui = new DAT.GUI();

        let gui_control = this.gui.addFolder("control");
        let gui_camera = this.gui.addFolder("camera");
        this.gui_custom = this.gui.addFolder("custom");

        gui_camera.add(this.config.camera, "use_perspective")
            .name("use perspective camera")
            .onChange((perspective: boolean) => this.switchCamera(perspective));

        gui_control.add(this.config.controls, "rotateSpeed", 0, 10, 0.1);
        gui_control.add(this.config.controls, "zoomSpeed", 0, 10, 0.1);
        gui_control.add(this.config.controls, "panSpeed", 0, 10, 0.1);

        let render = () => {
            this.renderer.render(this.scene, this.config.camera.use_perspective ? this.perspective_camera : this.orthographic_camera);
        };

        let animate = () => {
            requestAnimationFrame(animate);
            this.controls.update();
            render();
        };

        this.controls = this.createControls(this.perspective_camera);

        animate();
    }
    switchCamera(perspective: boolean): void {
        this.controls.dispose()
        this.config.camera.use_perspective = perspective;
        this.gui.updateDisplay()
        this.controls = this.createControls(perspective ? this.perspective_camera : this.orthographic_camera);
    }
    private createControls(camera: THREE.Camera): TrackballControls {
        let controls = new TrackballControls(camera, this.renderer.domElement);
        controls.staticMoving = true;
        controls.rotateSpeed = this.config.controls.rotateSpeed;
        controls.zoomSpeed = this.config.controls.zoomSpeed;
        controls.panSpeed = this.config.controls.panSpeed;
        controls.keys[2] = 16; // shift to pan
        return controls;
    }
}