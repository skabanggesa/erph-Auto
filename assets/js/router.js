// assets/js/router.js (KOD LENGKAP & STABIL DENGAN SOKONGAN MULTI-ROLE ADMIN)

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app, db } from './config.js'; 

const firebaseAuth = getAuth(app); 

// Senarai peranan yang dibenarkan masuk ke Dashboard Pentadbir
const ADMIN_ROLES = ['admin', 'PK1', 'PKHEM', 'PKKK'];

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
    
    // [1] ADMIN RPH LIST VIEW
    'admin-rph-review': { file: 'admin/rph-list.js', func: 'loadRphListPage' }, 
    
    // [2] ADMIN RPH DETAIL VIEW
    'admin-rph-detail': { file: 'admin/review.js', func: 'loadReviewPage' },
    
    // [3] ANALISIS & LAPORAN
    'admin-analytics': { file: 'admin/analytics.js', func: 'loadAnalytics' },

    // [4] PENYELENGGARAAN & STATISTIK
    'admin-maintenance': { file: 'admin/admin-maintenance.js', func: 'loadAdminMaintenancePage' },
};

/**
 * Menguruskan navigasi dengan mengimport modul secara dinamik.
 */
export async function navigate(routeName, param) { 
    const role = localStorage.getItem('userRole');
    const contentDiv = document.getElementById('content');
    
    let key = routeName;
    
    // PEMBETULAN: Jika 'home', semak jika role berada dalam senarai ADMIN_ROLES
    if (routeName === 'home') {
        key = ADMIN_ROLES.includes(role) ? 'admin-home' : 'guru-home'; 
    }
    
    const route = routes[key];

    if (!route) {
        contentDiv.innerHTML = `<p class="error">Laluan '${routeName}' tidak dijumpai. Sila semak router.js.</p>`;
        return;
    }

    try {
        // Tentukan kawasan kandungan (adminContent untuk modul dalam dashboard admin)
        const targetDivId = key.startsWith('admin-') ? 'adminContent' : 'content';
        const targetDiv = document.getElementById(targetDivId) || document.getElementById('content');

        targetDiv.innerHTML = '<p class="loading-message">Memuatkan modul...</p>'; 

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
    if (!window.location.pathname.includes('dashboard.html')) return;

    const contentDiv = document.getElementById('content');
    const roleStyle = document.getElementById('role-style');
    const navbar = document.getElementById('navbar');
    
    contentDiv.innerHTML = '<p class="guru-section">Memuatkan sesi...</p>';
    navbar.style.display = 'none';

    onAuthStateChanged(firebaseAuth, async (user) => { 
        const userNameEl = document.getElementById('userName'); 
        
        if (user) {
            let role = localStorage.getItem('userRole');
            
            // FALLBACK & RE-SYNC: Sentiasa ambil data terkini dari Firestore untuk memastikan role tepat
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    
                    if (userData.status === 'disabled') {
                        alert("Akaun tidak sah. Sila hubungi pentadbir."); 
                        firebaseAuth.signOut();
                        window.location.href = 'index.html';
                        return;
                    }
                    
                    role = userData.role;
                    
                    // Kemaskini localStorage dengan data Firestore terbaru
                    localStorage.setItem('userRole', role); 
                    localStorage.setItem('userName', userData.name); 
                } else {
                    alert("Data peranan pengguna tidak dijumpai.");
                    firebaseAuth.signOut();
                    window.location.href = 'index.html';
                    return;
                }
            } catch (e) {
                console.error("Gagal membaca dari Firestore:", e);
            }

            if (role) {
                navbar.style.display = 'flex';
                
                // PEMBETULAN: Gunakan CSS Admin jika role adalah admin atau mana-mana PK
                roleStyle.href = ADMIN_ROLES.includes(role) 
                    ? 'assets/css/admin.css' 
                    : 'assets/css/guru.css';
                
                const name = localStorage.getItem('userName');
                if (userNameEl && name) {
                    userNameEl.textContent = name;
                }

                // Navigasi ke home mengikut role yang telah dikemaskini
                navigate('home');
            } else {
                contentDiv.innerHTML = '<div class="guru-section"><p class="error">Peranan tidak dapat ditentukan. Sila <a href="index.html">log masuk semula</a>.</p></div>';
            }

        } else {
            contentDiv.innerHTML = '<div class="guru-section"><p class="error">Sesi tamat. Sila <a href="index.html">log masuk semula</a>.</p></div>';
        }
    });
});
