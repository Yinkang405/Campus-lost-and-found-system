const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const logger = require('./utils/simpleLogger');

dotenv.config();
const db = require('./config/database');
const User = require('./models/User');
const itemRoutes = require('./routes/items');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// ============================================
// SECURITY MIDDLEWARE - FIXED CSP
// ============================================
// TEMPORARILY DISABLED FOR DEBUGGING
// app.use(helmet());
// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'your-domain.com' : '*',
    optionsSuccessStatus: 200
}));

// ============================================
// SESSION & PASSPORT CONFIGURATION
// ============================================
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findByEmail(username) || await User.findByUsername(username);
            if (!user) return done(null, false, { message: 'Incorrect username or email.' });
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) return done(null, false, { message: 'Incorrect password.' });
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// ============================================
// GENERAL MIDDLEWARE
// ============================================
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// STATIC FILE SERVING - FIXED
// ============================================
app.use(express.static(path.join(__dirname, 'docs'), { 
    maxAge: '1d', 
    etag: true,
    setHeaders: (res, filePath) => {
        // Ensure CSS and JS files load with proper CORS headers
        if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        }
    }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// DATABASE CONNECTION TEST
// ============================================
db.getConnection()
    .then(connection => {
        logger.dbConnected();
        connection.release();
    })
    .catch(err => logger.error('Database connection failed'));

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes.router);
app.use('/api/items', itemRoutes);

// ============================================
// PAGE ROUTES
// ============================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'docs', 'index.html')));
app.get('/add-item', (req, res) => res.sendFile(path.join(__dirname, 'docs', 'add-item.html')));
app.get('/item/:id', (req, res) => res.sendFile(path.join(__dirname, 'docs', 'item-detail.html')));
app.get('/auth', (req, res) => res.sendFile(path.join(__dirname, 'docs', 'auth.html')));

// 404 handler
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'docs', '404.html')));

// Error handling
app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    });
});

// Start server - LISTEN ON ALL INTERFACES
app.listen(PORT, '0.0.0.0', () => {
    logger.serverStart(PORT);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://192.168.1.9:${PORT}`);
});