const Zone = require('../models/Zone');

exports.createZone = async (req, res) => {
  try {
    const zone = new Zone(req.body);
    await zone.save();
    res.status(201).json(zone);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getZones = async (req, res) => {
  try {
    const zones = await Zone.find();
    res.status(200).json(zones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
