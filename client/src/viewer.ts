
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
    fov: number = 30;
    constructor(container: HTMLDivElement) {
        const camera_near = Number.EPSILON;
        const camera_far = Number.MAX_SAFE_INTEGER;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000);

        this.perspective_camera = new PerspectiveCamera(
            this.fov, window.innerWidth / window.innerHeight, camera_near, camera_far);
        this.perspective_camera.position.set(1, 1, 1);
        let sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.01),
            new THREE.MeshNormalMaterial(),
        );
        this.scene.add(sphere);

        this.orthographic_camera = new OrthographicCamera(0, 0, 0, 0, 0, 0);

        this.renderer = new THREE.WebGL1Renderer({
            preserveDrawingBuffer: true,
            logarithmicDepthBuffer: true,
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this.perspective_camera.aspect = window.innerWidth / window.innerHeight;
            this.perspective_camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.controls.handleResize();
        });

        this.controls = new TrackballControls(this.perspective_camera, this.renderer.domElement);
        this.controls.staticMoving = true;
        this.controls.rotateSpeed = 2.0;
        this.controls.zoomSpeed = 2;
        this.controls.panSpeed = 2;
        this.controls.keys[2] = 16; // shift to pan

        this.gui = new DAT.GUI();

        let render = () => {
            this.renderer.render(this.scene, this.perspective_camera);
        };

        let animate = () => {
            requestAnimationFrame(animate);
            this.controls.update();
            render();
        };
        animate();
    }
}