import configs from 'configs';
import { Process } from './process';
import { Storage, Firebase } from './utils';
import '../stylesheets/background.scss';

var p = new Process();

chrome.runtime.onInstalled.addListener(async () => {
  let storage = new Storage();
  let firebaseConfigs = Firebase.pickConfigs(configs);
  let realtimeDatabaseConfigs = Firebase.pickRealtimeDatabaseConfigs(configs);
  let settings = Process.pickSettingConfigs();
  await storage.setWithoutOverwriting('firebase', firebaseConfigs);
  await storage.setWithoutOverwriting('realtimeDatabase', realtimeDatabaseConfigs);
  await storage.setWithoutOverwriting('settings', settings);
  p.runListener();
});

chrome.runtime.onStartup.addListener(async () => {
  p.runListener();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.configUpdated === true) {
    p.stopListener();
    p.runListener(true);
    sendResponse({ ok: true });
  }
});
