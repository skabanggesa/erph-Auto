// guru-dashboard.js

// Fungsi utama untuk memuatkan paparan dashboard guru
export function loadGuruDashboard() {
    const content = document.getElementById('content');
    
    // Periksa sama ada router wujud (ia sepatutnya wujud dari router.js)
    if (typeof window.router === 'undefined') {
        content.innerHTML = '<p class="error">Ralat sistem: Fungsi navigasi (router) tiada. Sila muat semula.</p>';
        return;
    }

    content.innerHTML = `
        <div class="card">
            <h2>Dashboard Guru</h2>
            <div class="dashboard-actions">
                
                <button class="btn btn-primary" onclick="router.navigate('rph-generator')">
                    Jana RPH Baru
                </button>
                
                <button class="btn btn-info" onclick="router.navigate('rph-list')">
                    Senarai RPH Saya
                </button>
                
                <button class="btn btn-secondary" onclick="router.navigate('jadual-editor')">
                    Urus Jadual Waktu
                </button>
                
            </div>
        </div>
    `;
    
    // Anda boleh menambah logik tambahan di sini, seperti memaparkan nama pengguna
    // (yang biasanya diambil dari #navbar atau auth.currentUser)
    // Walaupun nama pengguna "Edi Harianto Bin Suyadi" sudah dipaparkan di bahagian navbar
}
