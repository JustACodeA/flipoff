const { getBoardState, setBoardState } = require('../../lib/storage');
const { formatBoardLines } = require('../../lib/format');
const { validateAuth } = require('../../lib/auth');

const VALID_STATUSES = ['READY', 'FLUG', 'SERVICE', 'MAINT', 'PARKED'];

module.exports = async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!validateAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const index = parseInt(id, 10) - 1;

  if (index !== 0 && index !== 1) {
    return res.status(400).json({ error: 'Invalid aircraft id. Use 1 or 2.' });
  }

  const body = req.body || {};
  const state = await getBoardState();
  const aircraft = state.aircraft[index];

  // Merge partial update
  if (body.registration !== undefined) {
    aircraft.registration = String(body.registration).toUpperCase().substring(0, 8);
  }
  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase();
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Valid: ${VALID_STATUSES.join(', ')}`
      });
    }
    aircraft.status = status;
  }
  if (body.etd !== undefined) {
    aircraft.etd = String(body.etd).substring(0, 5);
  }
  if (body.eta !== undefined) {
    aircraft.eta = String(body.eta).substring(0, 5);
  }
  if (body.duration !== undefined) {
    aircraft.duration = parseInt(body.duration, 10) || 0;
  }

  const updated = await setBoardState(state);
  const lines = formatBoardLines(updated);

  return res.status(200).json({
    aircraft: updated.aircraft,
    lines,
    lastUpdated: updated.lastUpdated
  });
};
