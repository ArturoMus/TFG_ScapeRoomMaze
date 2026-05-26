require('dotenv').config();

const http = require('http');
const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = Number(process.env.PORT || 3000);

const server = http.createServer(app);

// Este codigo me servirá si en un futuro implemento los websockets --> Socketio
//
// const { Server } = require('socket.io');
// const io = new Server(server, {
//     cors: {
//         origin: '*'
//     }
// });
//
// io.on('connection', socket => {
//     console.log('Cliente conectado:', socket.id);
// });

server.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
});