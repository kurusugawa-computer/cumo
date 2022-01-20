import * as PB from '../../protobuf/server_pb.js';
import { PointCloudViewer } from '../../viewer';
import { sendFailure, sendSuccess } from '../client_command';

export function handleSetControl (
  websocket: WebSocket,
  commandID: string,
  viewer: PointCloudViewer,
  control: PB.CustomControl | undefined
) {
  if (!control) {
    sendFailure(websocket, commandID, 'failure to get control');
    return;
  }
  const target = commandID;
  switch (control.getControlCase()) {
    case PB.CustomControl.ControlCase.BUTTON:
      {
        const button = control.getButton();
        if (button) {
          const buttonGUI = viewer.guiCustom.__controllers.find((x) => x.property === target);
          if (!buttonGUI) {
            sendFailure(websocket, commandID, 'failure to get buttonGUI');
            return;
          }
          buttonGUI.name(button.getName());
          buttonGUI.updateDisplay();
        }
      }
      break;
    case PB.CustomControl.ControlCase.CHECKBOX:
      {
        const checkbox = control.getCheckbox();
        if (checkbox) {
          const checkboxGUI = viewer.guiCustom.__controllers.find((x) => x.property === target);
          if (!checkboxGUI) {
            sendFailure(websocket, commandID, 'failure to get checkboxGUI');
            return;
          }
          checkboxGUI.name(checkbox.getName());
          checkboxGUI.updateDisplay();
        }
      }
      break;
    case PB.CustomControl.ControlCase.COLOR_PICKER:
      {
        const picker = control.getColorPicker();
        if (picker) {
          const pickerGUI = viewer.guiCustom.__controllers.find((x) => x.property === target);
          if (!pickerGUI) {
            sendFailure(websocket, commandID, 'failure to get pickerGUI');
            return;
          }
          pickerGUI.name(picker.getName());
          pickerGUI.updateDisplay();
        }
      }
      break;
    case PB.CustomControl.ControlCase.SELECTBOX:
      {
        const selectbox = control.getSelectbox();
        if (selectbox) {
          const selectboxGUI = viewer.guiCustom.__controllers.find((x) => x.property === target);
          if (!selectboxGUI) {
            sendFailure(websocket, commandID, 'failure to get selectboxGUI');
            return;
          }
          selectboxGUI.name(selectbox.getName());
          selectboxGUI.updateDisplay();
        }
      }
      break;
    case PB.CustomControl.ControlCase.SLIDER:
      {
        const slider = control.getSlider();
        if (slider) {
          const sliderGUI = viewer.guiCustom.__controllers.find((x) => x.property === target);
          if (!sliderGUI) {
            sendFailure(websocket, commandID, 'failure to get sliderGUI');
            return;
          }
          sliderGUI.name(slider.getName());
          sliderGUI.min(slider.getMin());
          sliderGUI.max(slider.getMax());
          sliderGUI.step(slider.getStep());
          sliderGUI.updateDisplay();
        }
      }
      break;
    case PB.CustomControl.ControlCase.TEXTBOX:
      {
        const textbox = control.getTextbox();
        if (textbox) {
          const textboxGUI = viewer.guiCustom.__controllers.find((x) => x.property === target);
          if (!textboxGUI) {
            sendFailure(websocket, commandID, 'failure to get textboxGUI');
            return;
          }
          textboxGUI.name(textbox.getName());
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
