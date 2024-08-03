import { GUIManager } from './gui_manager';

export function removeAllInCustom (manager: GUIManager) {
  for (let i = manager.guiCustom.__controllers.length - 1; i >= 0; i--) {
    manager.guiCustom.__controllers[i].remove();
  }
  for (const [, folder] of Object.entries(manager.guiCustom.__folders)) {
    manager.guiCustom.removeFolder(folder);
  }
}

export function removeByUUID (manager: GUIManager, id: string) {
  const gui = manager.guiRegistry.get(id);
  if (gui === undefined) {
    throw new Error('no such uuid');
  }
  switch (gui.type) {
    case 'folder':
      if (gui.instance.parent) {
        gui.instance.parent.removeFolder(gui.instance);
      } else { // root folder
        gui.instance.destroy();
      }
      break;
    case 'controller':
      gui.instance.remove();
      break;
    default:
      break;
  }
  manager.guiRegistry.delete(id);
  manager.updateAll();
}
