import { GUI } from 'lil-gui';
import Moveable from 'moveable';
import { PointCloudViewer } from '../viewer';
import { DefaultUUID, GUIRegistry } from './util';

export class GUIManager {
  gui: GUI;
  guiCustom: GUI;
  guiRegistry: GUIRegistry
  guiMove: Moveable

  customProperty: {[key: string]: any};

  constructor (private viewer: PointCloudViewer) {
    // コントロールのセットアップ
    this.gui = new GUI();

    const guiControl = this.gui.addFolder('control');
    const guiCamera = this.gui.addFolder('camera');
    this.guiCustom = this.gui.addFolder('custom');

    const guiRotateSpeed = guiControl.add(viewer.cameraInput, 'rotateSpeed', 0, 10, 0.1);
    const guiZoomSpeed = guiControl.add(viewer.cameraInput, 'zoomSpeed', 0, 10, 0.1);
    const guiPanSpeed = guiControl.add(viewer.cameraInput, 'panSpeed', 0, 10, 0.1);

    const guiUsePerspective = guiCamera.add(viewer.config.camera, 'usePerspective')
      .name('perspective camera')
      .onChange((perspective: boolean) => viewer.switchCamera(perspective));

    // GUIの情報を登録
    this.guiRegistry = new GUIRegistry();
    this.guiRegistry.setFolder(DefaultUUID.CustomRoot, this.guiCustom);
    this.guiRegistry.setFolder(DefaultUUID.Root, this.gui);
    this.guiRegistry.setFolder(DefaultUUID.Controls, guiControl);
    this.guiRegistry.setFolder(DefaultUUID.Camera, guiCamera);
    this.guiRegistry.setController(DefaultUUID.RotateSpeed, guiRotateSpeed);
    this.guiRegistry.setController(DefaultUUID.ZoomSpeed, guiZoomSpeed);
    this.guiRegistry.setController(DefaultUUID.PanSpeed, guiPanSpeed);
    this.guiRegistry.setController(DefaultUUID.UsePerspective, guiUsePerspective);

    this.customProperty = {};

    // GUIをドラッグしてサイズ変更する
    this.guiMove = new Moveable(document.body, {
      target: this.gui.domElement,
      resizable: true,
      renderDirections: ['w'],
      edge: ['w']
    });
    this.guiMove.on('resize', ({ target, width }) => {
      target.style.width = width + 'px';
    });
    this.guiMove.useResizeObserver = true; // fit-contentで自動変更された場合に自動で調節
  }

  updateAll () {
    for (const controller of this.gui.controllersRecursive()) {
      controller.updateDisplay();
    }
  }
}
