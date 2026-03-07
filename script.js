const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let rooms = { 'KLS01': [] };

io.on('connection', (socket) => {
    console.log('⚡ Terhubung: ' + socket.id);

    socket.on('join_room', (data) => {
        socket.join(data.roomCode);
        const siswaBaru = {
            socketId: socket.id,
            nama: data.nama || "Siswa",
            roomCode: data.roomCode,
            isAnswering: false
        };
        if (!rooms[data.roomCode]) rooms[data.roomCode] = [];
        rooms[data.roomCode] = rooms[data.roomCode].filter(s => s.socketId !== socket.id);
        rooms[code = data.roomCode];
        rooms[code].push(siswaBaru);
        
        io.to(data.roomCode).emit('update_meja', rooms[data.roomCode]);
        io.emit('update_semua_meja', rooms);
    });

    socket.on('admin_kirim_soal', (data) => {
        let teksSoal = data.tipe === 'otomatis' ? "Berapa hasil dari 15 + 25?" : data.teks;
        
        // Reset status menjawab semua siswa
        for (let code in rooms) {
            rooms[code].forEach(s => s.isAnswering = false);
        }

        io.emit('terima_soal_online', { pertanyaan: teksSoal });
        io.emit('update_semua_meja', rooms);
        io.emit('notif_admin_khusus', {
            nama: "SISTEM",
            teks: "📢 Soal Terkirim: " + teksSoal,
            socketId: "system"
        });
    });

    socket.on('siswa_menjawab', (data) => {
        const room = rooms[data.roomCode || 'KLS01'];
        if (room) {
            const siswa = room.find(s => s.socketId === socket.id);
            if (siswa) {
                siswa.isAnswering = true;
                io.emit('notif_admin_khusus', {
                    nama: siswa.nama,
                    roomCode: data.roomCode,
                    teks: "🙋 Saya ingin menjawab!",
                    socketId: socket.id
                });
                io.to(data.roomCode).emit('update_meja', room);
                io.emit('update_semua_meja', rooms);
            }
        }
    });

    socket.on('guru_beri_izin', (data) => {
        io.to(data.targetId).emit('pesan_dari_guru', { pesan: data.pesan });
    });

    socket.on('disconnect', () => {
        for (let code in rooms) {
            rooms[code] = rooms[code].filter(s => s.socketId !== socket.id);
            io.to(code).emit('update_meja', rooms[code]);
        }
        io.emit('update_semua_meja', rooms);
    });
});

http.listen(3000, '0.0.0.0', () => {
    console.log(`SERVER AKTIF DI PORT 3000`);
});