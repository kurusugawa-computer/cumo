import { GUIManager } from './gui_manager';

export function setButton (manager: GUIManager, id: string, name?: string) {
  const button = manager.guiRegistry.getController(id);
  if (!button) {
    throw new Error('failure to get button');
  }
  if (name) {
    button.name(name);
  }
  button.updateDisplay();
}

export function setCheckBox (manager: GUIManager, id: string, name?: string, value?: boolean) {
  const checkbox = manager.guiRegistry.getController(id);
  if (!checkbox) {
    throw new Error('failure to get checkbox');
  }
  if (name) {
    checkbox.name(name);
  }
  if (value !== undefined) {
    checkbox.setValue(value);
  }
  checkbox.updateDisplay();
}

export function setColorPicker (manager: GUIManager, id: string, name?: string, value?: string) {
  const picker = manager.guiRegistry.getController(id);
  if (!picker) {
    throw new Error('failure to get picker');
  }
  if (name) {
    picker.name(name);
  }
  if (value) {
    picker.setValue(value);
  }
  picker.updateDisplay();
}

export function setSelectbox (manager: GUIManager, id: string, name?: string, value?: string, items?: string[]) {
  const selectbox = manager.guiRegistry.getController(id);
  if (!selectbox) {
    throw new Error('failure to get selectbox');
  }
  if (name) {
    selectbox.name(name);
  }
  if (value) {
    selectbox.setValue(value);
  }
  if (items) {
    selectbox.options(items);
  }
  selectbox.updateDisplay();
}

export function setSlider (manager: GUIManager, id: string, name?: string, min?: number, max?: number, value?: number, step?: number) {
  const slider = manager.guiRegistry.getController(id);
  if (!slider) {
    throw new Error('failure to get slider');
  }
  if (name) {
    slider.name(name);
  }
  if (min !== undefined) {
    slider.min(min);
  }
  if (max !== undefined) {
    slider.max(max);
  }
  if (value !== undefined) {
    slider.setValue(value);
  }
  if (step !== undefined) {
    slider.step(step);
  }
  slider.updateDisplay();
}

export function setTextbox (manager: GUIManager, id: string, name?: string, value?: string) {
  const textbox = manager.guiRegistry.getController(id);
  if (!textbox) {
    throw new Error('failure to get textbox');
  }
  if (name) {
    textbox.name(name);
  }
  if (value) {
    textbox.setValue(value);
  }
  textbox.updateDisplay();
}
