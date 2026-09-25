const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const storage = require('./services/storage');
const asyncHandler = require('./routes/asyncHandler');

const app = express();
const frontendPath = config.FRONTEND_PATH;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api', require('./routes/researchRoutes'));
app.use('/api', require('./routes/sectionRoutes'));
app.use('/api', require('./routes/sourceRoutes'));
app.use('/api', require('./routes/reviewRoutes'));

app.get('/api/health', asyncHandler(async (req, res) => {
  await storage.countResearches();
  res.json({
    success: true,
    message: 'Research platform backend is running.',
    timestamp: new Date().toISOString()
  });
}));

app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'المسار المطلوب غير موجود.' });
});

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((error, req, res, next) => {
  console.error('Request failed:', error.message);
  if (res.headersSent) return next(error);
  const status = error.status && error.status < 500 ? error.status : 500;
  return res.status(status).json({
    success: false,
    message: status === 413 ? 'حجم الطلب أكبر من الحد المسموح.' : 'تعذر إكمال الطلب حالياً.'
  });
});

async function startServer() {
  await storage.initializeDatabase();
  if (process.env.DATABASE_URL) {
    await require('./services/production_seed').seedIfMissing();
  }

  return new Promise((resolve, reject) => {
    const server = app.listen(config.PORT, '0.0.0.0', () => {
      console.log(`Research platform listening on port ${config.PORT}`);
      resolve(server);
    });
    server.once('error', reject);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
