(function () {
  'use strict';

  let lastBackTime = 0;
  let lastForwardTime = 0;
  const DOUBLE_CLICK_THRESHOLD = 180; // ms window to detect both buttons pressed
  let pendingNavTimeout = null;
  let pendingNavType = null;
  let repeatInterval = null;

  // Check if browser is in fullscreen mode
  function isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  // Seek or navigate history
  function handleNavigation(type) {
    // History actions (only run if not in fullscreen)
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
    clearRepeatKey();
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

  // Dispatch synthetic keyboard events
  function dispatchKey(type, keyName) {
    const codeMap = {
      'ArrowLeft': { keyCode: 37, code: 'ArrowLeft' },
      'ArrowRight': { keyCode: 39, code: 'ArrowRight' }
    };
    const info = codeMap[keyName];
    if (!info) return;

    const target = document.activeElement || document.body || document;
    const event = new KeyboardEvent(type, {
      key: keyName,
      code: info.code,
      keyCode: info.keyCode,
      which: info.keyCode,
      bubbles: true,
      cancelable: true,
      view: window
    });
    target.dispatchEvent(event);
  }

  function startRepeatKey(keyName) {
    clearRepeatKey();
    dispatchKey('keydown', keyName);
    
    // Simulate physical keyboard repeat rate (250ms initial delay, then 50ms interval)
    repeatInterval = setTimeout(() => {
      dispatchKey('keydown', keyName);
      repeatInterval = setInterval(() => {
        dispatchKey('keydown', keyName);
      }, 50);
    }, 250);
  }

  function clearRepeatKey() {
    if (repeatInterval) {
      clearInterval(repeatInterval);
      clearTimeout(repeatInterval);
      repeatInterval = null;
    }
  }

  function processButtonDown(button, event) {
    if (button !== 3 && button !== 4) return;

    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();

    if (button === 3) {
      lastBackTime = now;
      if (now - lastForwardTime < DOUBLE_CLICK_THRESHOLD) {
        triggerReload();
      } else {
        cancelPendingNavigation();
        if (isFullscreen()) {
          startRepeatKey('ArrowLeft');
        } else {
          pendingNavType = 'back';
          pendingNavTimeout = setTimeout(() => {
            handleNavigation('back');
            pendingNavTimeout = null;
            pendingNavType = null;
          }, DOUBLE_CLICK_THRESHOLD);
        }
      }
    } else if (button === 4) {
      lastForwardTime = now;
      if (now - lastBackTime < DOUBLE_CLICK_THRESHOLD) {
        triggerReload();
      } else {
        cancelPendingNavigation();
        if (isFullscreen()) {
          startRepeatKey('ArrowRight');
        } else {
          pendingNavType = 'forward';
          pendingNavTimeout = setTimeout(() => {
            handleNavigation('forward');
            pendingNavTimeout = null;
            pendingNavType = null;
          }, DOUBLE_CLICK_THRESHOLD);
        }
      }
    }
  }

  function processButtonUp(button, event) {
    if (button !== 3 && button !== 4) return;

    event.preventDefault();
    event.stopPropagation();

    if (isFullscreen()) {
      clearRepeatKey();
      if (button === 3) {
        dispatchKey('keyup', 'ArrowLeft');
      } else if (button === 4) {
        dispatchKey('keyup', 'ArrowRight');
      }
    }
  }

  // Intercept mousedown at the capture phase to cancel browser back/forward and detect double click instantly
  window.addEventListener('mousedown', (e) => {
    if (e.button === 3 || e.button === 4) {
      processButtonDown(e.button, e);
    }
  }, true);

  // Prevent default behavior and propagation for mouseup/click to ensure browser standard actions do not run
  window.addEventListener('mouseup', (e) => {
    if (e.button === 3 || e.button === 4) {
      processButtonUp(e.button, e);
    }
  }, true);

  // Clear repeat timers if window loses focus
  window.addEventListener('blur', () => {
    clearRepeatKey();
  });

})();
