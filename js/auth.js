// =======================================================
// AUTHENTICATION LOGIC (js/auth.js)
// Fail ini bergantung pada objek global: auth, db, showNotification
// yang didefinisikan dalam js/app.js dan js/ui_utils.js
// =======================================================

// --- PENTING ---
// Kita akan menggunakan listener ini dalam js/app.js untuk memastikan 
// ia dipanggil hanya selepas initFirebase() selesai.
// Nota: Fungsi ini telah disalin dari app.js ke sini untuk modulariti yang lebih baik, 
// tetapi ia masih bergantung pada auth yang ditetapkan dalam app.js.

/**
 * [FUNGSI WAJIB] checkAuthStatus()
 * Menyemak status log masuk semasa dan mengarahkan pengguna.
 */
function checkAuthStatus() {
    // Pastikan objek 'auth' wujud sebelum memanggil methodnya
    if (!auth) {
        console.error("Firebase Auth belum diinisialisasi.");
        // Cuba tunda sebentar jika ia gagal, bergantung pada implementasi app.js
        setTimeout(checkAuthStatus, 500); 
        return;
    }

    auth.onAuthStateChanged(user => {
        const currentPath = window.location.pathname;
        
        if (user) {
            // Pengguna Log Masuk
            getUserRole(user.uid).then(role => {
                // Tentukan fail pengalihan berdasarkan peranan (role)
                const targetPage = role === 'admin' ? 'admin_semak.html' : 'guru_rph.html';

                // Cegah gelung pengalihan jika pengguna sudah di halaman yang betul
                if (!currentPath.includes(targetPage)) {
                    // Gunakan pengalihan yang lebih mesra pelayan tempatan (local server) / GitHub Pages
                    window.location.href = targetPage; 
                }
                
                // Muatkan nama pengguna (diuruskan dalam app.js)
                if (document.getElementById('user-name')) {
                    db.collection('users').doc(user.uid).get().then(doc => {
                        if (doc.exists) {
                            document.getElementById('user-name').textContent = doc.data().name || 'Pengguna';
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


/**
 * [FUNGSI WAJIB] registerUser(email, password, name)
 * Mendaftar pengguna baru di Auth dan menetapkan 'role: guru' di Firestore.
 */
function registerUser(email, password, name) {
    if (!auth || !db) return showNotification("Sistem belum sedia. Sila cuba sebentar lagi.", 'error');

    return auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userUID = user.uid; 

            // Simpan rekod peranan ke Firestore
            return db.collection('users').doc(userUID).set({
                email: email,
                name: name,
                role: 'guru', // Tetapkan peranan 'guru' secara automatik
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            showNotification("Pendaftaran berjaya. Sila log masuk.", 'success');
            // Log keluar pengguna yang baru mendaftar
            return auth.signOut(); 
        })
        .catch((error) => {
            showNotification(`Ralat Pendaftaran: ${error.message}`, 'error');
            console.error(error);
        });
}

/**
 * [FUNGSI WAJIB] loginUser(email, password)
 * Menguruskan proses log masuk.
 */
function loginUser(email, password) {
    if (!auth) return showNotification("Sistem belum sedia. Sila cuba sebentar lagi.", 'error');

    return auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showNotification("Log Masuk berjaya.", 'success');
            // checkAuthStatus() akan menguruskan pengalihan
        })
        .catch((error) => {
            showNotification(`Ralat Log Masuk: ${error.message}`, 'error');
            console.error(error);
        });
}

/**
 * [FUNGSI WAJIB] logoutUser()
 * Menguruskan proses log keluar.
 */
function logoutUser() {
    if (!auth) return;
    auth.signOut()
        .then(() => {
            showNotification("Anda telah log keluar.", 'success');
        })
        .catch((error) => {
            showNotification(`Ralat Log Keluar: ${error.message}`, 'error');
            console.error(error);
        });
}

/**
 * [FUNGSI WAJIB] getUserRole(userUID)
 * Mengambil peranan pengguna dari koleksi /users.
 */
function getUserRole(userUID) {
    if (!db) return Promise.resolve(null);
    return db.collection('users').doc(userUID).get()
        .then(doc => {
            if (doc.exists) {
                return doc.data().role;
            } else {
                return 'unauthorized'; 
            }
        });
}

/**
 * [FUNGSI WAJIB] sendPasswordReset(email)
 * Menghantar e-mel penetapan semula kata laluan.
 */
function sendPasswordReset(email) {
    if (!auth) return;
    return auth.sendPasswordResetEmail(email)
        .then(() => {
            showNotification("Pautan penetapan semula kata laluan telah dihantar ke e-mel anda.", 'success');
        })
        .catch((error) => {
            showNotification(`Ralat: ${error.message}`, 'error');
        });
}

// Tambah event listener untuk borang log masuk/daftar dalam index.html
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn') || document.getElementById('logout-btn-admin');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            loginUser(email, password);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            registerUser(email, password, name);
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
    
    // Panggil checkAuthStatus() selepas DOM dimuat untuk menguruskan pengalihan
    // Fungsi ini akan menunggu sehingga 'auth' diinisialisasi oleh app.js
    checkAuthStatus();
});
