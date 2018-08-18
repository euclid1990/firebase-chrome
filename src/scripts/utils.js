import { v4 as uuid } from 'uuid';
import _ from 'lodash';

export class Storage {
  extractMasterKey(key) {
    return key.split('.')[0];
  }

  get(key, defaultValue = undefined) {
    let masterKey = this.extractMasterKey(key);
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(masterKey, (result) => {
        let v = _.get(result, key, undefined);
        if (v === undefined) {
          console.log(`[GET] Cannot get property '${key}' of storage.`);
          return resolve(defaultValue);
        }
        console.log(`[GET] storage.${key} = ${JSON.stringify(v)}.`);
        return resolve(v);
      });
    });
  }

  set(key, value) {
    console.log(key);
    let masterKey = this.extractMasterKey(key);
    return new Promise((resolve, reject) => {
      this.get(masterKey, {}).then((result) => {
        let o = {}; o[masterKey] = result;
        console.log(o);
        let n = _.set(o, key, value);
        chrome.storage.sync.set(n, () => {
          console.log(`[SET] storage.${key} = ${JSON.stringify(value)}.`);
          resolve(true);
        });
      });
    });
  }

  remove(key) {
    let keys = key.split('.');
    let masterKey = keys[0];
    return new Promise((resolve, reject) => {
      if (keys.length === 1) {
        chrome.storage.sync.remove(key, () => {
          resolve(true);
        });
      } else {
        this.get(masterKey, {}).then((result) => {
          let o = {}; o[masterKey] = result;
          let n = _.omit(o, key);
          chrome.storage.sync.set(n, () => {
            console.log(`[REMOVE] storage.${masterKey} = ${JSON.stringify(n[masterKey])}.`);
            resolve(true);
          });
        });
      }
    });
  }

  clear() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.clear(() => {
        console.log('[CLEAR] storage.');
        resolve(true);
      });
    });
  }
}

export class Notification {
  constructor(id, type, iconUrl, title, message) {
    this.id = id;
    this.type = type;
    this.iconUrl = iconUrl;
    this.title = title;
    this.message = message;
  }

  show() {
    let options = {
      type: this.type,
      iconUrl: this.iconUrl,
      title: this.title,
      message: this.message
    };
    if (_.isNull(this.id)) {
      this.id = uuid();
    }
    chrome.notifications.create(this.id, options, () => {});
  }

  close() {
    chrome.notifications.clear(this.id, () => {});
  }
}
