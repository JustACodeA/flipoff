import { Board } from './Board.js';
import { SoundEngine } from './SoundEngine.js';
import { POLL_INTERVAL } from './constants.js';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

document.addEventListener('DOMContentLoaded', () => {
  const boardContainer = document.getElementById('board-container');
  const soundEngine = new SoundEngine();
  const board = new Board(boardContainer, soundEngine);

  let currentData = null;
  let lastRenderedKey = null;

  // --- Live clock + countdown line generation ---

  function getClockLine() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const day = now.getDate();
    const month = MONTHS[now.getMonth()];
    return `${hh}:${mm}  ${day} ${month}`;
  }

  function getMinutesUntil(etaStr) {
    const parts = (etaStr || '').split(':');
    if (parts.length !== 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;

    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);

    return Math.round((target - now) / 60000);
  }

  function generateLines(data) {
    if (!data) return null;

    // Custom message mode — pass through, but add live clock on last line
    if (data.mode === 'message') {
      const lines = [];
      for (let i = 0; i < 7; i++) {
        lines.push((data.customLines && data.customLines[i]) || '');
      }
      return lines;
    }

    // Aircraft mode — take server lines as base, overlay live data
    const lines = [...data.lines];

    // Row 6: live clock (replaces static "UPDATED" timestamp)
    lines[6] = getClockLine();

    // Countdown for aircraft in FLUG status
    if (data.aircraft) {
      data.aircraft.forEach((ac, i) => {
        if (ac.status === 'FLUG' && ac.eta) {
          const mins = getMinutesUntil(ac.eta);
          if (mins !== null && mins > 0) {
            const timeRow = i === 0 ? 3 : 5;
            lines[timeRow] = `ETA ${ac.eta}  IN ${mins} MIN`;
          } else if (mins !== null && mins <= 0) {
            const timeRow = i === 0 ? 3 : 5;
            lines[timeRow] = `ETA ${ac.eta}  LANDED`;
          }
        }
      });
    }

    return lines;
  }

  function updateBoard() {
    if (!currentData || board.isTransitioning) return;
    const lines = generateLines(currentData);
    if (!lines) return;

    const key = JSON.stringify(lines);
    if (key !== lastRenderedKey) {
      lastRenderedKey = key;
      board.displayMessage(lines);
    }
  }

  // --- API polling ---

  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return;
      currentData = await res.json();
      updateBoard();
    } catch (e) {
      // Network error — silently retry on next poll
    }
  }

  // Initial fetch
  fetchStatus();

  // Poll API for data changes
  setInterval(() => {
    if (!board.isTransitioning) {
      fetchStatus();
    }
  }, POLL_INTERVAL);

  // Update clock + countdown every 10s (only animates when minute changes)
  setInterval(() => {
    updateBoard();
  }, 10000);

  // --- Audio init ---

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

  // --- Keyboard shortcuts (F = fullscreen, M = mute) ---

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
