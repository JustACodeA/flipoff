import { Board } from './Board.js';
import { SoundEngine } from './SoundEngine.js';
import { POLL_INTERVAL, STATUS_COLORS, BOARD_COLORS } from './constants.js';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

document.addEventListener('DOMContentLoaded', () => {
  const boardContainer = document.getElementById('board-container');
  const soundEngine = new SoundEngine();
  const board = new Board(boardContainer, soundEngine);

  let currentData = null;
  let lastRenderedKey = null;

  function pad(str, len) {
    return (str || '').substring(0, len).padEnd(len, ' ');
  }

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

  function formatAircraftLine(ac) {
    const reg = pad(ac.registration, 6);
    const sts = pad(ac.status, 5);

    if (ac.status === 'FLUG' && ac.eta) {
      const mins = getMinutesUntil(ac.eta);
      if (mins !== null && mins > 0) {
        return `${reg} ${sts} ${pad(mins + 'M', 5)} ${pad(ac.eta, 5)}`;
      } else if (mins !== null && mins <= 0) {
        return `${reg} ${sts} LANDG ${pad(ac.eta, 5)}`;
      }
    }

    const etd = ac.etd ? pad(ac.etd, 5) : '  -  ';
    const eta = ac.eta ? pad(ac.eta, 5) : '  -  ';
    return `${reg} ${sts} ${etd} ${eta}`;
  }

  function generateLines(data) {
    if (!data) return null;

    // Custom message mode
    if (data.mode === 'message') {
      const lines = [];
      for (let i = 0; i < 7; i++) {
        lines.push((data.customLines && data.customLines[i]) || '');
      }
      return lines;
    }

    // Aircraft mode
    const a1 = data.aircraft[0];
    const a2 = data.aircraft[1];

    return [
      'FLEET STATUS BOARD',
      '',
      'REG    STAT  ETD   ETA',
      formatAircraftLine(a1),
      formatAircraftLine(a2),
      '',
      getClockLine()
    ];
  }

  function makeRowColors(lineLen, segments) {
    const colors = new Array(lineLen).fill(null);
    for (const seg of segments) {
      for (let i = seg.start; i < seg.start + seg.length && i < colors.length; i++) {
        colors[i] = seg.color;
      }
    }
    return colors;
  }

  function generateColorGrid(data) {
    if (!data || data.mode === 'message') return null;

    const a1 = data.aircraft[0];
    const a2 = data.aircraft[1];
    const line3 = formatAircraftLine(a1);
    const line4 = formatAircraftLine(a2);
    const titleText = 'FLEET STATUS BOARD';
    const headerText = 'REG    STAT  ETD   ETA';
    const clockText = getClockLine();

    return [
      new Array(titleText.length).fill(BOARD_COLORS.TITLE),
      [],
      new Array(headerText.length).fill(BOARD_COLORS.HEADER),
      makeRowColors(line3.length, [{ start: 7, length: 5, color: STATUS_COLORS[a1.status] || null }]),
      makeRowColors(line4.length, [{ start: 7, length: 5, color: STATUS_COLORS[a2.status] || null }]),
      [],
      new Array(clockText.length).fill(BOARD_COLORS.CLOCK)
    ];
  }

  function updateBoard() {
    if (!currentData || board.isTransitioning) return;
    const lines = generateLines(currentData);
    if (!lines) return;
    const colors = generateColorGrid(currentData);

    const key = JSON.stringify({ lines, colors });
    if (key !== lastRenderedKey) {
      lastRenderedKey = key;
      board.displayMessage(lines, colors);
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

  fetchStatus();

  setInterval(() => {
    if (!board.isTransitioning) {
      fetchStatus();
    }
  }, POLL_INTERVAL);

  // Update clock + countdown every 10s
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

  // --- Keyboard shortcuts ---

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
