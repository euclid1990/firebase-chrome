import configs from 'configs';
import { Process } from './process';
import { Storage, Firebase } from './utils';
import '../stylesheets/background.scss';

var p = new Process();

chrome.runtime.onInstalled.addListener(async () => {
  let storage = new Storage();
  let firebaseConfigs = Firebase.pickConfigs(configs);
  let settings = Process.pickSettingConfigs();
  await storage.setWithoutOverwriting('firebase', firebaseConfigs);
  await storage.setWithoutOverwriting('settings', settings);
  p.runListener();
});

chrome.runtime.onStartup.addListener(async () => {
  p.runListener();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.configUpdated) {
    p.stopListener().then(() => {
      p.runListener(true).then(result => {
        sendResponse(result);
      });
    });
  }

  if (request.signUp) {
    p.signUp().then(result => {
      sendResponse(result);
    });
  }

  if (request.signIn) {
    p.signIn().then(result => {
      sendResponse(result);
    });
  }

  if (request.signOut) {
    p.signOut().then(result => {
      sendResponse(result);
    });
  }

  if (request.onSendMail) {
    p.pushMail(request.onSendMail).then(result => {
      sendResponse(result);
    });
  }

  return true;
});
