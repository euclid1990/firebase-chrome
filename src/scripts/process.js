import Consts from './consts';
import { Storage, Notification, FirebaseDatabase, FirebaseAuth, checkSendSameEmail } from './utils';

export class Process {
  constructor() {
    this.storage = new Storage();
    this.emails = {};
  }

  static pickSettingConfigs() {
    return {
      enableNotification: Consts.ENABLE_NOTIFICATION,
      autoClose: Consts.AUTO_CLOSE_NOTIFICATION
    };
  }

  async initialize(force = false) {
    if (typeof this.firebase === 'undefined' || force) {
      this.firebase = await this.storage.get('firebase');
    }
    if (typeof this.settings === 'undefined' || force) {
      this.settings = await this.storage.get('settings');
    }
    return true;
  }

  async runListener(again = false) {
    await this.initialize(again);

    let fbDatabase = new FirebaseDatabase(this.firebase);
    let fbAuth = new FirebaseAuth(this.firebase);

    if (!this.settings.enableNotification) {
      return;
    }

    if (again) {
      // In case update config, we only need re-watching
      let ref = await this.storage.get('ref');
      this.newMailAdded(fbDatabase, ref);
      return;
    }

    var unsubscribe = fbAuth.onAuthStateChanged(async (user) => { /* eslint-disable-line no-unused-vars */
      console.log('Firebase auth state changed !');
      if (!user) {
        // Try sign in from storage information
        return this.signIn();
      };
      // unsubscribe(); /* Firebase onAuthStateChanged unsubscribe */
      // Get list all emails

      console.log(`User [${user.uid}] have been signed in.`);

      let ref = `emails/${user.uid}`;
      await this.storage.set('ref', ref);
      this.newMailAdded(fbDatabase, ref);
    });
  }

  async newMailAdded(fbDatabase, ref) {
    let init = true;
    this.emails = await fbDatabase.read(ref);
    this.emails = this.emails.val();
    if (!this.emails) {
      init = false;
      this.emails = {};
    }
    // Perform watching and check email
    fbDatabase.onNewChildAdded(ref, 1, (snapshot, prevChildKey) => {
      // Skip check init if this email is first email
      if (init) {
        init = false;
        return;
      }
      let key = snapshot.key;
      let recentMail = snapshot.val();
      let item = checkSendSameEmail(this.emails, recentMail);
      this.emails[key] = recentMail;
      this.triggerNotify(item);
    });
  }

  async triggerNotify(item) {
    let buttons = [];
    if (item.ok === false && item.isNew === true) {
      // Add button close for new mail & non-exist
      buttons.push({
        title: '新規メールなので問題ないです'
      });
    }

    let notiType = item.ok === true ? 'ok' : 'warning';
    let icon = ((await this.storage.get('common.icon_' + notiType)) || 'img/notification.png');
    let noti = new Notification(null, 'basic', icon, item.title, item.message, buttons);

    if (item.ok === true) {
      // Auto-close if mail existed
      this.autoCloseNotification(this.settings.autoClose, noti);
    } else if (item.isNew === true) {
      // Add listener for button close
      noti.addListener((notificationId, buttonIndex) => {
        if (buttonIndex === 0) {
          noti.close();
        }
      });
    }

    noti.show();
  }

  autoCloseNotification(ok, notiObj) {
    if (ok) {
      setTimeout(() => {
        notiObj.close();
      }, Consts.CLOSE_NOTIFICATION_TIMEOUT);
    }
  }

  async stopListener() {
    let fbDatabase = new FirebaseDatabase(this.firebase);
    let ref = await this.storage.get('ref');
    await fbDatabase.database.ref(ref).off();
    await this.storage.remove('ref');
  }

  async pushMail(dataTimestamp) {
    let isAuthenticated = await this.storage.get('isAuthenticated');
    if (!isAuthenticated) return;

    await this.initialize();

    let fbDatabase = new FirebaseDatabase(this.firebase);
    let ref = await this.storage.get('ref');
    let payload = await this.storage.get(dataTimestamp);
    try {
      await fbDatabase.push(ref, payload);
      await this.storage.remove(dataTimestamp);
      return { success: true, message: '' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async signIn() {
    await this.initialize();
    let fbAuth = new FirebaseAuth(this.firebase);
    let signInInfo = await this.storage.get('signIn');
    if (!signInInfo) return { success: false, message: 'Sign in info not found.' };

    try {
      let result = await fbAuth.signIn(signInInfo);
      let uid = result.user.uid;
      await this.storage.set('isAuthenticated', true);
      await this.storage.set('ref', `emails/${uid}`);
      return { success: true, message: '' };
    } catch (error) {
      await this.storage.set('isAuthenticated', false);
      return { success: false, message: error.message };
    }
  }

  async signUp() {
    await this.initialize();
    let fbAuth = new FirebaseAuth(this.firebase);
    let signUpInfo = await this.storage.get('signUp');
    if (!signUpInfo) return { success: false, message: 'Sign up info not found.' };

    try {
      let result = await fbAuth.signUp(signUpInfo);
      let uid = result.user.uid;
      await this.storage.set('isAuthenticated', true);
      await this.storage.set('ref', `emails/${uid}`);
      return { success: true, message: '' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async signOut() {
    await this.initialize();
    let fbAuth = new FirebaseAuth(this.firebase);

    try {
      await this.storage.remove('signIn');
      await this.storage.remove('signUp');
      await this.storage.set('isAuthenticated', false);
      await this.stopListener();
      await fbAuth.signOut();
      return { success: true, message: '' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async resetPassword() {
    await this.initialize();
    let fbAuth = new FirebaseAuth(this.firebase);
    let resetInfo = await this.storage.get('reset');
    if (!resetInfo) return { success: false, message: 'Reset info not found.' };

    try {
      await fbAuth.sendPasswordResetEmail(resetInfo.email);
      await this.storage.remove('reset');
      return { success: true, message: 'Password reset email was sent' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
