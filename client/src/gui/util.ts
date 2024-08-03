
import * as DAT from 'dat.gui';

export const DefaultUUID = {
  CustomRoot: '00000000-0000-0000-0000-000000000000',
  Root: '00000000-0000-0000-0000-000000000001',
  Controls: '00000000-0000-0000-0000-000000000002',
  Camera: '00000000-0000-0000-0000-000000000003',
  RotateSpeed: '00000000-0000-0000-0000-000000000101',
  ZoomSpeed: '00000000-0000-0000-0000-000000000102',
  PanSpeed: '00000000-0000-0000-0000-000000000103',
  UsePerspective: '00000000-0000-0000-0000-000000000201'
};

export type GUIData = {type: 'folder', instance: DAT.GUI} | {type: 'controller', instance: DAT.GUIController};

export class GUIRegistry {
    map : Map<string, GUIData>;

    constructor () {
      this.map = new Map();
    }

    get (key: string): GUIData | undefined {
      const keyUppercase = key.toUpperCase();
      return this.map.get(keyUppercase);
    }

    set (key: string, value: GUIData) {
      const keyUppercase = key.toUpperCase();
      this.map.set(keyUppercase, value);
    }

    delete (key: string) {
      const keyUppercase = key.toUpperCase();
      this.map.delete(keyUppercase);
    }

    // ==== ユーティリティ関数 ====
    getFolder (key: string): DAT.GUI | undefined {
      const data = this.get(key);
      if (data && data.type === 'folder') {
        return data.instance;
      }
      return undefined;
    }

    getController (key: string): DAT.GUIController | undefined {
      const data = this.get(key);
      if (data && data.type === 'controller') {
        return data.instance;
      }
      return undefined;
    }

    setFolder (key: string, value: DAT.GUI) {
      this.set(key, { type: 'folder', instance: value });
    }

    setController (key: string, value: DAT.GUIController) {
      this.set(key, { type: 'controller', instance: value });
    }
}
