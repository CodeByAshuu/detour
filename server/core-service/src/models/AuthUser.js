const mongoose = require('mongoose');

// Auth and core services share the configured MongoDB database. This read-only
// model lets core provision the operational Agent record that corresponds to an
// authenticated account without duplicating credentials in the core service.
const authUserSchema = new mongoose.Schema({
  role: { type: String, required: true },
}, { collection: 'users' });

module.exports = mongoose.models.AuthUser || mongoose.model('AuthUser', authUserSchema);
