import configs from 'configs';
import { Storage, Notification, Firebase, FirebaseDatabase } from './utils';
import '../stylesheets/background.scss';

chrome.runtime.onInstalled.addListener(async () => {
  let storage = new Storage();
  let firebaseConfigs = Firebase.pickConfigs(configs);
  await storage.set('firebase', firebaseConfigs);
});

// chrome.runtime.onStartup.addListener(async () => {
var add = false;
console.log(Firebase.pickConfigs(configs));
let fbDatabase = new FirebaseDatabase(Firebase.pickConfigs(configs));
// fbDatabase.set('notifications', 1, {title: 'hhhhh', message: '3333333'});
fbDatabase.onNewChildAdded('notifications', 1, (snapshot, prevChildKey) => {
  console.log(prevChildKey);
  let items = snapshot.val();
  console.log(items);
  let noti = new Notification(null, 'basic', 'img/success.png', items.title, items.message);
  noti.show();
  setTimeout(() => {
    noti.close();
  }, 1000);
});
// });
setTimeout(() => {
  if (add) fbDatabase.push('notifications', {title: 'aaaaaa', message: '4444' + new Date()});
  add = false;
}, 3000);

var aa = async () => {
  let root = await fbDatabase.getCollectionName();
  console.log(root);
};
aa();
