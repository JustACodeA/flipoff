const { getBoardState } = require('../lib/storage');
const { formatBoardLines } = require('../lib/format');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const state = await getBoardState();
  const lines = formatBoardLines(state);

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    mode: state.mode,
    aircraft: state.aircraft,
    customLines: state.customLines,
    lines,
    lastUpdated: state.lastUpdated
  });
};
