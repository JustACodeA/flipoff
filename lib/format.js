function pad(str, len) {
  return (str || '').substring(0, len).padEnd(len, ' ');
}

function formatAircraftLine(ac) {
  const reg = pad(ac.registration, 6);
  const sts = pad(ac.status, 5);
  const etd = ac.etd ? pad(ac.etd, 5) : '  -  ';
  const eta = ac.eta ? pad(ac.eta, 5) : '  -  ';
  return `${reg} ${sts} ${etd} ${eta}`;
}

function formatBoardLines(state) {
  // Custom message mode
  if (state.mode === 'message' && state.customLines && state.customLines.length > 0) {
    const lines = [];
    for (let i = 0; i < 5; i++) {
      lines.push(state.customLines[i] || '');
    }
    return lines;
  }

  // Aircraft mode — one line per aircraft, 24 chars each
  const a1 = state.aircraft[0];
  const a2 = state.aircraft[1];

  return [
    'FLEET STATUS BOARD',             // row 0: title
    'REG    STAT  ETD   ETA',         // row 1: headers
    formatAircraftLine(a1),            // row 2: aircraft 1
    formatAircraftLine(a2),            // row 3: aircraft 2
    ''                                 // row 4: clock
  ];
}

module.exports = { formatBoardLines };
