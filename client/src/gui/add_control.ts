import { GUIManager } from './gui_manager';

export function addButton (manager: GUIManager, id: string, parent: string, name: string, callback: () => void) {
  const parentFolder = manager.guiRegistry.getFolder(parent);
  if (!parentFolder) {
    throw new Error('failure to get parent folder');
  }
  Object.defineProperty(
    manager.customProperty,
    id,
    { value: callback }
  );
  const button = parentFolder.add(manager.customProperty, id).name(name);
  manager.guiRegistry.setController(id, button);
}

export function addCheckbox (manager: GUIManager, id: string, parent: string, name: string, initValue: boolean, callback: (value: any) => void) {
  const parentFolder = manager.guiRegistry.getFolder(parent);
  if (!parentFolder) {
    throw new Error('failure to get parent folder');
  }
  Object.defineProperty(
    manager.customProperty,
    id,
    { value: initValue, writable: true }
  );
  const checkbox = parentFolder.add(manager.customProperty, id).name(name).onChange(callback);
  manager.guiRegistry.setController(id, checkbox);
}

export function addColorPicker (manager: GUIManager, id: string, parent: string, name: string, initValue: string, callback: (value: any) => void) {
  const parentFolder = manager.guiRegistry.getFolder(parent);
  if (!parentFolder) {
    throw new Error('failure to get parent folder');
  }
  Object.defineProperty(
    manager.customProperty,
    id,
    {
      value: initValue,
      writable: true
    }
  );
  const picker = parentFolder.addColor(manager.customProperty, id).name(name).onChange(callback);
  manager.guiRegistry.setController(id, picker);
}

export function addSelectbox (manager: GUIManager, id: string, parent: string, name: string, initValue: string, items: string[], callback: (value: any) => void) {
  const parentFolder = manager.guiRegistry.getFolder(parent);
  if (!parentFolder) {
    throw new Error('failure to get parent folder');
  }
  Object.defineProperty(
    manager.customProperty,
    id,
    { value: initValue, writable: true }
  );
  const selectbox = parentFolder.add(manager.customProperty, id, items).name(name).onChange(callback);
  manager.guiRegistry.setController(id, selectbox);
}

export function addSlider (manager: GUIManager, id: string, parent: string, name: string, initValue: number, min: number, max: number, step: number, callback: (value: any) => void) {
  const parentFolder = manager.guiRegistry.getFolder(parent);
  if (!parentFolder) {
    throw new Error('failure to get parent folder');
  }
  Object.defineProperty(
    manager.customProperty,
    id,
    { value: initValue, writable: true }
  );
  const selectbox = parentFolder.add(manager.customProperty, id, min, max, step).name(name).onChange(callback);
  manager.guiRegistry.setController(id, selectbox);
}

export function addTextbox (manager: GUIManager, id: string, parent: string, name: string, initValue: string, callback: (value: any) => void) {
  const parentFolder = manager.guiRegistry.getFolder(parent);
  if (!parentFolder) {
    throw new Error('failure to get parent folder');
  }
  Object.defineProperty(
    manager.customProperty,
    id,
    { value: initValue, writable: true }
  );
  const textbox = parentFolder.add(manager.customProperty, id).name(name).onChange(callback);
  manager.guiRegistry.setController(id, textbox);
}

export function addFolder (manager: GUIManager, id: string, parent: string, name: string) {
  const parentFolder = manager.guiRegistry.getFolder(parent);
  if (!parentFolder) {
    throw new Error('failure to get parent folder');
  }
  const folder = parentFolder.addFolder(name);
  manager.guiRegistry.setFolder(id, folder);
}
