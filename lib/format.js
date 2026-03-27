const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function pad(str, len) {
  return (str || '').substring(0, len).padEnd(len, ' ');
}

function formatBoardLines(state) {
  const a1 = state.aircraft[0];
  const a2 = state.aircraft[1];

  const now = new Date(state.lastUpdated);
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  const day = now.getUTCDate();
  const month = MONTHS[now.getUTCMonth()];

  // Row 2: aircraft 1 reg + status (left-aligned reg, right-aligned status)
  const row2 = `${pad(a1.registration, 8)}${pad(a1.status, 16).padStart(16)}`;
  // Row 3: aircraft 1 times
  const row3 = a1.etd || a1.eta
    ? `ETD ${pad(a1.etd || '--:--', 5)}   ETA ${pad(a1.eta || '--:--', 5)}`
    : '';
  // Row 4: aircraft 2 reg + status
  const row4 = `${pad(a2.registration, 8)}${pad(a2.status, 16).padStart(16)}`;
  // Row 5: aircraft 2 times
  const row5 = a2.etd || a2.eta
    ? `ETD ${pad(a2.etd || '--:--', 5)}   ETA ${pad(a2.eta || '--:--', 5)}`
    : '';

  return [
    'FLEET STATUS BOARD',        // row 0: title
    '',                           // row 1: separator
    row2,                         // row 2: aircraft 1 info
    row3,                         // row 3: aircraft 1 times
    row4,                         // row 4: aircraft 2 info
    row5,                         // row 5: aircraft 2 times
    `UPDATED ${hh}:${mm} ${day} ${month}` // row 6: timestamp
  ];
}

module.exports = { formatBoardLines };
