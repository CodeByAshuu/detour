const {
  rehydrateSLAWindow,
  getSLAStats,
  getSLABreaches,
} = require('../services/sla.service');

/**
 * GET /api/core/sla/stats
 * Returns rolling average delivery duration and breach rate for the active window.
 */
exports.getStats = async (req, res) => {
  try {
    // Optional ?rehydrate=true query param to force a fresh DB read
    if (req.query.rehydrate === 'true') {
      const windowSize = req.query.windowSize ? Number(req.query.windowSize) : 50;
      const stats = await rehydrateSLAWindow(windowSize);
      return res.status(200).json({ rehydrated: true, ...stats });
    }

    res.status(200).json(getSLAStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/core/sla/breaches
 * Returns the list of breach events currently inside the sliding window.
 */
exports.getBreaches = async (req, res) => {
  try {
    const breaches = getSLABreaches();
    res.status(200).json({ count: breaches.length, breaches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
