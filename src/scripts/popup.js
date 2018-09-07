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
  return _.assign({
    enableNotification: true,
    autoClose: false
  }, settings);
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
      isSignIn: false,
      showSignIn: true,
      signUp: {
        email: '',
        password: ''
      },
      isSignUp: false,
      showSignUp: false,
      isAuthenticated: false,
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
        if (this.isSignIn) return;

        this.isSignIn = true;
        if (!this.signInUpValidate()) {
          this.isSignIn = false;
          return;
        }

        storage.set('signIn', this.signIn).then((result) => {
          this.isSignIn = false;
          this.isAuthenticated = true;
        });
      },
      signUpForm: function(e) {
        e.preventDefault();
        if (this.isSignUp) return;

        this.isSignUp = true;
        if (!this.signInUpValidate()) {
          this.isSignUp = false;
          return;
        }

        storage.set('signUp', this.signUp).then((result) => {
          this.isSignUp = false;
          this.isAuthenticated = true;
        });
      },
      signInUpValidate: function() {
        this.errors = [];

        _.each(this.signIn, (v, k) => {
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
