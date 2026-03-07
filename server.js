const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Mengarahkan ke folder 'public' untuk file HTML, CSS, dan JS
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE SEDERHANA DI MEMORI SERVER ---
let dataSiswaTerdaftar = []; 
let rooms = {};
let jadwalKebersihanMaster = {}; 

io.on('connection', (socket) => {
    console.log('User Terhubung: ' + socket.id);

    // --- 1. LOGIN & JOIN ROOM ---
    socket.on('join_room', (data) => {
        const { nama, roomCode } = data;
        socket.join(roomCode);
        
        // Logika Pendaftaran Siswa (Database Sementara)
        const cekSiswa = dataSiswaTerdaftar.find(s => s.nama === nama);
        if (!cekSiswa) {
            dataSiswaTerdaftar.push({
                nama: nama,
                roomCode: roomCode,
                waktu: new Date().toLocaleTimeString(),
                socketId: socket.id
            });
            console.log(`✅ Siswa Terdaftar: ${nama}`);
        } else {
            // Update socketId jika siswa login ulang
            cekSiswa.socketId = socket.id;
        }

        // --- UPDATE MEJA INTERAKTIF (RADAR) ---
        if (!rooms[roomCode]) rooms[roomCode] = [];
        
        // Hapus data lama (jika ada) agar tidak duplikat di radar
        rooms[roomCode] = rooms[roomCode].filter(s => s.nama !== nama);
        
        // Tambahkan siswa ke radar meja
        rooms[roomCode].push({ 
            socketId: socket.id, 
            nama: nama, 
            isAnswering: false 
        });
        
        // Kirim update ke SEMUA (Dashboard Admin & Siswa)
        io.emit('update_semua_meja', rooms);
        io.emit('update_list_admin', dataSiswaTerdaftar); 
        
        // PENTING: Siswa yang baru masuk langsung mendapatkan data jadwal piket terbaru
        socket.emit('sinkron_jadwal_awal', jadwalKebersihanMaster);
    });

    // --- 2. SINKRONISASI JADWAL PIKET (REAL-TIME) ---
    socket.on('update_jadwal_piket', (dataJadwal) => {
        // Simpan ke memori server (dataJadwal berisi { hari: 'Senin', siswa: 'Budi, Ani' })
        jadwalKebersihanMaster[dataJadwal.hari] = dataJadwal.siswa;
        
        // Broadcast ke semua perangkat (Guru & Siswa)
        io.emit('terima_jadwal_baru', dataJadwal);
        console.log(`📡 Broadcast: Jadwal hari ${dataJadwal.hari} diperbarui.`);
    });

    // --- 3. KELAS DIGITAL (MATERI & TUGAS) ---
    socket.on('kirim_materi', (dataMateri) => {
        // Kirim materi hanya ke kelas (room) tertentu
        io.to(dataMateri.roomCode).emit('materi_baru', dataMateri);
        console.log(`📚 Materi dikirim ke Room: ${dataMateri.roomCode}`);
    });

    // --- 4. DATA UNTUK DASHBOARD ADMIN ---
    socket.on('get_admin_data', () => {
        socket.emit('update_list_admin', dataSiswaTerdaftar);
    });

    // --- 5. LOGIKA DISCONNECT (SISWA KELUAR) ---
    socket.on('disconnect', () => {
        // Hapus siswa dari radar meja saat koneksi terputus
        for (let code in rooms) {
            rooms[code] = rooms[code].filter(s => s.socketId !== socket.id);
        }
        
        // Update radar meja di sisi guru
        io.emit('update_semua_meja', rooms);
        console.log('❌ User Terputus: ' + socket.id);
    });
});

// --- MENJALANKAN SERVER ---
const PORT = 3000;
// Menggunakan '0.0.0.0' agar bisa diakses HP siswa lewat WiFi yang sama
http.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =============================================
    ✅ SERVER SDN 62 TAJONG AKTIF!
    PORT: ${PORT}
    ---------------------------------------------
    Akses Guru  : http://localhost:${PORT}/index.html
    Akses Siswa : Gunakan IP Laptop Bapak/Ibu
    Contoh      : http://192.168.1.5:${PORT}/login.html
    =============================================
    `);
});