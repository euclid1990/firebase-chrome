import configs from 'configs';
import { Storage } from './utils';
import '../stylesheets/background.scss';

chrome.runtime.onInstalled.addListener(async () => {
  let storage = new Storage();
  await storage.set('configs', configs);
});
