import { GUI, GUIController } from 'dat.gui';
import { PointCloudViewer } from '../../viewer';

// ルートフォルダを示すUUID
export const RootFolderUUID = '00000000-0000-0000-0000-000000000000';

export function findFolderByUUID (
  viewer: PointCloudViewer,
  uuid: string
): GUI | null {
  if (uuid === RootFolderUUID) {
    return viewer.guiCustom;
  }
  return findGUI(
    viewer.guiCustom,
    new Set(),
    (gui) => viewer.folderUUIDmap[uuid] === gui.name
  );
}

export function findControllerByUUID (
  viewer: PointCloudViewer,
  uuid: string
): GUIController | null {
  return findGUIController(
    viewer.guiCustom,
    new Set(),
    (controller) => controller.property === uuid
  );
}

// DFS で f(gui) を満たす GUI(folder) を探す
export function findGUI (
  currentGUI: GUI,
  visited: Set<string>,
  f: (gui: GUI) => boolean
): GUI | null {
  visited.add(currentGUI.name);
  if (f(currentGUI)) {
    return currentGUI;
  }

  for (const [, folder] of Object.entries(currentGUI.__folders)) {
    if (visited.has(folder.name)) {
      continue;
    }
    const result = findGUI(folder, visited, f);
    if (result) {
      return result;
    }
  }

  return null;
}

// DFS で f(controller) を満たす GUIController(controller) を探す
export function findGUIController (
  currentGUI: GUI,
  visited: Set<string>,
  f: (controller: GUIController) => boolean
): GUIController | null {
  visited.add(currentGUI.name);

  for (const [, controller] of Object.entries(currentGUI.__controllers)) {
    if (f(controller)) {
      return controller;
    }
  }

  for (const [, folder] of Object.entries(currentGUI.__folders)) {
    if (visited.has(folder.name)) {
      continue;
    }
    const result = findGUIController(folder, visited, f);
    if (result) {
      return result;
    }
  }

  return null;
}

// ラベルが隠れないように画面の半分までGUIの横幅を広げる
export function adjustControlPanelWidthFromContent (gui: GUI) {
  const labels = document.querySelectorAll<HTMLDivElement>('.dg .property-name').values();
  let maxWidth = 0;
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx === null) return;
  for (const l of labels) {
    ctx.font = window.getComputedStyle(l).font;
    const m = ctx.measureText(l.innerText);
    const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    maxWidth = Math.max(w, maxWidth);
  }
  const mainWidth = Math.ceil(maxWidth / 0.4);
  const title = document.querySelector<HTMLLIElement>('.dg li.title');
  const padding = (() => {
    if (title === null) return 20;
    const s = window.getComputedStyle(title);
    // computed length is always in the form '*px'
    return Number.parseFloat(s.paddingLeft) + Number.parseFloat(s.paddingRight);
  })();
  // +1 for dat.gui bugs
  // sometimes the actual width will be 1px less than the passed value
  gui.width = Math.max(gui.width, Math.min(mainWidth + padding + 1, window.innerWidth / 2));
}
