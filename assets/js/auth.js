// auth.js (KOD LENGKAP & DIKEMASKINI)

import { auth, db } from './config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM
const loginForm = document.getElementById('loginForm');
const errorDiv = document.getElementById('error');
const logoutBtn = document.getElementById('logoutBtn');
// Elemen ini digunakan dalam setupDashboardUI, tetapi logik utama kini di router.js
const userNameEl = document.getElementById('userName');
const welcomeEl = document.getElementById('welcome');


// Helper: Mengalih ke dashboard jika sudah log masuk (Hanya digunakan di index.html)
function redirectIfLoggedIn() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // KRITIKAL: Simpan Role dan Nama ke localStorage
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userName', userData.name); // <<< DISIMPAN DI SINI

        // HANYA alih ke dashboard.html jika pengguna berada di index.html
        if (window.location.pathname.endsWith('index.html') || loginForm) { 
          window.location.href = 'dashboard.html';
          return; 
        }

      } else {
        alert('Akaun tidak sah. Sila hubungi pentadbir.');
        signOut(auth);
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
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Setelah log masuk berjaya, lakukan fetching role dan pengalihan:
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // KRITIKAL: Simpan role dan nama ke localStorage
          localStorage.setItem('userRole', userData.role);
          localStorage.setItem('userName', userData.name); // <<< DISIMPAN DI SINI
          
          window.location.href = 'dashboard.html'; // Alih ke dashboard
      } else {
          alert('Data peranan pengguna tidak dijumpai. Sila hubungi pentadbir.');
          await signOut(auth);
      }

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
