// =======================================================
// FIREBASE CONFIGURATION & INITIALIZATION (app.js)
// =======================================================

// GANTIKAN DENGAN NILAI KONFIGURASI FIREBASE ANDA YANG SEBENAR
const firebaseConfig = {
    apiKey: "AIzaSyAo-FyVocjOa8rD-ALoTeDdkJCqDyvQSt0", // Gantikan ini
    authDomain: "erph-auto.firebaseapp.com",
    projectId: "erph-auto",
    storageBucket: "erph-auto.firebasestorage.app",
    messagingSenderId: "28301521058",
    appId: "1:28301521058:web:47cd64e3cf098e2cb067fb",
    measurementId: "G-NV65Z5R7JH"
};

// Global Firebase Instance Variables
let app;
let auth;
let db;

/**
 * [FUNGSI WAJIB] initFirebase()
 * Menginisialisasikan aplikasi Firebase dan SDK.
 */
function initFirebase() {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
    auth = firebase.auth();
    db = firebase.firestore();
    
    // Panggil fungsi semak status pengesahan setelah inisialisasi
    checkAuthStatus();
}

/**
 * [FUNGSI WAJIB] checkAuthStatus()
 * Menyemak status log masuk semasa dan mengarahkan pengguna.
 */
function checkAuthStatus() {
    auth.onAuthStateChanged(user => {
        const currentPath = window.location.pathname;
        
        if (user) {
            // Pengguna Log Masuk
            getUserRole(user.uid).then(role => {
                const targetPage = role === 'admin' ? '/admin_semak.html' : '/guru_rph.html';

                if (currentPath.includes('index.html') || currentPath === '/') {
                    window.location.href = targetPage;
                }
                
                // Set nama pengguna pada header (jika elemen wujud)
                const userNameElement = document.getElementById('user-name');
                if (userNameElement) {
                    // Ambil nama dari Firestore untuk paparan
                    db.collection('users').doc(user.uid).get().then(doc => {
                        if (doc.exists) {
                            userNameElement.textContent = doc.data().name || 'Pengguna';
                        }
                    });
                }
                
            }).catch(error => {
                console.error("Gagal mendapatkan peranan pengguna:", error);
                logoutUser();
            });

        } else {
            // Pengguna Log Keluar
            if (!currentPath.includes('index.html') && currentPath !== '/') {
                window.location.href = 'index.html';
            }
        }
    });
}

// Inisialisasi Firebase apabila DOM telah dimuat
document.addEventListener('DOMContentLoaded', () => {
    initFirebase();
});
