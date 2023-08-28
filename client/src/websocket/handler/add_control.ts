import * as PB from '../../protobuf/server';
import { sendSuccess, sendFailure, sendControlChanged } from '../client_command';
import { PointCloudViewer } from '../../viewer';
import { adjustControlPanelWidthFromContent, findFolderByUUID } from './util';

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
  switch (control.Control) {
    case 'button':
      {
        const button = control.button;
        if (button) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: () => { sendControlChanged(websocket, commandID, true); }
            }
          );
          const parentFolder = findFolderByUUID(viewer, button.parent.toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = button.name;
          parentFolder.add(viewer.config.custom, propertyName as any).name(button.name);
        }
      }
      break;
    case 'checkbox':
      {
        const checkbox = control.checkbox;
        if (checkbox) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: checkbox.initValue,
              writable: true
            }
          );
          const parentFolder = findFolderByUUID(viewer, checkbox.parent.toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = checkbox.name;
          parentFolder.add(viewer.config.custom, propertyName as any)
            .name(checkbox.name)
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case 'colorPicker':
      {
        const picker = control.colorPicker;
        if (picker) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: picker.initValue,
              writable: true
            }
          );
          const parentFolder = findFolderByUUID(viewer, picker.parent.toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = picker.name;
          parentFolder.addColor(viewer.config.custom, propertyName)
            .name(picker.name)
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case 'selectbox':
      {
        const selectbox = control.selectbox;
        if (selectbox) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: selectbox.initValue,
              writable: true
            }
          );
          const parentFolder = findFolderByUUID(viewer, selectbox.parent.toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = selectbox.name;
          parentFolder.add(viewer.config.custom, propertyName as any, selectbox.items)
            .name(selectbox.name)
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case 'slider':
      {
        const slider = control.slider;
        if (slider) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: slider.initValue,
              writable: true
            }
          );
          const parentFolder = findFolderByUUID(viewer, slider.parent.toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = slider.name;
          parentFolder.add(
            viewer.config.custom,
            propertyName as any,
            slider.min,
            slider.max,
            slider.step
          )
            .name(slider.name)
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case 'textbox':
      {
        const textbox = control.textbox;
        if (textbox) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {
              value: textbox.initValue,
              writable: true
            }
          );
          const parentFolder = findFolderByUUID(viewer, textbox.parent.toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = textbox.name;
          parentFolder.add(viewer.config.custom, propertyName as any)
            .name(textbox.name)
            .onChange((v: string | number | boolean) => { sendControlChanged(websocket, commandID, v); });
        }
      }
      break;
    case 'folder':
      {
        const folder = control.folder;
        if (folder) {
          Object.defineProperty(
            viewer.config.custom,
            propertyName,
            {}
          );
          const parentFolder = findFolderByUUID(viewer, folder.parent.toUpperCase());
          if (!parentFolder) {
            sendFailure(websocket, commandID, 'failure to get parent folder');
            return;
          }
          viewer.folderUUIDmap[propertyName] = folder.name;
          parentFolder.addFolder(folder.name);
        }
      }
      break;
    default:
      sendFailure(websocket, commandID, 'invalid command');
      return;
  }
  adjustControlPanelWidthFromContent(viewer.gui);
  sendSuccess(websocket, commandID, commandID);
}
