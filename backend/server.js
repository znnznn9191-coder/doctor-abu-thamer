const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const storage = require('./services/storage');

const app = express();
const frontendPath = path.join(__dirname, '..', 'frontend');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/researchRoutes'));
app.use('/api', require('./routes/sectionRoutes'));
app.use('/api', require('./routes/sourceRoutes'));
app.use('/api', require('./routes/reviewRoutes'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Research platform backend is running.',
    timestamp: new Date().toISOString()
  });
});

app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

storage.initializeDatabase();

app.listen(config.PORT, () => {
  console.log(`Research platform running at http://localhost:${config.PORT}`);
});
