const { runZoneClustering } = require('../services/clustering.service');

exports.triggerClustering = async (req, res) => {
  try {
    const thresholdKm = req.body.thresholdKm ? Number(req.body.thresholdKm) : 3.0;
    const result = await runZoneClustering(thresholdKm);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
