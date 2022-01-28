import * as PB from '../../protobuf/server_pb.js';
import { PointCloudViewer } from '../../viewer';
import { sendFailure, sendSuccess } from '../client_command';
import { findControllerByUUID } from './util';

export function handleSetControl (
  websocket: WebSocket,
  commandID: string,
  viewer: PointCloudViewer,
  control: PB.SetCustomControl | undefined
) {
  if (!control) {
    sendFailure(websocket, commandID, 'failure to get control');
    return;
  }
  const target = control.getTarget().toUpperCase();
  switch (control.getControlCase()) {
    case PB.SetCustomControl.ControlCase.BUTTON:
      {
        const button = control.getButton();
        if (button) {
          const buttonGUI = findControllerByUUID(viewer, target);
          if (!buttonGUI) {
            sendFailure(websocket, commandID, 'failure to get buttonGUI');
            return;
          }
          const name = button.getName();
          name && buttonGUI.name(name);
          buttonGUI.updateDisplay();
        }
      }
      break;
    case PB.SetCustomControl.ControlCase.CHECKBOX:
      {
        const checkbox = control.getCheckbox();
        if (checkbox) {
          const checkboxGUI = findControllerByUUID(viewer, target);
          if (!checkboxGUI) {
            sendFailure(websocket, commandID, 'failure to get checkboxGUI');
            return;
          }
          const name = checkbox.getName();
          const value = checkbox.getValue();
          name && checkboxGUI.name(name);
          value && checkboxGUI.setValue(value);
          checkboxGUI.updateDisplay();
        }
      }
      break;
    case PB.SetCustomControl.ControlCase.COLOR_PICKER:
      {
        const picker = control.getColorPicker();
        if (picker) {
          const pickerGUI = findControllerByUUID(viewer, target);
          if (!pickerGUI) {
            sendFailure(websocket, commandID, 'failure to get pickerGUI');
            return;
          }
          const name = picker.getName();
          const value = picker.getValue();
          name && pickerGUI.name(name);
          value && pickerGUI.setValue(value);
          pickerGUI.updateDisplay();
        }
      }
      break;
    case PB.SetCustomControl.ControlCase.SELECTBOX:
      {
        const selectbox = control.getSelectbox();
        if (selectbox) {
          const selectboxGUI = findControllerByUUID(viewer, target);
          if (!selectboxGUI) {
            sendFailure(websocket, commandID, 'failure to get selectboxGUI');
            return;
          }
          const items = selectbox.getItemsList();
          const name = selectbox.getName();
          const value = selectbox.getValue();
          const selector = selectboxGUI.domElement.querySelector('div > select');
          // items.length !== 0 && selectboxGUI.options(items); name と value が変更されない
          if (items.length !== 0 && selector) {
            selector.innerHTML = items.map((value) => `<option value="${value}">${value}</option>`).join('\n');
          }
          value && selectboxGUI.setValue(value);
          name && selectboxGUI.name(name);
          selectboxGUI.updateDisplay();
        }
      }
      break;
    case PB.SetCustomControl.ControlCase.SLIDER:
      {
        const slider = control.getSlider();
        if (slider) {
          const sliderGUI = findControllerByUUID(viewer, target);
          if (!sliderGUI) {
            sendFailure(websocket, commandID, 'failure to get sliderGUI');
            return;
          }
          const name = slider.getName();
          const min = slider.getMin();
          const max = slider.getMax();
          const value = slider.getValue();
          const step = slider.getStep();
          name && sliderGUI.name(name);
          min && sliderGUI.min(min);
          max && sliderGUI.max(max);
          step && sliderGUI.step(step);
          value && sliderGUI.setValue(value);
          sliderGUI.updateDisplay();
        }
      }
      break;
    case PB.SetCustomControl.ControlCase.TEXTBOX:
      {
        const textbox = control.getTextbox();
        if (textbox) {
          const textboxGUI = findControllerByUUID(viewer, target);
          if (!textboxGUI) {
            sendFailure(websocket, commandID, 'failure to get textboxGUI');
            return;
          }
          const name = textbox.getName();
          const value = textbox.getValue();
          name && textboxGUI.name(name);
          value && textboxGUI.setValue(value);
          textboxGUI.updateDisplay();
        }
      }
      break;

    default:
      sendFailure(websocket, commandID, 'invalid command');
      return;
  }
  sendSuccess(websocket, commandID, commandID);
}
