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
      const maxWidth = document.body.clientWidth * 0.5;
      target.style.width = Math.min(width, maxWidth) + 'px';
    });

    this.updateAll();

    // 画面リサイズ時にGUIの表示を更新
    document.body.onresize = () => {
      this.updateAll();
    };
  }

  updateAll () {
    for (const controller of this.gui.controllersRecursive()) {
      controller.updateDisplay();
    }

    // 全体の幅を調整
    this.adjustControlPanelWidthFromContent();
  }

  // ラベルが隠れないように画面の半分までGUIの横幅を広げる
  adjustControlPanelWidthFromContent () {
    // 各コントロールのラベルの幅を取得
    let maxWidth = 0;
    const labels = document.querySelectorAll<HTMLDivElement>('.lil-gui .controller .name').values();
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx === null) return;
    for (const label of labels) {
      ctx.font = window.getComputedStyle(label).font;
      const measure = ctx.measureText(label.innerText);
      const width = measure.actualBoundingBoxLeft + measure.actualBoundingBoxRight;
      maxWidth = Math.max(width, maxWidth);
      console.log('label', label.innerText, 'width', measure.width);
    }

    const labelRatio = 0.4;
    const mainWidth = Math.ceil(maxWidth / labelRatio);
    console.log('maxWidth', maxWidth, 'mainWidth', mainWidth);

    // GUIのpaddingを取得
    let padding = 20;
    const rootElement = this.gui.domElement;
    if (rootElement !== null) {
      const style = window.getComputedStyle(rootElement);
      padding += parseInt(style.paddingLeft) + parseInt(style.paddingRight);
    }

    // moveableを通してサイズ変更する
    const calcWidth = mainWidth + padding;
    const nowWidth = this.gui.domElement.clientWidth;
    const limitWidth = document.body.clientWidth * 0.5;
    this.guiMove.request('resizable', { offsetWidth: Math.min(Math.max(calcWidth, nowWidth), limitWidth) }, true);
  }
}
