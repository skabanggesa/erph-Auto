// router.js

// Peta laluan yang memetakan laluan URL ringkas kepada fungsi pemuat modul
const routes = {
    // Laluan ini memuatkan UI Dashboard Guru yang mengandungi butang navigasi.
    // Kita anggap UI Dashboard Guru berada dalam 'guru-dashboard.js'
    'home': () => import('./guru-dashboard.js').then(m => m.loadGuruDashboard()), 
    
    // Laluan untuk menjana RPH
    'rph-generator': () => import('./rph-generator.js').then(m => m.loadRphGenerator()),

    // Laluan untuk menyenaraikan RPH (Anggapkan fail ini wujud)
    'rph-list': () => import('./rph-list.js').then(m => m.loadRphList()), 
    
    // LALUAN BAHARU: Editor Jadual Waktu
    'jadual-editor': () => import('./jadual-editor.js').then(m => m.loadJadualEditor()), 

    // Laluan Admin (jika diperlukan)
    'admin-home': () => import('./admin/dashboard.js').then(m => m.loadAdminDashboard()),
};

// Menetapkan fungsi navigasi global yang boleh dipanggil dari HTML/JS lain
window.router = {
    navigate: function(path) {
        const contentDiv = document.getElementById('content');
        
        if (routes[path]) {
            // Bersihkan kandungan sebelum memuatkan modul baharu
            contentDiv.innerHTML = '<p>Memuatkan kandungan...</p>';
            
            // Panggil fungsi pemuat modul dari peta laluan
            routes[path]()
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
  if (!window.location.pathname.endsWith('dashboard.html')) return; // Pastikan hanya berjalan di dashboard

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
    // Jika admin, navigasi ke laluan admin
    window.router.navigate('admin-home'); 
  } else if (role === 'guru') {
    // Jika guru, navigasi ke laluan dashboard guru ('home')
    window.router.navigate('home'); 
  } else {
    contentDiv.innerHTML = '<p>Peranan tidak dikenali.</p>';
  }
});
