const express = require('express');
const cors = require('cors');

const runsRoutes = require('./routes/runs.routes');
const eventsRoutes = require('./routes/events.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        service: 'tfg_ldm'
    });
});

app.use('/api/runs', runsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/stats', statsRoutes);

app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada'
    });
});

app.use((error, req, res, next) => {
    console.error(error);

    res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor'
    });
});

module.exports = app;