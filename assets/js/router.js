// assets/js/router.js (KOD LENGKAP: Menambah export navigate dan membetulkan logik initial load)

// Map routes to module files and loading function
const routes = {
    // Laluan Log Masuk
    'login': { file: 'auth.js', func: 'loadLoginPage' },
    
    // Laluan Guru
    'guru-home': { file: 'guru/dashboard.js', func: 'loadGuruDashboard' },
    'guru-jadual': { file: 'guru/jadual-editor.js', func: 'loadJadualEditor' },
    'guru-rph-generator': { file: 'guru/rph-generator.js', func: 'loadRphGenerator' },
    'guru-rph-history': { file: 'guru/rph-history.js', func: 'loadRphHistory' },
    'guru-rph-edit': { file: 'guru/rph-edit.js', func: 'loadRphEdit' },
    
    // Laluan Admin
    'admin-home': { file: 'admin/dashboard.js', func: 'loadAdminDashboard' },
    // Anda akan tambah 'admin-review-rph' di sini nanti
};

/**
 * Handles navigation by dynamically importing the required module.
 * @param {string} routeName - The name of the route to navigate to.
 * @param {*} [param] - Optional parameter to pass to the loading function.
 */
export async function navigate(routeName, param) { // <--- KRITIKAL: FUNGSI INI KINI DIEKSPORT
    const role = localStorage.getItem('userRole');
    const contentDiv = document.getElementById('content');
    
    let key = routeName;
    
    // Pilihan: Guna 'home' sebagai laluan default berdasarkan peranan
    if (routeName === 'home') {
        key = role === 'admin' ? 'admin-home' : 'guru-jadual'; // Guru bermula di jadual editor
    }
    
    const route = routes[key];

    if (!route) {
        contentDiv.innerHTML = `<p class="error">Laluan '${routeName}' tidak dijumpai.</p>`;
        return;
    }

    try {
        // Laluan adalah relatif kepada folder 'assets/js/'
        const module = await import(`./${route.file}`);

        // Panggil fungsi pemuat modul
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

// KRITIKAL: Pendedahan fungsi navigate secara global untuk onclick/inline-HTML
window.router = {
    navigate: navigate
};


// Logik pemuatan awal selepas DOM dimuatkan
document.addEventListener('DOMContentLoaded', async () => {
    // Hanya berjalan jika kita berada di dashboard.html
    if (!window.location.pathname.includes('dashboard.html')) return;

    const role = localStorage.getItem('userRole');
    const contentDiv = document.getElementById('content');
    const roleStyle = document.getElementById('role-style');

    if (!role) {
        contentDiv.innerHTML = '<p>Sesi tamat. Sila log masuk semula.</p>';
        return;
    }

    // Muatkan CSS mengikut role (jika anda masih menggunakan logik ini di router.js)
    // Sila pastikan file 'guru.css' wujud
    roleStyle.href = role === 'admin' 
      ? 'assets/css/admin.css' 
      : 'assets/css/guru.css';

    // Mulakan navigasi berdasarkan peranan
    if (role === 'admin') {
        navigate('admin-home');
    } else if (role === 'guru') {
        navigate('guru-jadual'); // Mulakan dengan jadual editor (laluan yang sudah kita bangunkan)
    } else {
        contentDiv.innerHTML = '<p>Peranan tidak dikenali.</p>';
    }
});
