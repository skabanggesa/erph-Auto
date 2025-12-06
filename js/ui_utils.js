// =======================================================
// UI UTILITIES LOGIC (ui_utils.js)
// =======================================================

/**
 * [FUNGSI WAJIB] showNotification(message, type)
 * Memaparkan mesej kejayaan/ralat kepada pengguna.
 */
function showNotification(message, type) {
    const container = document.querySelector('.container');
    
    // Cipta elemen notifikasi
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification ${type}`;
    notificationDiv.textContent = message;

    // Masukkan ke dalam DOM
    container.insertBefore(notificationDiv, container.firstChild);

    // Hilangkan notifikasi selepas 5 saat
    setTimeout(() => {
        notificationDiv.remove();
    }, 5000);
}

/**
 * [FUNGSI WAJIB] displayRPHList(dataArray, tableId)
 * Menjana dan memaparkan senarai data RPH secara dinamik dalam HTML.
 */
function displayRPHList(dataArray, tableId) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    tbody.innerHTML = ''; // Kosongkan jadual sedia ada

    dataArray.forEach(item => {
        const row = tbody.insertRow();
        const dateString = item.date.toDate().toLocaleDateString('ms-MY');

        row.insertCell().textContent = dateString;
        
        // Hanya guru yang memerlukan ini
        if (tableId === 'teacher-rph-list') {
            row.insertCell().textContent = getDayNameFromDate(item.date.toDate());
            row.insertCell().textContent = item.status;
            
            const actionCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-secondary btn-sm';
            editBtn.textContent = 'Lihat/Edit';
            editBtn.onclick = () => loadRPHtoEdit(item.id); // Panggil fungsi dari guru_rph_logic
            actionCell.appendChild(editBtn);

        // Hanya Pentadbir yang memerlukan ini
        } else if (tableId === 'pending-rph-list') {
            // Logik tambahan untuk mendapatkan nama guru dari koleksi /users
            // (Memerlukan query tambahan yang akan menyebabkan delay, tetapi penting)
            // ... Contoh ringkas:
            row.insertCell().textContent = item.guru_uid.substring(0, 8) + '...'; 
            row.insertCell().textContent = item.slots_data[0].class || 'Tidak Dinyatakan';
            
            const actionCell = row.insertCell();
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn btn-primary btn-sm';
            viewBtn.textContent = 'Semak';
            // Fungsi untuk memaparkan butiran RPH untuk semakan
            viewBtn.onclick = () => viewRPHDetail(item.id); 
            actionCell.appendChild(viewBtn);
        }
    });
}

/**
 * [FUNGSI WAJIB] clearForm()
 * Mengosongkan medan borang.
 */
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

/**
 * [FUNGSI WAJIB] handleFormSubmission(event)
 * Mengendalikan logik pemula (trigger) butang "Simpan" atau "Hantar" RPH.
 */
function handleFormSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const action = event.submitter.getAttribute('data-action');
    
    // Kumpulkan data RPH dari borang
    const rphData = {
        date: document.getElementById('rph-date').value,
        id: document.getElementById('rph-document-id').value,
        // ... Logik kompleks untuk mengumpul data slot RPH ...
        slots_data: [{}] // Data dummy
    };

    const status = (action === 'draft') ? 'Draf' : 'Menunggu Semakan';
    
    saveRPH(rphData, status);
}

// Tambah event listener untuk borang RPH (dipanggil dari guru_rph.html)
document.addEventListener('DOMContentLoaded', () => {
    const rphForm = document.getElementById('rph-form');
    if (rphForm) {
        rphForm.addEventListener('submit', handleFormSubmission);
    }
});

// Fungsi utiliti tambahan (bukan fungsi wajib yang dikira 21, tetapi diperlukan)
function getDayNameFromDate(dateInput) {
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    return date.toLocaleDateString('ms-MY', { weekday: 'long' });
}
