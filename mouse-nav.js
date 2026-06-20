(function () {
  'use strict';

  let lastBackTime = 0;
  let lastForwardTime = 0;
  const DOUBLE_CLICK_THRESHOLD = 180; // ms window to detect both buttons pressed
  let pendingNavTimeout = null;
  let pendingNavType = null;

  // Check if browser is in fullscreen mode
  function isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  // Find active video on page (inside fullscreen element if applicable)
  function findActiveVideo() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    if (fsEl) {
      const video = fsEl.querySelector('video');
      if (video) return video;
    }
    return document.querySelector('video');
  }

  // Seek or navigate history
  function handleNavigation(type) {
    if (isFullscreen()) {
      const video = findActiveVideo();
      if (video) {
        if (type === 'back') {
          video.currentTime = Math.max(0, video.currentTime - 10);
        } else if (type === 'forward') {
          video.currentTime = Math.min(video.duration || video.currentTime + 10, video.currentTime + 10);
        }
        return;
      }
    }

    // Default history actions
    if (type === 'back') {
      window.history.back();
    } else if (type === 'forward') {
      window.history.forward();
    }
  }

  function cancelPendingNavigation() {
    if (pendingNavTimeout) {
      clearTimeout(pendingNavTimeout);
      pendingNavTimeout = null;
      pendingNavType = null;
    }
  }

  function triggerReload() {
    cancelPendingNavigation();
    try {
      if (window.top) {
        window.top.location.reload();
      } else {
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  }

  function processButtonPress(button, event) {
    if (button !== 3 && button !== 4) return;

    // Prevent default browser navigation and stop event bubbling
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();

    if (button === 3) {
      lastBackTime = now;
      if (now - lastForwardTime < DOUBLE_CLICK_THRESHOLD) {
        triggerReload();
      } else {
        cancelPendingNavigation();
        pendingNavType = 'back';
        pendingNavTimeout = setTimeout(() => {
          handleNavigation('back');
          pendingNavTimeout = null;
          pendingNavType = null;
        }, DOUBLE_CLICK_THRESHOLD);
      }
    } else if (button === 4) {
      lastForwardTime = now;
      if (now - lastBackTime < DOUBLE_CLICK_THRESHOLD) {
        triggerReload();
      } else {
        cancelPendingNavigation();
        pendingNavType = 'forward';
        pendingNavTimeout = setTimeout(() => {
          handleNavigation('forward');
          pendingNavTimeout = null;
          pendingNavType = null;
        }, DOUBLE_CLICK_THRESHOLD);
      }
    }
  }

  // Intercept mousedown at the capture phase to cancel browser back/forward and detect double click instantly
  window.addEventListener('mousedown', (e) => {
    if (e.button === 3 || e.button === 4) {
      processButtonPress(e.button, e);
    }
  }, true);

  // Prevent default behavior and propagation for mouseup/click to ensure browser standard actions do not run
  window.addEventListener('mouseup', (e) => {
    if (e.button === 3 || e.button === 4) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

})();
