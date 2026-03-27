const { getBoardState, setBoardState } = require('../lib/storage');
const { formatBoardLines } = require('../lib/format');
const { validateAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'PUT') {
    // Set custom message
    if (!validateAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body || {};
    const state = await getBoardState();

    if (body.lines && Array.isArray(body.lines)) {
      state.mode = 'message';
      state.customLines = body.lines.map(l => String(l || '').substring(0, 28)).slice(0, 5);
    }

    const updated = await setBoardState(state);
    const lines = formatBoardLines(updated);

    return res.status(200).json({
      mode: updated.mode,
      customLines: updated.customLines,
      lines,
      lastUpdated: updated.lastUpdated
    });
  }

  if (req.method === 'DELETE') {
    // Clear custom message, switch back to aircraft mode
    if (!validateAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const state = await getBoardState();
    state.mode = 'aircraft';
    state.customLines = [];

    const updated = await setBoardState(state);
    const lines = formatBoardLines(updated);

    return res.status(200).json({
      mode: updated.mode,
      aircraft: updated.aircraft,
      lines,
      lastUpdated: updated.lastUpdated
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
