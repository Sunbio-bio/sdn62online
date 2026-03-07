// Konfigurasi Login Guru sesuai permintaan
const DATA_GURU = {
    username: "sd.negeri62tajong",
    password: "sekolahku62#"
};

// 1. Fungsi Login Guru
function loginGuru() {
    const userIn = document.getElementById('userGuru').value;
    const passIn = document.getElementById('passGuru').value;

    if (userIn === DATA_GURU.username && passIn === DATA_GURU.password) {
        alert("✅ Login Guru Berhasil! Selamat Datang.");
        window.location.href = "index.html"; // Pastikan file index.html ada
    } else {
        alert("❌ Username atau Password Guru Salah!");
    }
}

// 2. Fungsi Registrasi Siswa (Disimpan di Memori Browser)
function showRegister() {
    document.getElementById('regModal').style.display = 'flex';
}

function closeRegister() {
    document.getElementById('regModal').style.display = 'none';
}

function simpanRegistrasi() {
    const userBaru = document.getElementById('regUser').value;
    const passBaru = document.getElementById('regPass').value;

    if (userBaru && passBaru) {
        localStorage.setItem('siswa_user', userBaru);
        localStorage.setItem('siswa_pass', passBaru);
        alert("✨ Registrasi Berhasil! Silakan Login menggunakan akun tersebut.");
        closeRegister();
    } else {
        alert("⚠️ Mohon isi Username dan Password!");
    }
}

// 3. Fungsi Login Siswa
function loginSiswa() {
    const userIn = document.getElementById('userSiswa').value;
    const passIn = document.getElementById('passSiswa').value;

    const savedUser = localStorage.getItem('siswa_user');
    const savedPass = localStorage.getItem('siswa_pass');

    if (userIn === savedUser && passIn === savedPass && savedUser !== null) {
        alert("✅ Login Siswa Berhasil! Selamat Belajar.");
        window.location.href = "index.html";
    } else {
        alert("❌ Akun tidak ditemukan! Silakan Registrasi dulu.");
    }
}

// Menutup modal jika klik di luar kotak
window.onclick = function(event) {
    const modal = document.getElementById('regModal');
    if (event.target == modal) {
        closeRegister();
    }
}