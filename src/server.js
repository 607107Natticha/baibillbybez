require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const documentRoutes = require('./routes/documentRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — รองรับ frontend ที่ 5174 (หลัก) และ 5173
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : ['http://localhost:5174', 'http://localhost:5173'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, origin || allowedOrigins[0]);
    else cb(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Dev-only: root message (production serves SPA from client/dist at /)
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.send('Sabaibill API is running...');
  });
}

// API Routes
app.use('/api', authRoutes);
app.use('/api', settingsRoutes);
app.use('/api', documentRoutes);
app.use('/api', customerRoutes);
app.use('/api', productRoutes);
app.get('/api/search', require('./controllers/documentController').searchMasterData);

// Production: serve frontend build (single-host deploy)
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => { if (err) next(err); });
  });
}

// Start Server — ถ้าพอร์ตถูกใช้อยู่ (EADDRINUSE) จะลองพอร์ตถัดไป
const MAX_PORT_ATTEMPTS = 5;
function tryListen(port, attempt) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
    const configuredPort = Number(process.env.PORT) || 3001;
    if (port !== configuredPort) {
      console.log(`   (พอร์ต ${configuredPort} ถูกใช้อยู่ — ตั้ง VITE_API_URL=http://localhost:${port} ใน client ถ้า frontend ต่อไม่ถึง)`);
    }
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
      tryListen(port + 1, attempt + 1);
    } else {
      console.error('Cannot start server:', err.message);
      process.exit(1);
    }
  });
}
tryListen(Number(PORT), 0);