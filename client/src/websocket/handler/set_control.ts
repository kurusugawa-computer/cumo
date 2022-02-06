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
          if (button.hasName()) {
            buttonGUI.name(button.getName());
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
          if (checkbox.hasName()) {
            checkboxGUI.name(checkbox.getName());
          }
          if (checkbox.hasValue()) {
            checkboxGUI.setValue(checkbox.getValue());
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
          if (picker.hasName()) {
            pickerGUI.name(picker.getName());
          }
          if (picker.hasValue()) {
            pickerGUI.setValue(picker.getValue());
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
          if (selectbox.hasName()) {
            selectboxGUI.name(selectbox.getName());
          }
          if (selectbox.hasValue()) {
            selectboxGUI.setValue(selectbox.getValue());
          }
          const items = selectbox.getItemsList();
          const selector = selectboxGUI.domElement.querySelector('div > select');
          // items.length !== 0 && selectboxGUI.options(items); name と value が変更されない
          if (items.length !== 0 && selector) {
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
          if (slider.hasName()) {
            sliderGUI.name(slider.getName());
          }
          if (slider.hasMin()) {
            sliderGUI.min(slider.getMin());
          }
          if (slider.hasMax()) {
            sliderGUI.max(slider.getMax());
          }
          if (slider.hasValue()) {
            sliderGUI.setValue(slider.getValue());
          }
          if (slider.hasStep()) {
            sliderGUI.step(slider.getStep());
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
          if (textbox.hasName()) {
            textboxGUI.name(textbox.getName());
          }
          if (textbox.hasValue()) {
            textboxGUI.setValue(textbox.getValue());
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
