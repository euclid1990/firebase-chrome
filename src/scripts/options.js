import $ from 'jquery'; // eslint-disable-line no-unused-vars
import Vue from 'vue';
import 'materialize-css/dist/js/materialize.js';
import '../stylesheets/options.scss';

const app = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  data: {
    firebase: {
      apiKey: '1',
      authDomain: '2',
      databaseUrl: '3',
      storageBucket: '4'
    },
    notification: {
      collection: '1',
      title: '2',
      message: '3'
    }
  },
  methods: {
    reverseMessage: () => {
      this.message = this.message.split('').reverse().join('');
    }
  },
  mounted: () => {
    M.AutoInit();
  }
});

document.addEventListener('DOMContentLoaded', () => {
});
