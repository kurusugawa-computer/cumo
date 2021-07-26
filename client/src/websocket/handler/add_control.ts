import * as PB from '../../protobuf/server_pb.js';
import { sendSuccess, sendFailure, sendControlChanged } from '../client_command';
import { PointCloudViewer } from '../../viewer';

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
  const propertyName = 'custom_' + commandID;
  switch (control.getControlCase()) {
    case PB.CustomControl.ControlCase.BUTTON:
      {
        const button = control.getButton();
        if (button) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: () => { sendControlChanged(websocket, commandID, true); }
            }
          );
          viewer.guiCustom.add(viewer.config.custom, propertyName).name(button.getName());
        }
      }
      break;
    case PB.CustomControl.ControlCase.CHECKBOX:
      {
        const checkbox = control.getCheckbox();
        if (checkbox) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: checkbox.getInitValue(),
              writable: true
            }
          );
          viewer.guiCustom.add(viewer.config.custom, propertyName)
            .name(checkbox.getName())
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case PB.CustomControl.ControlCase.COLOR_PICKER:
      {
        const picker = control.getColorPicker();
        if (picker) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: picker.getInitValue(),
              writable: true
            }
          );
          viewer.guiCustom.addColor(viewer.config.custom, propertyName)
            .name(picker.getName())
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case PB.CustomControl.ControlCase.SELECTBOX:
      {
        const selectbox = control.getSelectbox();
        if (selectbox) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: selectbox.getInitValue(),
              writable: true
            }
          );
          viewer.guiCustom.add(viewer.config.custom, propertyName, selectbox.getItemsList())
            .name(selectbox.getName())
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case PB.CustomControl.ControlCase.SLIDER:
      {
        const slider = control.getSlider();
        if (slider) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: slider.getInitValue(),
              writable: true
            }
          );
          viewer.guiCustom.add(
            viewer.config.custom,
            propertyName,
            slider.getMin(),
            slider.getMax(),
            slider.getStep()
          )
            .name(slider.getName())
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case PB.CustomControl.ControlCase.TEXTBOX:
      {
        const textbox = control.getTextbox();
        if (textbox) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: textbox.getInitValue(),
              writable: true
            }
          );
          viewer.guiCustom.add(viewer.config.custom, propertyName)
            .name(textbox.getName())
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;

    default:
      sendFailure(websocket, commandID, 'invalid command');
      return;
  }
  sendSuccess(websocket, commandID, 'success');
}
