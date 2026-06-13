document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_WIDTH = 120;
  const DEFAULT_ALWAYS_EXPANDED = false;

  const widthSlider       = document.getElementById('width-slider');
  const valueDisplay      = document.getElementById('width-value');
  const mockPanel         = document.getElementById('mock-panel');
  const mockTrackFill     = document.getElementById('mock-track-fill');
  const mockHandle        = document.getElementById('mock-handle');
  const alwaysExpandedChk = document.getElementById('always-expanded-toggle');

  // ── Load saved settings ──────────────────────────────────────────────────
  chrome.storage.local.get(
    { volumeWidth: DEFAULT_WIDTH, alwaysExpanded: DEFAULT_ALWAYS_EXPANDED },
    (data) => {
      widthSlider.value = data.volumeWidth;
      alwaysExpandedChk.checked = data.alwaysExpanded;
      updatePreview(data.volumeWidth);
    }
  );

  // ── Width slider: live preview ───────────────────────────────────────────
  widthSlider.addEventListener('input', (e) => {
    updatePreview(parseInt(e.target.value, 10));
  });

  // Width slider: save on release
  widthSlider.addEventListener('change', (e) => {
    chrome.storage.local.set({ volumeWidth: parseInt(e.target.value, 10) });
  });

  // ── Always Expanded toggle: save immediately ─────────────────────────────
  alwaysExpandedChk.addEventListener('change', (e) => {
    chrome.storage.local.set({ alwaysExpanded: e.target.checked });
  });

  // ── Update popup live preview ────────────────────────────────────────────
  function updatePreview(width) {
    valueDisplay.textContent = width;
    mockPanel.style.width = `${width}px`;
    // Show fill at 70% as a demo
    mockTrackFill.style.width = '70%';
    mockHandle.style.left = '70%';
  }
});
