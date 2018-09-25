import $ from 'jquery'; // eslint-disable-line no-unused-vars
import Vue from 'vue';
import _ from 'lodash';
import Consts from './consts';
import { Storage } from './utils';
import 'materialize-css/dist/js/materialize.js';
import '../stylesheets/options.scss';

const storage = new Storage();

const app = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  data: {
    errors: [],
    isFetching: false,
    isTesting: false,
    isSaving: false,
    common: {
      icon_ok: 'img/notification.png',
      icon_warning: 'img/notification.png'
    },
    firebase: {
      apiKey: '',
      authDomain: '',
      databaseURL: '',
      storageBucket: ''
    },
    consts: Consts
  },
  methods: {
    init: async function() {
      let firebase = await storage.get('firebase');
      let common = await storage.get('common');
      this.firebase = _.assign(this.firebase, firebase);
      this.common = _.assign(this.common, common);
    },
    setIcon: async function(event, name) {
      let file = event.target.files[0];
      var reader = new window.FileReader();
      reader.onload = event => {
        let dataUrl = event.target.result;
        this.common[name] = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    firebaseForm: function(e) {
      e.preventDefault();
      if (this.isSaving) return;

      this.isSaving = true;
      if (!this.firebaseValidate()) {
        this.isSaving = false;
        return;
      }

      storage.set('firebase', this.firebase).then((result) => {
        chrome.runtime.sendMessage({ configUpdated: true }, (response) => {
          this.isSaving = false;
          M.toast({html: 'Saved successfully', classes: 'rounded'});
        });
      });
    },
    firebaseValidate: function() {
      this.errors = [];

      _.each(this.realtimeDatabase, (v, k) => {
        if (v === '') {
          let msg = '';
          switch (k) {
            case 'apiKey':
              msg = 'API Key is required.';
              break;
            case 'authDomain':
              msg = 'Auth Domain is required.';
              break;
            case 'databaseURL':
              msg = 'Database URL is required.';
              break;
            case 'storageBucket':
              msg = 'Storage Bucket is required.';
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
    commonValidate: function() {
      this.errors = [];

      if (this.errors.length) {
        return false;
      }

      return true;
    },
    commonForm: async function(e) {
      e.preventDefault();
      if (!this.commonValidate()) {
        return;
      }

      storage.set('common', this.common).then((result) => {
        chrome.runtime.sendMessage({ configUpdated: true }, (response) => {
          M.toast({html: 'Saved successfully', classes: 'rounded'});
        });
      });
    },
    close: function() {
      chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
        let tabId = tabs[0].id;
        chrome.tabs.remove(tabId);
      });
    }
  },
  created: function() {
    this.init();
  },
  mounted: function() {
    M.AutoInit();
    $('#splash').addClass('splash-loaded');
  },
  updated: function() {
    let elems = document.querySelectorAll('select');
    M.FormSelect.init(elems, {});
  }
});
