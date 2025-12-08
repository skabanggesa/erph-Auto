// Import dari config.js
import { auth, db } from './config.js';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements
const loginForm = document.getElementById('loginForm');
const errorDiv = document.getElementById('error');
const logoutBtn = document.getElementById('logoutBtn');
const navbar = document.getElementById('navbar');
const userNameEl = document.getElementById('userName');
const welcomeEl = document.getElementById('welcome');

// ===========================================
// FUNGSI: Redirect berdasarkan status auth
// ===========================================
function redirectIfLoggedIn() {
  onAuthStateChanged(auth, async (user) => {
    const isOnLogin = window.location.pathname.includes('index.html');
    const isOnDashboard = window.location.pathname.includes('dashboard.html');

    if (user) {
      // Dapatkan data pengguna dari Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userName', userData.name);
        
        // Hanya redirect ke dashboard jika masih di halaman login
        if (isOnLogin) {
          window.location.href = 'dashboard.html';
        }
      } else {
        // Akaun wujud di Firebase Auth tapi tiada rekod di Firestore → tidak sah
        console.warn('Akaun tanpa rekod pengguna:', user.uid);
        await signOut(auth);
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        if (!isOnLogin) {
          window.location.href = 'index.html';
        }
      }
    } else {
      // Tiada pengguna log masuk
      if (isOnDashboard) {
        window.location.href = 'index.html';
      }
    }
  });
}

// ===========================================
// LOG MASUK
// ===========================================
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (errorDiv) errorDiv.textContent = '';

    if (!email || !password) {
      if (errorDiv) errorDiv.textContent = 'Sila isi emel dan kata laluan.';
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect akan dikendalikan oleh onAuthStateChanged
    } catch (err) {
      let msg = 'Ralat log masuk.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        msg = 'Emel atau kata laluan salah.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Terlalu banyak percubaan. Cuba sebentar lagi.';
      }
      if (errorDiv) errorDiv.textContent = msg;
    }
  });
}

// ===========================================
// LOG KELUAR
// ===========================================
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = 'index.html';
  });
}

// ===========================================
// SETUP UI DASHBOARD
// ===========================================
function setupDashboardUI() {
  const role = localStorage.getItem('userRole');
  const name = localStorage.getItem('userName');

  if (navbar && name) {
    userNameEl.textContent = name;
    
    // Warna mengikut role
    if (role === 'admin') {
      welcomeEl.style.color = '#d32f2f';
    } else {
      welcomeEl.style.color = '#1976d2';
    }
    navbar.style.display = 'flex';
  }
}

// ===========================================
// INISIALISASI
// ===========================================
// Hanya jalankan logik auth jika berada di index.html atau dashboard.html
if (window.location.pathname.includes('index.html') || window.location.pathname.includes('dashboard.html')) {
  redirectIfLoggedIn();
  
  // Jika di dashboard, setup UI selepas DOM ready
  if (window.location.pathname.includes('dashboard.html')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupDashboardUI);
    } else {
      setupDashboardUI();
    }
  }
}
