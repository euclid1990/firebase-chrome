import configs from 'configs';
import Consts from './consts';
import { Storage, Notification, Firebase, FirebaseDatabase } from './utils';
import '../stylesheets/background.scss';

chrome.runtime.onInstalled.addListener(async () => {
  let storage = new Storage();
  let firebaseConfigs = Firebase.pickConfigs(configs);
  let realtimeDatabaseConfigs = Firebase.pickRealtimeDatabaseConfigs(configs);
  await storage.set('firebase', firebaseConfigs);
  await storage.set('realtimeDatabase', realtimeDatabaseConfigs);
});

// chrome.runtime.onStartup.addListener(async () => {});
async function listenFirebase() {
  let storage = new Storage();
  let firebase = await storage.get('firebase');
  let realtimeDatabase = await storage.get('realtimeDatabase');
  let ref = realtimeDatabase.collection;
  let fbDatabase = new FirebaseDatabase(firebase);
  let init = false;

  if (realtimeDatabase.getNewItemBy === Consts.GET_NEW_ITEM_BY_GRAB_LIMIT) {
    switch (realtimeDatabase.grabType) {
      case Consts.GRAB_LIMIT_TO_FIRST:
        break;
      case Consts.GRAB_LIMIT_TO_LAST:
        fbDatabase.onNewChildAdded('notifications', 1, (snapshot, prevChildKey) => {
          if (init) {
            let items = snapshot.val();
            console.log(items);
            let noti = new Notification(null, 'basic', 'img/notification.png', items.title, items.message);
            noti.show();
            setTimeout(() => {
              noti.close();
            }, 2000);
          }
          init = true;
        });
        break;
    }
  } else if (realtimeDatabase.getNewItemBy === Consts.GET_NEW_ITEM_BY_ORDER_BY) {
  }
}

listenFirebase();
