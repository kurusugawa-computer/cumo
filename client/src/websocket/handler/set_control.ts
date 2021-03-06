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
          if (button.hasName() && name !== undefined) {
            buttonGUI.name(name);
          }
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
          if (checkbox.hasName() && name !== undefined) {
            checkboxGUI.name(name);
          }
          const value = checkbox.getValue();
          if (checkbox.hasValue() && value !== undefined) {
            checkboxGUI.setValue(value);
          }
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
          if (picker.hasName() && name !== undefined) {
            pickerGUI.name(name);
          }
          const value = picker.getValue();
          if (picker.hasValue() && value !== undefined) {
            pickerGUI.setValue(value);
          }
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
          const name = selectbox.getName();
          if (selectbox.hasName() && name !== undefined) {
            selectboxGUI.name(name);
          }
          const value = selectbox.getValue();
          if (selectbox.hasValue() && value !== undefined) {
            selectboxGUI.setValue(value);
          }
          const items = selectbox.getItemsList();
          const selector = selectboxGUI.domElement.querySelector('div > select');
          if (items.length !== 0 && selector !== null) {
            selector.innerHTML = items.map((value) => `<option value="${value}">${value}</option>`).join('\n');
          }
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
          if (slider.hasName() && name !== undefined) {
            sliderGUI.name(name);
          }
          const min = slider.getMin();
          if (slider.hasMin() && min !== undefined) {
            sliderGUI.min(min);
          }
          const max = slider.getMax();
          if (slider.hasMax() && max !== undefined) {
            sliderGUI.max(max);
          }
          const value = slider.getValue();
          if (slider.hasValue() && value !== undefined) {
            sliderGUI.setValue(value);
          }
          const step = slider.getStep();
          if (slider.hasStep() && step !== undefined) {
            sliderGUI.step(step);
          }
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
          if (textbox.hasName() && name !== undefined) {
            textboxGUI.name(name);
          }
          const value = textbox.getValue();
          if (textbox.hasValue() && value !== undefined) {
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
