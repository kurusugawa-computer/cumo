import * as PB from '../../protobuf/server_pb.js';
import { sendSuccess, sendFailure, sendControlChanged } from '../client_command';
import { PointCloudViewer } from '../../viewer';
import { findFolderByUUID } from './util';

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
  const propertyName = commandID;
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
          const parentFolder = findFolderByUUID(viewer, button.getParent().toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = button.getName();
          parentFolder.add(viewer.config.custom, propertyName as any).name(button.getName());
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
          const parentFolder = findFolderByUUID(viewer, checkbox.getParent().toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = checkbox.getName();
          parentFolder.add(viewer.config.custom, propertyName as any)
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
          const parentFolder = findFolderByUUID(viewer, picker.getParent().toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = picker.getName();
          parentFolder.addColor(viewer.config.custom, propertyName)
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
          const parentFolder = findFolderByUUID(viewer, selectbox.getParent().toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = selectbox.getName();
          parentFolder.add(viewer.config.custom, propertyName as any, selectbox.getItemsList())
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
          const parentFolder = findFolderByUUID(viewer, slider.getParent().toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = slider.getName();
          parentFolder.add(
            viewer.config.custom,
            propertyName as any,
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
          const parentFolder = findFolderByUUID(viewer, textbox.getParent().toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = textbox.getName();
          parentFolder.add(viewer.config.custom, propertyName as any)
            .name(textbox.getName())
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case PB.CustomControl.ControlCase.FOLDER:
      {
        const folder = control.getFolder();
        if (folder) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {}
          );
          const parentFolder = findFolderByUUID(viewer, folder.getParent().toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = folder.getName();
          parentFolder.addFolder(folder.getName());
        }
      }
      break;
    default:
      sendFailure(websocket, commandID, 'invalid command');
      return;
  }
  sendSuccess(websocket, commandID, commandID);
}
