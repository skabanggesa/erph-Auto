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

// Helper: Redirect
function redirectIfLoggedIn() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userName', userData.name);
        window.location.href = 'dashboard.html';
      } else {
        alert('Akaun tidak sah. Sila hubungi pentadbir.');
        signOut(auth);
      }
    }
    // Jika di index.html dan belum login, biarkan
    if (window.location.pathname.endsWith('dashboard.html') && !user) {
      window.location.href = 'index.html';
    }
  });
}

// Login
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    errorDiv.textContent = '';

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect akan dikendali oleh onAuthStateChanged
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

// Setup dashboard UI selepas login
function setupDashboardUI() {
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

// Panggil bila di dashboard atau index (telah diubah suai)
if (window.location.pathname.endsWith('dashboard.html')) {
  redirectIfLoggedIn();
  setupDashboardUI();
} else if (loginForm) { // <--- PERUBAHAN DI SINI (Semak kewujudan borang)
  // Hanya redirect jika dah login
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = 'dashboard.html';
    }
  });
}
