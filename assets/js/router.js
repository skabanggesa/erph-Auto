// router.js

// Peta laluan yang memetakan laluan URL ringkas kepada fungsi pemuat modul
const routes = {
    // LALUAN GURU: Dashboard utama
    'home': () => import('./guru/guru-dashboard.js').then(m => m.loadGuruDashboard()), 
    
    // LALUAN GURU: Jana RPH
    'rph-generator': () => import('./guru/rph-generator.js').then(m => m.loadRphGenerator()),

    // LALUAN GURU: Senarai RPH (Sejarah)
    // *** PEMBETULAN NAMA FAIL/FUNGSI DI SINI ***
    // Menukar rph-list.js kepada rph-history.js dan memanggil loadRphHistory()
    'rph-list': () => import('./guru/rph-history.js').then(m => m.loadRphHistory()), 
    
    // LALUAN GURU: Editor Jadual Waktu
    'jadual-editor': () => import('./guru/jadual-editor.js').then(m => m.loadJadualEditor()),

    // LALUAN GURU: Edit RPH - Menerima ID dokumen sebagai hujah
    'rph-edit': (rphId) => import('./guru/rph-edit.js').then(m => m.loadRphEdit(rphId)), 

    // Laluan Admin (jika diperlukan)
    'admin-home': () => import('./admin/dashboard.js').then(m => m.loadAdminDashboard()),
};

// Menetapkan fungsi navigasi global yang boleh dipanggil dari HTML/JS lain
window.router = {
    // Menggunakan operator rest/spread (...) untuk menghantar hujah tambahan (seperti rphId)
    navigate: function(path, ...args) { 
        const contentDiv = document.getElementById('content');
        
        if (routes[path]) {
            contentDiv.innerHTML = '<p>Memuatkan kandungan...</p>';
            
            // Panggil fungsi pemuat modul dari peta laluan dan luluskan hujah
            routes[path](...args) 
                .catch(error => {
                    console.error(`Gagal memuatkan modul untuk laluan ${path}:`, error);
                    contentDiv.innerHTML = `<p class="error">Ralat memuatkan modul: ${path}. Sila semak konsol.</p>`;
                });
        } else {
            console.error('Laluan tidak wujud:', path);
            window.router.navigate('home'); // Kembali ke dashboard jika laluan tidak sah
        }
    }
};


// Panggil selepas auth.js dimuatkan
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.location.pathname.endsWith('dashboard.html')) return;

  const role = localStorage.getItem('userRole');
  const contentDiv = document.getElementById('content');
  const roleStyle = document.getElementById('role-style');

  if (!role) {
    contentDiv.innerHTML = '<p>Sesi tamat. Sila log masuk semula.</p>';
    return;
  }

  // Muatkan CSS mengikut role
  roleStyle.href = role === 'admin' 
    ? '/erph-Auto/assets/css/admin.css' 
    : '/erph-Auto/assets/css/guru.css';

  // Gunakan router baharu untuk memuatkan Dashboard
  if (role === 'admin') {
    window.router.navigate('admin-home'); 
  } else if (role === 'guru') {
    window.router.navigate('home'); 
  } else {
    contentDiv.innerHTML = '<p>Peranan tidak dikenali.</p>';
  }
});
