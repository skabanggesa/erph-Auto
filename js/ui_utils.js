// =======================================================
// UI UTILITIES LOGIC (js/ui_utils.js)
// =======================================================

/**
 * [FUNGSI WAJIB] showNotification(message, type)
 * Memaparkan mesej kejayaan/ralat kepada pengguna.
 */
function showNotification(message, type) {
    const container = document.querySelector('.container');
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification ${type}`;
    notificationDiv.textContent = message;

    container.insertBefore(notificationDiv, container.firstChild);

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

    tbody.innerHTML = ''; 

    dataArray.forEach(item => {
        const row = tbody.insertRow();
        // Firebase Timestamp perlu ditukar ke Date untuk paparan
        const dateObject = item.date.toDate(); 
        const dateString = dateObject.toLocaleDateString('ms-MY');

        row.insertCell().textContent = dateString;
        
        if (tableId === 'teacher-rph-list') {
            row.insertCell().textContent = getDayNameFromDate(dateObject);
            row.insertCell().textContent = item.status;
            
            const actionCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-secondary btn-sm';
            editBtn.textContent = 'Lihat/Edit';
            // Pastikan loadRPHtoEdit wujud dalam scope
            editBtn.onclick = () => loadRPHtoEdit(item.id); 
            actionCell.appendChild(editBtn);
        }
        // Logik untuk admin-rph-list (jika perlu)
    });
}

/**
 * [FUNGSI BARU] generateTimetableForm(existingData)
 * Menjana borang HTML yang kompleks untuk Jadual Waktu mingguan.
 */
function generateTimetableForm(existingData = []) {
    const daysOfWeek = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];
    let html = '';
    
    daysOfWeek.forEach(day => {
        const dayData = existingData.find(d => d.day === day) || { day: day, slots: [{ time: '', subject: '', class: '', sk: '', sp: '' }] };
        
        html += `<div class="day-section card mt-2" data-day="${day}">
            <h4>${day}</h4>
            <div class="slots-container" id="slots-${day}">`;
            
        // Jana Slot Waktu Sedia Ada
        dayData.slots.forEach((slot, index) => {
            html += generateSlotInput(day, index, slot);
        });

        html += `</div>
            <button type="button" class="btn btn-secondary btn-sm mt-1" onclick="addTimeSlot('${day}')">+ Tambah Slot</button>
        </div>`;
    });

    return `<form id="timetable-form">${html}</form>`;
}

/**
 * [FUNGSI BARU] generateSlotInput(day, index, slotData)
 * Menjana satu set input untuk satu slot waktu.
 */
function generateSlotInput(day, index, slotData = { time: '', subject: '', class: '', sk: '', sp: '' }) {
    return `<div class="input-group slot-group mb-2" data-index="${index}">
        <input type="text" placeholder="Masa (cth: 0800-0900)" name="time" value="${slotData.time}" required>
        <input type="text" placeholder="Mata Pelajaran (BM, SN, MT)" name="subject" value="${slotData.subject}" required>
        <input type="text" placeholder="Kelas (4 Anggun)" name="class" value="${slotData.class}" required>
        <input type="text" placeholder="Standard Kandungan (SK)" name="sk" value="${slotData.sk}" required>
        <input type="text" placeholder="Standard Pembelajaran (SP)" name="sp" value="${slotData.sp}" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeTimeSlot(this)">Hapus</button>
    </div>`;
}

/**
 * [FUNGSI BARU] addTimeSlot(day)
 * Tambah slot input baru ke UI.
 */
function addTimeSlot(day) {
    const container = document.getElementById(`slots-${day}`);
    const index = container.children.length;
    container.insertAdjacentHTML('beforeend', generateSlotInput(day, index));
}

/**
 * [FUNGSI BARU] removeTimeSlot(buttonElement)
 * Hapus slot input dari UI.
 */
function removeTimeSlot(buttonElement) {
    buttonElement.closest('.slot-group').remove();
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
    
    const action = event.submitter.getAttribute('data-action');
    
    // Logik untuk mengumpul data RPH perlu dimasukkan di sini
    const rphData = {
        date: document.getElementById('rph-date').value,
        id: document.getElementById('rph-document-id').value,
        slots_data: [{}] // Data dummy sementara
    };

    const status = (action === 'draft') ? 'Draf' : 'Menunggu Semakan';
    
    // Pastikan saveRPH wujud dalam scope
    if (typeof saveRPH !== 'undefined') {
        saveRPH(rphData, status);
    } else {
        showNotification("Ralat sistem: Fungsi saveRPH tidak ditemui.", 'error');
    }
}

/**
 * Fungsi utiliti tambahan: Menguruskan pertukaran tab di guru_rph.html
 */
function initializeTabSwitching() {
    const tabs = document.querySelectorAll('.btn-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.querySelectorAll('.btn-tab').forEach(t => {
                t.classList.remove('active');
            });

            document.getElementById(targetId).classList.remove('hidden');
            tab.classList.add('active');
        });
    });
}

// Panggil fungsi utiliti semasa DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi pertukaran tab
    initializeTabSwitching();

    // Event listener untuk borang RPH (handleFormSubmission)
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

// Fungsi utiliti tambahan: Mengumpul data dari borang Jadual Waktu
function collectTimetableFormData() {
    const timetableData = [];
    const daySections = document.querySelectorAll('#timetable-form-container .day-section');

    daySections.forEach(daySection => {
        const day = daySection.getAttribute('data-day');
        const slots = [];
        
        daySection.querySelectorAll('.slot-group').forEach(slotGroup => {
            const slot = {};
            // Ambil nilai dari setiap input di dalam slot
            slotGroup.querySelectorAll('input').forEach(input => {
                slot[input.name] = input.value.trim();
            });

            // Hanya masukkan slot yang mempunyai masa yang diisi
            if (slot.time) {
                slots.push(slot);
            }
        });

        timetableData.push({ day, slots });
    });

    return timetableData;
}
