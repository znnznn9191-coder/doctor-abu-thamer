const path = require('path');

module.exports = {
  PORT: process.env.PORT || 3000,
  DB_PATH: path.join(__dirname, 'db', 'research.db'),
  FRONTEND_PATH: path.join(__dirname, '..', 'frontend'),
  DEFAULT_PROVIDER: process.env.DEFAULT_PROVIDER || 'local'
};
