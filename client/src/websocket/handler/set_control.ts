import * as PB from '../../protobuf/server';
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
  const target = control.target.toUpperCase();
  switch (control.Control) {
    case 'button':
      {
        const button = control.button;
        if (button) {
          const buttonGUI = findControllerByUUID(viewer, target);
          if (!buttonGUI) {
            sendFailure(websocket, commandID, 'failure to get buttonGUI');
            return;
          }
          const name = button.name;
          if (button.hasName && name !== undefined) {
            buttonGUI.name(name);
          }
          buttonGUI.updateDisplay();
        }
      }
      break;
    case 'checkbox':
      {
        const checkbox = control.checkbox;
        if (checkbox) {
          const checkboxGUI = findControllerByUUID(viewer, target);
          if (!checkboxGUI) {
            sendFailure(websocket, commandID, 'failure to get checkboxGUI');
            return;
          }
          const name = checkbox.name;
          if (checkbox.name && name !== undefined) {
            checkboxGUI.name(name);
          }
          const value = checkbox.value;
          if (checkbox.value && value !== undefined) {
            checkboxGUI.setValue(value);
          }
          checkboxGUI.updateDisplay();
        }
      }
      break;
    case 'colorPicker':
      {
        const picker = control.colorPicker;
        if (picker) {
          const pickerGUI = findControllerByUUID(viewer, target);
          if (!pickerGUI) {
            sendFailure(websocket, commandID, 'failure to get pickerGUI');
            return;
          }
          const name = picker.name;
          if (picker.name && name !== undefined) {
            pickerGUI.name(name);
          }
          const value = picker.value;
          if (picker.value && value !== undefined) {
            pickerGUI.setValue(value);
          }
          pickerGUI.updateDisplay();
        }
      }
      break;
    case 'selectbox':
      {
        const selectbox = control.selectbox;
        if (selectbox) {
          const selectboxGUI = findControllerByUUID(viewer, target);
          if (!selectboxGUI) {
            sendFailure(websocket, commandID, 'failure to get selectboxGUI');
            return;
          }
          const name = selectbox.name;
          if (selectbox.name && name !== undefined) {
            selectboxGUI.name(name);
          }
          const value = selectbox.value;
          if (selectbox.value && value !== undefined) {
            selectboxGUI.setValue(value);
          }
          const items = selectbox.items;
          const selector = selectboxGUI.domElement.querySelector('div > select');
          if (items.length !== 0 && selector !== null) {
            selector.innerHTML = items.map((value) => `<option value="${value}">${value}</option>`).join('\n');
          }
          selectboxGUI.updateDisplay();
        }
      }
      break;
    case 'slider':
      {
        const slider = control.slider;
        if (slider) {
          const sliderGUI = findControllerByUUID(viewer, target);
          if (!sliderGUI) {
            sendFailure(websocket, commandID, 'failure to get sliderGUI');
            return;
          }
          const name = slider.name;
          if (slider.name && name !== undefined) {
            sliderGUI.name(name);
          }
          const min = slider.min;
          if (slider.min && min !== undefined) {
            sliderGUI.min(min);
          }
          const max = slider.max;
          if (slider.max && max !== undefined) {
            sliderGUI.max(max);
          }
          const value = slider.value;
          if (slider.value && value !== undefined) {
            sliderGUI.setValue(value);
          }
          const step = slider.step;
          if (slider.step && step !== undefined) {
            sliderGUI.step(step);
          }
          sliderGUI.updateDisplay();
        }
      }
      break;
    case 'textbox':
      {
        const textbox = control.textbox;
        if (textbox) {
          const textboxGUI = findControllerByUUID(viewer, target);
          if (!textboxGUI) {
            sendFailure(websocket, commandID, 'failure to get textboxGUI');
            return;
          }
          const name = textbox.name;
          if (textbox.name && name !== undefined) {
            textboxGUI.name(name);
          }
          const value = textbox.value;
          if (textbox.value && value !== undefined) {
            textboxGUI.setValue(value);
          }
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
