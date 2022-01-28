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
