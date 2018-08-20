import $ from 'jquery'; // eslint-disable-line no-unused-vars
import Vue from 'vue';
import _ from 'lodash';
import Vuetify from 'vuetify';
import '../stylesheets/options.scss';
import { Storage, Notification, Firebase, FirebaseDatabase } from './utils';

const storage = new Storage();

Vue.use(Vuetify)

const app = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  data: {
    errors: [],
    isSaving: false,
    firebase: {
      apiKey: '',
      authDomain: '',
      databaseURL: '',
      storageBucket: ''
    },
    realtimeDatabase: {
      allCollections: [],
      collection: '1',
      title: '2',
      message: '3',
      getNewItemBy: '',
      grabType: '',
      orderBy: ''
    }
  },
  methods: {
    init: async function() {
      let firebase = await storage.get('firebase');
      let realtimeDatabase = await storage.get('realtimeDatabase');
      this.firebase = _.assign(this.firebase, firebase);
      this.realtimeDatabase = _.assign(this.realtimeDatabase, realtimeDatabase);
    },
    firebaseForm: function(e) {
      e.preventDefault();
      if (this.isSaving) return;

      this.isSaving = true;
      this.errors = [];

      _.each(this.firebase, (v, k) => {
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
          this.errors.push(msg);
        }
      });

      if (this.errors.length) {
        this.isSaving = false;
        return false;
      }
      storage.set('firebase', this.firebase).then((result) => {
        this.isSaving = false;
        // M.toast({html: 'Saved successfully', classes: 'rounded'})
      });
    }
  },
  created: function() {
    this.init();
  },
  mounted: function() {
  }
});

document.addEventListener('DOMContentLoaded', () => {
});
