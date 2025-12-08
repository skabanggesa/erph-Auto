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
    ? 'assets/css/admin.css' 
    : 'assets/css/guru.css';

  // Muatkan JS mengikut role
  if (role === 'admin') {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'assets/js/admin/dashboard.js';
    document.body.appendChild(script);
  } else if (role === 'guru') {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'assets/js/guru/timetable.js'; // Mulakan dengan jadual
    document.body.appendChild(script);
  } else {
    contentDiv.innerHTML = '<p>Peranan tidak dikenali.</p>';
  }
});
