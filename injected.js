(function () {
  'use strict';

  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    if (e.data && e.data.type === 'YT_SET_VOLUME') {
      const player = document.getElementById('movie_player');
      if (player) {
        if (e.data.muted) {
          if (typeof player.mute === 'function') {
            player.mute();
          }
        } else {
          if (typeof player.unMute === 'function') {
            player.unMute();
          }
          if (typeof player.setVolume === 'function') {
            player.setVolume(e.data.volume);
          }
        }
      }
    }
  });
})();
