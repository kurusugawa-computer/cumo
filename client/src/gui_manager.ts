import * as DAT from 'dat.gui';

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
