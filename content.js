(function () {
  'use strict';

  const DEFAULT_WIDTH = 120;
  let currentWidth = DEFAULT_WIDTH;
  let alwaysExpanded = false;
  let styleEl = null;

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
        overflow: hidden;
        transition: width 0.12s ease;
        flex-shrink: 0;
        vertical-align: middle;
      }

      /* Expand on hover OR while dragging (hover-only mode) */
      ${alwaysExpanded ? `
      #yt-cvol-wrap {
        width: ${width}px !important;
      }
      ` : `
      .ytp-volume-area:hover #yt-cvol-wrap,
      #yt-cvol-wrap.yt-cvol-dragging {
        width: ${width}px;
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

    const vol = video.muted ? 0 : Math.max(0, Math.min(1, video.volume));
    const frac = volumeToFraction(vol);
    const pct = (frac * 100).toFixed(3) + '%';

    fill.style.width = pct;
    handle.style.left = pct;

    const track = document.getElementById('yt-cvol-track');
    if (track) track.setAttribute('aria-valuenow', Math.round(frac * 100));
  }

  // ─── Apply a drag position (clientX) to the video volume ──────────────────
  function applySeek(clientX) {
    const track = document.getElementById('yt-cvol-track');
    const video = document.querySelector('video');
    if (!track || !video) return;

    const rect = track.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const vol = fractionToVolume(fraction);

    if (vol <= 0) {
      video.muted = true;
    } else {
      video.muted = false;
      video.volume = vol;
    }

    updateUI(video);
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
      };

      document.addEventListener('mousemove', onMove, true);
      document.addEventListener('mouseup', onUp, true);
    });

    // ── Keyboard support ──
    track.addEventListener('keydown', (e) => {
      const video = document.querySelector('video');
      if (!video) return;
      const step = 0.05;
      const currentFrac = volumeToFraction(video.muted ? 0 : video.volume);
      let newFrac = currentFrac;

      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') newFrac = Math.min(1, currentFrac + step);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') newFrac = Math.max(0, currentFrac - step);
      else return;

      e.preventDefault();
      const vol = fractionToVolume(newFrac);
      video.muted = vol <= 0;
      if (vol > 0) video.volume = vol;
      updateUI(video);
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
    const video = document.querySelector('video');
    if (video) updateUI(video);
  }

  // ─── Keep in sync with system/keyboard volume changes ─────────────────────
  document.addEventListener('volumechange', (e) => {
    if (e.target && e.target.tagName === 'VIDEO') updateUI(e.target);
  }, true);

  // ─── Re-inject on YouTube SPA navigation (page changes without reload) ─────
  let injectDebounce = null;
  const navObserver = new MutationObserver(() => {
    if (!document.getElementById('yt-cvol-wrap')) {
      clearTimeout(injectDebounce);
      injectDebounce = setTimeout(inject, 300);
    }
  });

  // ─── Initialize ────────────────────────────────────────────────────────────
  chrome.storage.local.get(
    { volumeWidth: DEFAULT_WIDTH, alwaysExpanded: false },
    (data) => {
      currentWidth = data.volumeWidth;
      alwaysExpanded = data.alwaysExpanded;
      injectStyles(currentWidth, alwaysExpanded);

    const ready = () => {
      inject();
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
