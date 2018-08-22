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
      settings: {
        enableNotification: result.enableNotification,
        autoClose: result.autoClose
      },
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
