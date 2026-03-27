import { Board } from './Board.js';
import { SoundEngine } from './SoundEngine.js';
import { POLL_INTERVAL, TOTAL_TRANSITION } from './constants.js';

document.addEventListener('DOMContentLoaded', () => {
  const boardContainer = document.getElementById('board-container');
  const soundEngine = new SoundEngine();
  const board = new Board(boardContainer, soundEngine);

  let lastLines = null;
  let pollTimer = null;

  // Fetch status from API and update board
  async function fetchAndDisplay() {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return;
      const data = await res.json();

      // Only trigger animation if lines actually changed
      const newLines = JSON.stringify(data.lines);
      if (newLines !== lastLines) {
        lastLines = newLines;
        board.displayMessage(data.lines);
      }
    } catch (e) {
      // Network error — silently retry on next poll
    }
  }

  // Initial fetch
  fetchAndDisplay();

  // Poll for updates
  pollTimer = setInterval(() => {
    if (!board.isTransitioning) {
      fetchAndDisplay();
    }
  }, POLL_INTERVAL);

  // Initialize audio on first user interaction (browser autoplay policy)
  let audioInitialized = false;
  const initAudio = async () => {
    if (audioInitialized) return;
    audioInitialized = true;
    await soundEngine.init();
    soundEngine.resume();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
  };
  document.addEventListener('click', initAudio);
  document.addEventListener('keydown', initAudio);

  // Keyboard shortcuts (F = fullscreen, M = mute, Escape = exit)
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case 'f':
      case 'F':
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        break;

      case 'm':
      case 'M':
        e.preventDefault();
        initAudio();
        soundEngine.toggleMute();
        break;

      case 'Escape':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        break;
    }
  });
});
