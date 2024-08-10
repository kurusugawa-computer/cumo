import * as PB from '../../protobuf/server';
import { sendSuccess, sendFailure, sendControlChanged } from '../client_command';
import { PointCloudViewer } from '../../viewer';
import { addButton, addCheckbox, addColorPicker, addFolder, addSelectbox, addSlider, addTextbox } from '../../gui/add_control';

export function handleAddControl (
  websocket: WebSocket,
  commandID: string,
  viewer: PointCloudViewer,
  control: PB.CustomControl | undefined
) {
  if (!control) {
    sendFailure(websocket, commandID, 'failure to get control');
    return;
  }
  const id = commandID;
  switch (control.Control) {
    case 'button':
      {
        const button = control.button;
        if (button) {
          addButton(viewer.gui, id, button.parent, button.name,
            () => { sendControlChanged(websocket, id, true); }
          );
        }
      }
      break;
    case 'checkbox':
      {
        const checkbox = control.checkbox;
        if (checkbox) {
          addCheckbox(viewer.gui, id, checkbox.parent, checkbox.name, checkbox.initValue,
            (v: number | boolean | string) => { sendControlChanged(websocket, id, v); }
          );
        }
      }
      break;
    case 'colorPicker':
      {
        const picker = control.colorPicker;
        if (picker) {
          addColorPicker(viewer.gui, id, picker.parent, picker.name, picker.initValue,
            (v: number | boolean | string) => { sendControlChanged(websocket, id, v); }
          );
        }
      }
      break;
    case 'selectbox':
      {
        const selectbox = control.selectbox;
        if (selectbox) {
          addSelectbox(viewer.gui, id, selectbox.parent, selectbox.name, selectbox.initValue, selectbox.items,
            (v: number | boolean | string) => { sendControlChanged(websocket, id, v); }
          );
        }
      }
      break;
    case 'slider':
      {
        const slider = control.slider;
        if (slider) {
          addSlider(viewer.gui, id, slider.parent, slider.name, slider.initValue, slider.min, slider.max, slider.step,
            (v: number | boolean | string) => { sendControlChanged(websocket, id, v); }
          );
        }
      }
      break;
    case 'textbox':
      {
        const textbox = control.textbox;
        if (textbox) {
          addTextbox(viewer.gui, id, textbox.parent, textbox.name, textbox.initValue,
            (v: number | boolean | string) => { sendControlChanged(websocket, id, v); }
          );
        }
      }
      break;
    case 'folder':
      {
        const folder = control.folder;
        if (folder) {
          addFolder(viewer.gui, id, folder.parent, folder.name);
        }
      }
      break;
    default:
      throw new Error('invalid command');
  }

  sendSuccess(websocket, commandID, commandID);
}
