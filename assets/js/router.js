// assets/js/router.js (KOD LENGKAP & STABIL DENGAN LALUAN ADMIN BARU)

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app, db } from './config.js'; 

const firebaseAuth = getAuth(app); 

// Map routes
const routes = {
    'login': { file: 'auth.js', func: 'loadLoginPage' },
    'guru-home': { file: 'guru/guru-dashboard.js', func: 'loadGuruDashboard' }, 
    'guru-jadual': { file: 'guru/jadual-editor.js', func: 'loadJadualEditor' },
    'guru-rph-generator': { file: 'guru/rph-generator.js', func: 'loadRphGenerator' },
    'guru-rph-history': { file: 'guru/rph-history.js', func: 'loadRphHistory' },
    'guru-rph-edit': { file: 'guru/rph-edit.js', func: 'loadRphEdit' },
    
// --- LALUAN ADMIN ---
    'admin-home': { file: 'admin/dashboard.js', func: 'loadAdminDashboard' },
    'admin-teachers': { file: 'admin/teachers.js', func: 'loadTeachersPage' }, 
    
    // [1] ADMIN RPH LIST VIEW (untuk penapisan dari Analisis)
    // Fail: assets/js/admin/rph-review.js (Yang perlu anda cipta)
    'admin-rph-review': { file: 'rph-review.js', func: 'loadRphReviewPage' }, 
    
    // [2] ADMIN RPH DETAIL VIEW (untuk semakan perincian satu RPH)
    // Fail: assets/js/admin/review.js (Fail yang telah anda muat naik)
    'admin-rph-detail': { file: 'admin/review.js', func: 'loadReviewPage' },
    
    // [3] ANALISIS & LAPORAN
    'admin-analytics': { file: 'admin/analytics.js', func: 'loadAnalytics' }, 
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
        contentDiv.innerHTML = `<p class="error">Laluan '${routeName}' tidak dijumpai. Sila semak router.js.</p>`;
        return;
    }

    try {
        // Paparkan kawasan kandungan yang betul
        const targetDivId = routeName.startsWith('admin-') ? 'adminContent' : 'content';
        const targetDiv = document.getElementById(targetDivId) || document.getElementById('content');

        targetDiv.innerHTML = '<p class="loading-message">Memuatkan modul...</p>'; // Tunjukkan pemuatan

        const module = await import(`./${route.file}`);

        if (typeof module[route.func] === 'function') {
            await module[route.func](param);
        } else {
            console.error(`Gagal memuatkan modul untuk laluan ${routeName}: ${route.func} is not a function.`);
            targetDiv.innerHTML = `<p class="error">Ralat aplikasi: Gagal memuatkan fungsi ${route.func} untuk laluan ${routeName}.</p>`;
        }

    } catch (e) {
        console.error(`Gagal memuatkan modul untuk laluan ${routeName}:`, e);
        document.getElementById('content').innerHTML = `<p class="error">Gagal memuatkan modul untuk laluan ${routeName}: ${e.message}</p>`;
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
        const userNameEl = document.getElementById('userName'); 
        
        if (user) {
            let role = localStorage.getItem('userRole');
            
            // FALLBACK: Dapatkan role dari Firestore jika localStorage hilang
            if (!role) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // Semak Status Nyahaktif (seperti yang ditunjukkan dalam teachers.js)
                        if (userData.status === 'disabled') {
                            // Mengeluarkan mesej Akaun tidak sah
                            alert("Akaun tidak sah. Sila hubungi pentadbir."); 
                            firebaseAuth.signOut();
                            window.location.href = 'index.html';
                            return;
                        }
                        
                        role = userData.role;
                        
                        // Simpan semula di localStorage (termasuk nama)
                        localStorage.setItem('userRole', role); 
                        localStorage.setItem('userName', userData.name); 
                    } else {
                        // Mengeluarkan mesej Data peranan pengguna tidak dijumpai
                        alert("Data peranan pengguna tidak dijumpai. Sila hubungi pentadbir.");
                        firebaseAuth.signOut();
                        window.location.href = 'index.html';
                        return;
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
                
                // PAPARKAN NAMA PENGGUNA
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
