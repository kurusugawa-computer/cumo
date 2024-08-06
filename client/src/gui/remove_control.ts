import { GUIManager } from './gui_manager';

export function removeAllInCustom (manager: GUIManager) {
  for (let i = manager.guiCustom.controllers.length - 1; i >= 0; i--) {
    manager.guiCustom.controllers[i].destroy();
  }
  for (let i = manager.guiCustom.folders.length - 1; i >= 0; i--) {
    manager.guiCustom.folders[i].destroy();
  }
}

export function removeByUUID (manager: GUIManager, id: string) {
  const gui = manager.guiRegistry.get(id);
  if (gui === undefined) {
    throw new Error('no such uuid');
  }
  gui.instance.destroy();
  manager.guiRegistry.delete(id);
  manager.updateAll();
}
