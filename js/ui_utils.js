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
            // Pastikan loadRPHtoEdit wujud dalam scope global atau diakses melalui window
            editBtn.onclick = () => window.loadRPHtoEdit(item.id); 
            actionCell.appendChild(editBtn);
        }
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
        // Data Slot hanya perlukan Time, Subject, Class
        const dayData = existingData.find(d => d.day === day) || { day: day, slots: [{ time: '', subject: '', class: '' }] };
        
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
 * Menjana satu set input untuk satu slot waktu. (HANYA MASA, SUBJEK, KELAS)
 */
function generateSlotInput(day, index, slotData = { time: '', subject: '', class: '' }) {
    return `<div class="input-group slot-group mb-2" data-index="${index}">
        <input type="text" placeholder="Masa (cth: 0800-0900)" name="time" value="${slotData.time}" required>
        <input type="text" placeholder="Mata Pelajaran (BM, SN, MT)" name="subject" value="${slotData.subject}" required>
        <input type="text" placeholder="Kelas (4 Anggun)" name="class" value="${slotData.class}" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeTimeSlot(this)">Hapus</button>
    </div>`;
}

/**
 * [FUNGSI BARU] addTimeSlot(day)
 * Tambah slot input baru ke UI. (Didedahkan ke Window)
 */
window.addTimeSlot = function(day) {
    const container = document.getElementById(`slots-${day}`);
    const index = container.children.length;
    container.insertAdjacentHTML('beforeend', generateSlotInput(day, index));
}

/**
 * [FUNGSI BARU] removeTimeSlot(buttonElement)
 * Hapus slot input dari UI. (Didedahkan ke Window)
 */
window.removeTimeSlot = function(buttonElement) {
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
    
    // Data slot RPH sebenar perlu dikumpul di sini
    const rphData = {
        date: document.getElementById('rph-date').value,
        id: document.getElementById('rph-document-id').value,
        slots_data: [{}] // Ini perlu digantikan dengan data yang dikumpul dari borang editor
    };

    const status = (action === 'draft') ? 'Draf' : 'Menunggu Semakan';
    
    // Pastikan saveRPH wujud
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

/**
 * Fungsi utiliti tambahan: Mengumpul data dari borang Jadual Waktu
 */
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

            // Hanya masukkan slot yang mempunyai data lengkap
            if (slot.time && slot.subject && slot.class) {
                slots.push(slot);
            }
        });

        timetableData.push({ day, slots });
    });

    return timetableData.filter(d => d.slots.length > 0);
}

// Fungsi utiliti tambahan: Mendapatkan nama hari
function getDayNameFromDate(dateInput) {
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    // Locale 'ms-MY' untuk nama hari Bahasa Melayu
    return date.toLocaleDateString('ms-MY', { weekday: 'long' }); 
}


// Panggil fungsi utiliti semasa DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    initializeTabSwitching();

    const rphForm = document.getElementById('rph-form');
    if (rphForm) {
        rphForm.addEventListener('submit', handleFormSubmission);
    }
});
