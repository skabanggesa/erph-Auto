// assets/js/router.js (KOD LENGKAP & STABIL)

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app, db } from './config.js'; // PASTIKAN 'app' & 'db' dieksport dari config.js

const firebaseAuth = getAuth(app); 

// Map routes
const routes = {
    'login': { file: 'auth.js', func: 'loadLoginPage' },
    'guru-home': { file: 'guru/guru-dashboard.js', func: 'loadGuruDashboard' }, 
    'guru-jadual': { file: 'guru/jadual-editor.js', func: 'loadJadualEditor' },
    'guru-rph-generator': { file: 'guru/rph-generator.js', func: 'loadRphGenerator' },
    'guru-rph-history': { file: 'guru/rph-history.js', func: 'loadRphHistory' },
    'guru-rph-edit': { file: 'guru/rph-edit.js', func: 'loadRphEdit' },
    'admin-home': { file: 'admin/dashboard.js', func: 'loadAdminDashboard' },
};

/**
 * Handles navigation by dynamically importing the required module.
 */
export async function navigate(routeName, param) { 
    const role = localStorage.getItem('userRole');
    const contentDiv = document.getElementById('content');
    
    let key = routeName;
    
    if (routeName === 'home') {
        key = role === 'admin' ? 'admin-home' : 'guru-jadual'; 
    }
    
    const route = routes[key];

    if (!route) {
        contentDiv.innerHTML = `<p class="error">Laluan '${routeName}' tidak dijumpai.</p>`;
        return;
    }

    try {
        const module = await import(`./${route.file}`);

        if (typeof module[route.func] === 'function') {
            await module[route.func](param);
        } else {
            console.error(`Gagal memuatkan modul untuk laluan ${routeName}: ${route.func} is not a function.`);
            contentDiv.innerHTML = `<p class="error">Ralat aplikasi: Gagal memuatkan fungsi ${route.func} untuk laluan ${routeName}.</p>`;
        }

    } catch (e) {
        console.error(`Gagal memuatkan modul untuk laluan ${routeName}:`, e);
        contentDiv.innerHTML = `<p class="error">Gagal memuatkan modul untuk laluan ${routeName}: ${e.message}</p>`;
    }
}

// Pendedahan fungsi navigate secara global
window.router = {
    navigate: navigate
};


// Logik pemuatan awal selepas DOM dimuatkan
document.addEventListener('DOMContentLoaded', () => {
    // Hanya berjalan jika kita berada di dashboard.html
    if (!window.location.pathname.includes('dashboard.html')) return;

    const contentDiv = document.getElementById('content');
    const roleStyle = document.getElementById('role-style');
    const navbar = document.getElementById('navbar');
    
    contentDiv.innerHTML = '<p class="guru-section">Memuatkan sesi...</p>';
    navbar.style.display = 'none';

    // KRITIKAL: Tunggu sehingga status pengesahan Firebase dipastikan
    onAuthStateChanged(firebaseAuth, async (user) => { 
        const userNameEl = document.getElementById('userName'); // Dapatkan elemen nama di sini
        
        if (user) {
            let role = localStorage.getItem('userRole');
            
            // FALLBACK: Jika role hilang dari localStorage walaupun sesi Firebase sah
            if (!role) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        role = userData.role;
                        
                        // Simpan semula di localStorage (termasuk nama)
                        localStorage.setItem('userRole', role); 
                        localStorage.setItem('userName', userData.name); 
                    }
                } catch (e) {
                    console.error("Gagal membaca role/nama dari Firestore sebagai fallback:", e);
                }
            }

            if (role) {
                // Sesi sah & Role ada
                navbar.style.display = 'flex';
                roleStyle.href = role === 'admin' 
                    ? 'assets/css/admin.css' 
                    : 'assets/css/guru.css';
                
                // >>> KRITIKAL: PAPARKAN NAMA PENGGUNA
                const name = localStorage.getItem('userName');
                if (userNameEl && name) {
                    userNameEl.textContent = name;
                }

                navigate('home');
            } else {
                // Sesi sah, tetapi peranan tidak dijumpai di mana-mana
                contentDiv.innerHTML = '<div class="guru-section"><p class="error">Sesi sah, tetapi peranan tidak dapat ditentukan. Sila <a href="index.html">log masuk semula</a>.</p></div>';
            }

        } else {
            // Pengguna tidak log masuk atau sesi tamat
            contentDiv.innerHTML = '<div class="guru-section"><p class="error">Sesi tamat. Sila <a href="index.html">log masuk semula</a>.</p></div>';
        }
    });
});
