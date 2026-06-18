(function () {
  'use strict';

  // Communications with the MAIN world (injected.js) are handled via postMessage

  const DEFAULT_WIDTH = 120;
  let currentWidth = DEFAULT_WIDTH;
  let alwaysExpanded = false;
  let styleEl = null;

  // Persistent volume state (override protection)
  let savedVolume = 0.3;
  let savedMuted = false;
  let lastUserVolumeChangeTime = 0;
  let isEnforcing = false;
  let dragEndTimeout = null;
  let justFinishedDragging = false;

  function markUserChanging() {
    lastUserVolumeChangeTime = Date.now();
  }

  function isUserChanging() {
    const wrap = document.getElementById('yt-cvol-wrap');
    const dragging = wrap && wrap.classList.contains('yt-cvol-dragging');
    if (dragging) return true;
    return (Date.now() - lastUserVolumeChangeTime) < 800;
  }

  // ─── Logarithmic (quadratic) volume curve ─────────────────────────────────
  // YouTube uses a quadratic curve so the slider feels logarithmic to the ear.
  // slider fraction (0-1) → actual audio volume (0-1)
  function fractionToVolume(f) {
    return f * f;
  }
  // audio volume (0-1) → slider fraction (0-1)
  function volumeToFraction(v) {
    return Math.sqrt(Math.max(0, Math.min(1, v)));
  }

  // ─── CSS ──────────────────────────────────────────────────────────────────
  function injectStyles(width, expanded) {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'yt-cvol-style';
      (document.head || document.documentElement).appendChild(styleEl);
    }

    styleEl.textContent = `
      /* ── Hide YouTube's native volume panel entirely ── */
      .ytp-volume-panel {
        display: none !important;
      }

      /* ── Wrapper: the expanding window ── */
      #yt-cvol-wrap {
        display: inline-flex;
        align-items: center;
        height: 36px;
        width: 0px;
        margin-right: 0px;
        overflow: hidden;
        transition: width 0.12s ease, margin-right 0.12s ease;
        flex-shrink: 0;
        vertical-align: middle;
      }

      /* Expand on hover OR while dragging (hover-only mode) */
      ${alwaysExpanded ? `
      #yt-cvol-wrap {
        width: ${width}px !important;
        margin-right: 8px !important;
      }
      ` : `
      .ytp-volume-area:hover #yt-cvol-wrap,
      #yt-cvol-wrap.yt-cvol-dragging {
        width: ${width}px;
        margin-right: 8px;
      }
      `}

      /* ── Track: LARGE invisible hit area (20px tall) ──
         Clicking anywhere in this tall zone registers a seek.
         Width is always ${width}px; wrapper clips it. */
      #yt-cvol-track {
        position: relative;
        width: ${width}px;
        height: 20px;
        cursor: pointer;
        flex-shrink: 0;
        display: flex;
        align-items: center;
      }

      /* ── Visual bar: thin 3px grey line centred inside the hit area ── */
      #yt-cvol-bar {
        position: relative;
        width: 100%;
        height: 3px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        pointer-events: none;
      }

      /* ── White fill ── */
      #yt-cvol-fill {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: #fff;
        border-radius: 2px;
        pointer-events: none;
        will-change: width;
      }

      /* ── Handle: 16px dot — larger so it's easy to grab ── */
      #yt-cvol-handle {
        position: absolute;
        top: 50%;
        width: 16px;
        height: 16px;
        background: #fff;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        will-change: left;
        box-shadow: 0 1px 3px rgba(0,0,0,0.5);
      }
    `;
  }

  // ─── Update fill + handle position from video element ─────────────────────
  // fill.width  → % of #yt-cvol-bar  (which is 100% of track width) ✓
  // handle.left → % of #yt-cvol-track (same width as bar) ✓
  function updateUI(video) {
    const fill = document.getElementById('yt-cvol-fill');
    const handle = document.getElementById('yt-cvol-handle');
    if (!fill || !handle || !video) return;

    if (!video.classList.contains('html5-main-video')) {
      return;
    }

    const vol = video.muted ? 0 : Math.max(0, Math.min(1, video.volume));
    const frac = volumeToFraction(vol);
    const pct = (frac * 100).toFixed(3) + '%';

    fill.style.width = pct;
    handle.style.left = pct;

    const track = document.getElementById('yt-cvol-track');
    if (track) track.setAttribute('aria-valuenow', Math.round(frac * 100));
  }

  function syncPlayerVolume() {
    const frac = volumeToFraction(savedVolume);
    const volPct = Math.round(frac * 100);
    window.postMessage({
      type: 'YT_SET_VOLUME',
      volume: volPct,
      muted: savedMuted
    }, '*');
  }

  function enforceSavedVolume(video) {
    if (!video || isEnforcing) return;
    isEnforcing = true;

    video.muted = savedMuted;
    if (!savedMuted) {
      video.volume = savedVolume;
    }
    updateUI(video);
    syncPlayerVolume();

    setTimeout(() => {
      isEnforcing = false;
    }, 200);
  }

  // ─── Apply a drag position (clientX) to the video volume ──────────────────
  function applySeek(clientX) {
    const track = document.getElementById('yt-cvol-track');
    const video = document.querySelector('video.html5-main-video');
    if (!track || !video) return;

    const rect = track.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const volPct = Math.round(fraction * 100);

    // Mark user activity
    markUserChanging();

    // Save state
    const quantizedFraction = volPct / 100;
    const vol = fractionToVolume(quantizedFraction);
    savedVolume = vol;
    savedMuted = volPct <= 0;
    chrome.storage.local.set({ savedVolume, savedMuted });

    // 1. Instantly update the HTML5 video element and slider UI for zero-latency visual feedback
    video.muted = savedMuted;
    if (!savedMuted) {
      video.volume = savedVolume;
    }
    updateUI(video);

    // 2. Notify main-world script via postMessage to invoke YouTube Player API (updates internal state + saves volume)
    window.postMessage({
      type: 'YT_SET_VOLUME',
      volume: volPct,
      muted: savedMuted
    }, '*');
  }

  // ─── Build and return the custom slider DOM ────────────────────────────────
  function buildSlider() {
    const wrap = document.createElement('div');
    wrap.id = 'yt-cvol-wrap';

    // Outer track — large 20px hit area, transparent
    const track = document.createElement('div');
    track.id = 'yt-cvol-track';
    track.setAttribute('role', 'slider');
    track.setAttribute('aria-label', 'Volume');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('tabindex', '0');

    // Inner visual bar — 3px grey, centered inside hit area
    const bar = document.createElement('div');
    bar.id = 'yt-cvol-bar';

    const fill = document.createElement('div');
    fill.id = 'yt-cvol-fill';

    // Handle — positioned absolute relative to track (not bar)
    const handle = document.createElement('div');
    handle.id = 'yt-cvol-handle';

    bar.appendChild(fill);
    track.appendChild(bar);
    track.appendChild(handle);
    wrap.appendChild(track);

    // ── Mouse interaction ──
    track.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      wrap.classList.add('yt-cvol-dragging');
      applySeek(e.clientX);

      const onMove = (e) => {
        e.stopPropagation();
        e.preventDefault();
        applySeek(e.clientX);
      };

      const onUp = (e) => {
        e.stopPropagation();
        wrap.classList.remove('yt-cvol-dragging');
        document.removeEventListener('mousemove', onMove, true);
        document.removeEventListener('mouseup', onUp, true);

        justFinishedDragging = true;
        clearTimeout(dragEndTimeout);
        dragEndTimeout = setTimeout(() => {
          justFinishedDragging = false;
        }, 500);
      };

      document.addEventListener('mousemove', onMove, true);
      document.addEventListener('mouseup', onUp, true);
    });

    // ── Keyboard support ──
    track.addEventListener('keydown', (e) => {
      const video = document.querySelector('video.html5-main-video');
      if (!video) return;
      const step = 0.05;
      const currentFrac = volumeToFraction(video.muted ? 0 : video.volume);
      let newFrac = currentFrac;

      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') newFrac = Math.min(1, currentFrac + step);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') newFrac = Math.max(0, currentFrac - step);
      else return;

      e.preventDefault();

      // Mark user activity
      markUserChanging();
      
      // Save state
      const vol = fractionToVolume(newFrac);
      savedVolume = vol;
      savedMuted = newFrac <= 0;
      chrome.storage.local.set({ savedVolume, savedMuted });
      
      // Instantly update the video element and UI locally
      video.muted = savedMuted;
      if (!savedMuted) {
        video.volume = savedVolume;
      }
      updateUI(video);

      // Notify main world to update player volume settings persistently
      const volPct = Math.round(newFrac * 100);
      window.postMessage({
        type: 'YT_SET_VOLUME',
        volume: volPct,
        muted: savedMuted
      }, '*');
    });

    return wrap;
  }

  // ─── Inject our slider into YouTube's volume area ──────────────────────────
  function inject() {
    if (document.getElementById('yt-cvol-wrap')) return;

    const volumeArea = document.querySelector('.ytp-volume-area');
    if (!volumeArea) {
      setTimeout(inject, 500);
      return;
    }

    const slider = buildSlider();

    // Insert after the mute button, before (or instead of) the native panel
    const muteBtn = volumeArea.querySelector('.ytp-mute-button');
    const nativePanel = volumeArea.querySelector('.ytp-volume-panel');

    if (nativePanel) {
      volumeArea.insertBefore(slider, nativePanel);
    } else if (muteBtn && muteBtn.nextSibling) {
      volumeArea.insertBefore(slider, muteBtn.nextSibling);
    } else {
      volumeArea.appendChild(slider);
    }

    // Sync initial state
    const video = document.querySelector('video.html5-main-video');
    if (video) updateUI(video);
  }

  // ─── Detect user-initiated adjustments to temporarily bypass override safety ───
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'arrowdown' || key === 'm') {
      markUserChanging();
    }
  }, true);

  document.addEventListener('wheel', (e) => {
    if (e.target && e.target.closest('.ytp-volume-area')) {
      markUserChanging();
    }
  }, { capture: true, passive: true });

  document.addEventListener('click', (e) => {
    if (e.target && e.target.closest('.ytp-mute-button')) {
      markUserChanging();
    }
  }, true);

  // ─── Keep in sync & protect against background player resets ───────────────
  document.addEventListener('volumechange', (e) => {
    const video = e.target;
    if (!video || !video.classList.contains('html5-main-video') || isEnforcing) return;

    // Ignore all volumechange events while dragging or during the post-drag cooldown
    const wrap = document.getElementById('yt-cvol-wrap');
    const dragging = wrap && wrap.classList.contains('yt-cvol-dragging');
    if (dragging || justFinishedDragging) return;

    const currentVol = video.muted ? 0 : video.volume;

    if (isUserChanging()) {
      // User manual adjustment -> Accept and persist new volume settings
      savedVolume = video.volume;
      savedMuted = video.muted;
      chrome.storage.local.set({ savedVolume, savedMuted });
      updateUI(video);
    } else {
      // Background change (YouTube player auto-reset, ads, playlist navigate)
      // Check if it deviates from our saved state, and if so, force our volume
      const volDiff = Math.abs(currentVol - (savedMuted ? 0 : savedVolume));
      if (volDiff > 0.01 || video.muted !== savedMuted) {
        enforceSavedVolume(video);
      } else {
        updateUI(video);
      }
    }
  }, true);

  // ─── Re-inject on YouTube SPA navigation (page changes without reload) ─────
  let injectDebounce = null;
  const navObserver = new MutationObserver(() => {
    if (!document.getElementById('yt-cvol-wrap')) {
      clearTimeout(injectDebounce);
      injectDebounce = setTimeout(inject, 300);
    } else {
      // Force sync with the active video player when navigation happens (new playlist video)
      const video = document.querySelector('video.html5-main-video');
      if (video) {
        enforceSavedVolume(video);
      }
    }
  });

  // ─── Initialize ────────────────────────────────────────────────────────────
  chrome.storage.local.get(
    { volumeWidth: DEFAULT_WIDTH, alwaysExpanded: false, savedVolume: 0.3, savedMuted: false },
    (data) => {
      currentWidth = data.volumeWidth;
      alwaysExpanded = data.alwaysExpanded;
      savedVolume = data.savedVolume;
      savedMuted = data.savedMuted;
      
      injectStyles(currentWidth, alwaysExpanded);

      const ready = () => {
        inject();
        
        // Also force sync on main video element inside ready
        const video = document.querySelector('video.html5-main-video');
        if (video) {
          enforceSavedVolume(video);
        }
        
        const playerRoot = document.querySelector('#movie_player') || document.body;
        navObserver.observe(playerRoot, { childList: true, subtree: true });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
      } else {
        ready();
      }
    });

  // ─── Hot-reload when user adjusts settings in popup ─────────────────────
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.volumeWidth) {
      currentWidth = changes.volumeWidth.newValue;
    }
    if (changes.alwaysExpanded) {
      alwaysExpanded = changes.alwaysExpanded.newValue;
    }
    if (changes.volumeWidth || changes.alwaysExpanded) {
      injectStyles(currentWidth, alwaysExpanded);
      const track = document.getElementById('yt-cvol-track');
      if (track) track.style.width = currentWidth + 'px';
    }
  });

})();
