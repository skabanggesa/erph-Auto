// auth.js (KOD LENGKAP & DIKEMASKINI)

import { auth, db } from './config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM
const loginForm = document.getElementById('loginForm');
const errorDiv = document.getElementById('error');
const logoutBtn = document.getElementById('logoutBtn');
const navbar = document.getElementById('navbar');
const userNameEl = document.getElementById('userName');
const welcomeEl = document.getElementById('welcome');


// Helper: Mengalih ke dashboard jika sudah log masuk
function redirectIfLoggedIn() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Dapatkan data pengguna dari Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Simpan Role dan Nama ke localStorage (Cache)
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userName', userData.name);

        // HANYA alih ke dashboard.html jika pengguna berada di index.html
        if (window.location.pathname.endsWith('index.html') || loginForm) { 
          window.location.href = 'dashboard.html';
          return; // Hentikan fungsi
        }
        
        // Setup UI jika berada di dashboard.html (Perlu dipanggil di sini jika ini dieksekusi)
        if (window.location.pathname.includes('dashboard.html')) {
             setupDashboardUI();
        }

      } else {
        alert('Akaun tidak sah. Sila hubungi pentadbir.');
        signOut(auth);
      }
    } else {
        // Setup UI hanya jika logout
        if (window.location.pathname.includes('dashboard.html')) {
            // Sesi tamat. router.js akan mengambil alih dan memaparkan mesej "Sesi tamat"
        } else {
            // Di index.html, tiada tindakan.
        }
    }
  });
}

// Hanya jalankan semakan log masuk jika berada di index.html
if (loginForm) {
    redirectIfLoggedIn();
}


// Login Handler
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // onAuthStateChanged akan mengendalikan fetching role dan pengalihan ke dashboard.html

    } catch (err) {
      let msg = 'Ralat log masuk.';
      if (err.code === 'auth/invalid-credential') {
        msg = 'Emel atau kata laluan salah.';
      }
      errorDiv.textContent = msg;
    }
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = 'index.html';
  });
}

// Setup dashboard UI selepas login (dipanggil oleh router.js jika diperlukan)
export function setupDashboardUI() { // <<< PENTING: Eksport fungsi ini jika modul lain menggunakannya
  if (navbar) {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    
    if (name) userNameEl.textContent = name;
    
    // Tukar warna mengikut role
    if (role === 'admin') {
      welcomeEl.style.color = '#d32f2f';
    } else {
      welcomeEl.style.color = '#1976d2';
    }
    navbar.style.display = 'flex';
    navbar.style.justifyContent = 'space-between';
    navbar.style.padding = '15px';
    navbar.style.background = '#f5f5f5';
  }
}
