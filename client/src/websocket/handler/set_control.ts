import { setButton, setCheckBox, setColorPicker, setSelectbox, setTextbox, setSlider } from '../../gui/set_control';
import * as PB from '../../protobuf/server';
import { PointCloudViewer } from '../../viewer';
import { sendFailure, sendSuccess } from '../client_command';

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
          setButton(viewer.gui, target, button.name);
        }
      }
      break;
    case 'checkbox':
      {
        const checkbox = control.checkbox;
        if (checkbox) {
          setCheckBox(viewer.gui, target, checkbox.name, checkbox.value);
        }
      }
      break;
    case 'colorPicker':
      {
        const picker = control.colorPicker;
        if (picker) {
          setColorPicker(viewer.gui, target, picker.name, picker.value);
        }
      }
      break;
    case 'selectbox':
      {
        const selectbox = control.selectbox;
        if (selectbox) {
          setSelectbox(viewer.gui, target, selectbox.name, selectbox.value, selectbox.items);
        }
      }
      break;
    case 'slider':
      {
        const slider = control.slider;
        if (slider) {
          setSlider(viewer.gui, target, slider.name, slider.min, slider.max, slider.value, slider.step);
        }
      }
      break;
    case 'textbox':
      {
        const textbox = control.textbox;
        if (textbox) {
          setTextbox(viewer.gui, target, textbox.name, textbox.value);
        }
      }
      break;
    default:
      sendFailure(websocket, commandID, 'invalid command');
      return;
  }
  sendSuccess(websocket, commandID, commandID);
}
