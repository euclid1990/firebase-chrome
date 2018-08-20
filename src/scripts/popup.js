import $ from 'jquery';

M.AutoInit();

// eslint-disable-line no-unused-vars
function openOptions() {
  chrome.tabs.create({'url': 'options.html'});
}

function init() {
  $('#nav-options').on('click', (e) => {
    openOptions();
    // let id = uuid();
    // var opt = {
    //   type: 'basic',
    //   title: 'Title Message',
    //   message: 'Message for the user.' + id,
    //   iconUrl: 'img/success.png'
    // };
    // console.log(12);
    // chrome.notifications.create(id, opt, function() {});
    // setTimeout(() => {
    //   chrome.notifications.clear(id, () => { console.log(`Closed ${id}`); });
    // }, 2000);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
