import $ from 'jquery'; // eslint-disable-line no-unused-vars
import Vue from 'vue';
import _ from 'lodash';
import Consts from './consts';
import { Storage } from './utils';
import 'materialize-css/dist/js/materialize.js';
import '../stylesheets/popup.scss';

const storage = new Storage();

async function readFromStorage() {
  let settings = await storage.get('settings');
  let isAuthenticated = await storage.get('isAuthenticated', false);
  return {
    settings: _.assign({ enableNotification: true, autoClose: false }, settings),
    isAuthenticated: isAuthenticated
  };
}

readFromStorage().then((result) => {
  const app = new Vue({ // eslint-disable-line no-unused-vars
    el: '#app',
    data: {
      message: '',
      errors: [],
      settings: {
        enableNotification: result.enableNotification,
        autoClose: result.autoClose
      },
      signIn: {
        email: '',
        password: ''
      },
      signUp: {
        email: '',
        password: ''
      },
      isSigning: false,
      isAuthenticated: result.isAuthenticated,
      showSignUp: false,
      showSignIn: true,
      consts: Consts
    },
    watch: {
      // whenever question changes, this function will run
      settings: {
        handler: function(newSettings, oldSettings) {
          this.message = 'Waiting for you to stop changing...';
          this.debouncedChangeSetting();
        },
        immediate: false,
        deep: true
      }
    },
    methods: {
      changeSetting: function() {
        storage.set('settings', this.settings).then((result) => {
          chrome.runtime.sendMessage({ configUpdated: true }, (response) => {
            this.message = '';
          });
        });
      },
      openOptions: function() {
        if (chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        } else {
          window.open(chrome.runtime.getURL('options.html'));
        }
      },
      signInForm: function(e) {
        e.preventDefault();
        if (this.isSigning) return;

        this.isSigning = true;
        this.message = '';
        if (!this.signInUpValidate(this.signIn)) {
          this.isSigning = false;
          return;
        }

        storage.set('signIn', this.signIn).then((result) => {
          chrome.runtime.sendMessage({ signIn: true }, (response) => {
            console.log(response);
            this.isAuthenticated = response.success;
            this.message = response.message;
            this.isSigning = false;
          });
        });
      },
      signUpForm: function(e) {
        e.preventDefault();
        if (this.isSigning) return;

        this.isSigning = true;
        this.message = '';
        if (!this.signInUpValidate(this.signUp)) {
          this.isSigning = false;
          return;
        }

        storage.set('signUp', this.signUp).then((result) => {
          storage.set('signIn', { email: this.signUp.email, password: this.signUp.password }).then((result) => {
            chrome.runtime.sendMessage({ signUp: true }, (response) => {
              this.isAuthenticated = response.success;
              this.message = response.message;
              this.isSigning = false;
            });
          });
        });
      },
      signInUpValidate: function(data) {
        this.errors = [];

        _.each(data, (v, k) => {
          if (v === '') {
            let msg = '';
            switch (k) {
              case 'email':
                msg = 'Email is required.';
                break;
              case 'password':
                msg = 'Password is required.';
                break;
            }
            msg && this.errors.push(msg);
          }
        });

        if (this.errors.length) {
          return false;
        }

        return true;
      },
      signOut: function() {
        if (this.isSigning) return;

        this.isSigning = true;

        chrome.runtime.sendMessage({ signOut: true }, (response) => {
          this.isAuthenticated = !response.success;
          this.message = response.message;
          this.isSigning = false;
        });
      },
      showSignInUp: function() {
        this.showSignIn = !this.showSignIn;
        this.showSignUp = !this.showSignUp;
      }
    },
    created: function() {
      this.debouncedChangeSetting = _.debounce(this.changeSetting, 500);
    },
    mounted: function() {
      M.AutoInit();
    }
  });
});
