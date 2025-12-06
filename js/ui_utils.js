// =======================================================
// UI UTILITIES LOGIC (js/ui_utils.js)
// Kemas kini: Membetulkan ralat sintaksis dan integrasi notifikasi.
// =======================================================

/**
 * [FUNGSI WAJIB] showNotification(message, type)
 * Memaparkan mesej kejayaan/ralat kepada pengguna.
 */
function showNotification(message, type) {
    const container = document.querySelector('.container');
    let notificationDiv = document.querySelector('.notification-alert');

    if (!container) {
        console.error("Kesalahan UI: Container utama tidak ditemui.");
        return; 
    }

    if (!notificationDiv) {
        notificationDiv = document.createElement('div');
        notificationDiv.className = 'notification-alert';
        // Menyisipkan notifikasi selepas header
        const header = document.querySelector('.navbar');
        if (header && header.nextSibling) {
            container.insertBefore(notificationDiv, header.nextSibling);
        } else {
            container.insertBefore(notificationDiv, container.firstChild);
        }
    }
    
    // Gunakan class yang lebih generik untuk styling
    notificationDiv.className = `notification-alert alert alert-${type}`; 
    notificationDiv.textContent = message;
    notificationDiv.style.display = 'block';

    clearTimeout(window.notificationTimeout);
    window.notificationTimeout = setTimeout(() => {
        notificationDiv.style.display = 'none';
        notificationDiv.textContent = ''; // Kosongkan mesej
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
        row.insertCell().textContent = item.day || 'N/A';
        row.insertCell().textContent = item.status || 'Draf';
        
        const actionCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.textContent = item.status === 'Diserahkan' ? 'Semak' : 'Sunting';
        editButton.className = 'btn btn-sm btn-action';
        editButton.onclick = () => window.loadRPHtoEdit(item.id); 
        actionCell.appendChild(editButton);

    });
}


/**
 * [FUNGSI WAJIB] renderTimetableForm()
 * Menjana borang input Jadual Waktu.
 */
function renderTimetableForm() {
    const days = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];
    const container = document.getElementById('timetable-input-form');
    if (!container) return;
    
    container.innerHTML = `<div id="timetable-form-container"></div>`;
    const formContainer = document.getElementById('timetable-form-container');

    days.forEach(day => {
        const daySection = document.createElement('div');
        daySection.className = 'day-section card-light mb-2';
        daySection.setAttribute('data-day', day);
        daySection.innerHTML = `
            <h4>${day}</h4>
            <div class="slots-list">
                </div>
            <button type="button" class="btn btn-sm btn-add-slot" data-day="${day}">+ Tambah Slot</button>
        `;
        formContainer.appendChild(daySection);

        // Tambah Event Listener untuk butang Tambah Slot
        daySection.querySelector('.btn-add-slot').addEventListener('click', () => {
            addTimetableSlot(daySection.querySelector('.slots-list'), null);
        });

        // Pastikan ada satu slot kosong secara lalai
        if (daySection.querySelector('.slots-list').children.length === 0) {
            addTimetableSlot(daySection.querySelector('.slots-list'), null);
        }
    });
}


/**
 * Fungsi pembantu untuk menambah slot ke borang Jadual Waktu.
 */
/**
 * Fungsi pembantu untuk menambah slot ke borang Jadual Waktu.
 */
function addTimetableSlot(container, slotData) {
    const slotGroup = document.createElement('div');
    slotGroup.className = 'slot-group mb-1 d-flex';
    slotGroup.innerHTML = `
        <input type="time" name="time_start" placeholder="Masa Mula" value="${slotData?.time_start || ''}" required>
        <input type="time" name="time_end" placeholder="Masa Tamat" value="${slotData?.time_end || ''}" required>
        <input type="text" name="subject" placeholder="Subjek (Contoh: RBT)" value="${slotData?.subject || ''}" required>
        <input type="text" name="class" placeholder="Kelas (Contoh: 4 Bestari)" value="${slotData?.class || ''}" required>
        <button type="button" class="btn btn-sm btn-danger btn-remove-slot">X</button>
    `;
    
    slotGroup.querySelector('.btn-remove-slot').addEventListener('click', (e) => {
        e.target.closest('.slot-group').remove();
    });

    container.appendChild(slotGroup);
}


/**
 * [FUNGSI WAJIB] fillTimetableForm(timetableData)
 * Mengisi borang Jadual Waktu yang sedia ada.
 */
function fillTimetableForm(timetableData) {
    timetableData.forEach(dayData => {
        const daySection = document.querySelector(`.day-section[data-day="${dayData.day}"]`);
        if (daySection) {
            const slotsList = daySection.querySelector('.slots-list');
            slotsList.innerHTML = ''; // Kosongkan slot lalai/sedia ada
            
            dayData.slots.forEach(slot => {
                addTimetableSlot(slotsList, slot);
            });
            // Pastikan ada satu slot kosong jika tiada data
            if (dayData.slots.length === 0) {
                 addTimetableSlot(slotsList, null);
            }
        }
    });
}

/**
 * [FUNGSI WAJIB] collectTimetableFormData()
 * Mengumpul semua data Jadual Waktu dari borang input.
 */
function collectTimetableFormData() {
    const timetableData = [];
    const daySections = document.querySelectorAll('#timetable-form-container .day-section');

    daySections.forEach(daySection => {
        const day = daySection.getAttribute('data-day');
        const slots = [];
        
        daySection.querySelectorAll('.slot-group').forEach(slotGroup => {
            const slot = {};
            
            // Mengumpul input time_start, time_end, subject, class
            slotGroup.querySelectorAll('input').forEach(input => {
                slot[input.name] = input.value.trim();
            });

            // Hanya simpan slot yang mempunyai semua maklumat
            if (slot.time_start && slot.time_end && slot.subject && slot.class) {
                slots.push(slot);
            }
        });

        timetableData.push({ day, slots });
    });

    return timetableData.filter(d => d.slots.length > 0);
}


/**
 * [FUNGSI WAJIB] loadRPHFormWithData(slotsData)
 * Mengisi borang RPH dengan data yang dijana (atau yang disimpan).
 */
function loadRPHFormWithData(slotsData) {
    const container = document.getElementById('rph-slots-container');
    if (!container) return;

    container.innerHTML = ''; // Kosongkan bekas sedia ada

    slotsData.forEach((slot, index) => {
        const slotGroup = document.createElement('div');
        slotGroup.className = 'rph-slot-group card-light mb-2';
        
        // Guna time_start dan time_end untuk paparan header
        const displayTime = `${slot.time_start || 'Masa Mula'} - ${slot.time_end || 'Masa Tamat'}`;

        slotGroup.innerHTML = `
            <h4 class="slot-header">${displayTime} - ${slot.subject} (${slot.class})</h4>
            <div class="rph-slot-details">
                <input type="hidden" name="time_start" value="${slot.time_start || ''}">
                <input type="hidden" name="time_end" value="${slot.time_end || ''}">
                <input type="hidden" name="day" value="${slot.day}">
                <input type="hidden" name="subject" value="${slot.subject}">
                <input type="hidden" name="class" value="${slot.class}">

                <label for="unit-${index}">Unit:</label>
                <textarea id="unit-${index}" name="unit" rows="1" required>${slot.unit || ''}</textarea>

                <label for="standard-${index}">Standard Pembelajaran (SP):</label>
                <textarea id="standard-${index}" name="standard" rows="2" required>${slot.standard || ''}</textarea>

                <label for="objective-${index}">Objektif Pembelajaran:</label>
                <textarea id="objective-${index}" name="objective" rows="3" required>${slot.objective || ''}</textarea>

                <label for="aktiviti-${index}">Aktiviti:</label>
                <textarea id="aktiviti-${index}" name="aktiviti" rows="4" required>${slot.aktiviti || ''}</textarea>

                <label for="penilaian-${index}">Penilaian:</label>
                <textarea id="penilaian-${index}" name="penilaian" rows="3" required>${slot.penilaian || ''}</textarea>

                <label for="aids-${index}">Bahan Bantu Mengajar (BBM):</label>
                <textarea id="aids-${index}" name="aids" rows="3" required>${slot.aids || ''}</textarea>

                <label for="refleksi-${index}">Refleksi:</label>
                <textarea id="refleksi-${index}" name="refleksi" rows="3">${slot.refleksi || ''}</textarea>
            </div>
        `;
        container.appendChild(slotGroup);
    });
}

/**
 * [FUNGSI WAJIB] collectRPHDataFromForm()
 * Mengumpul semua data slot RPH dari borang penyuntingan (editor).
 */
function collectRPHDataFromForm() {
    const slotsData = [];
    const rphSlots = document.querySelectorAll('#rph-slots-container .rph-slot-group');

    rphSlots.forEach(slotGroup => {
        const slot = {
            time: slotGroup.querySelector('input[name="time"]').value,
            day: slotGroup.querySelector('input[name="day"]').value,
            subject: slotGroup.querySelector('input[name="subject"]').value,
            class: slotGroup.querySelector('input[name="class"]').value,
            
            unit: slotGroup.querySelector('textarea[name="unit"]').value, 

            standard: slotGroup.querySelector('textarea[name="standard"]').value,
            objective: slotGroup.querySelector('textarea[name="objective"]').value,
            aktiviti: slotGroup.querySelector('textarea[name="aktiviti"]').value,
            penilaian: slotGroup.querySelector('textarea[name="penilaian"]').value, 
            aids: slotGroup.querySelector('textarea[name="aids"]').value, 
            refleksi: slotGroup.querySelector('textarea[name="refleksi"]').value
        };
        slotsData.push(slot);
    });
    return slotsData;
}


/**
 * Fungsi pembantu untuk mendapatkan nama Hari dari Tarikh.
 */
function getDayNameFromDate(dateInput) {
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    if (isNaN(date)) return "Tarikh Tidak Sah"; 
    // Menggunakan ms-MY untuk mendapatkan nama hari dalam Bahasa Melayu
    return date.toLocaleDateString('ms-MY', { weekday: 'long' }); 
}


/**
 * Fungsi untuk mengendalikan penukaran tab.
 */
function initializeTabSwitching() {
    const tabs = document.querySelectorAll('.btn-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Gunakan data-tab (lama) atau data-target (baru)
            const targetId = tab.getAttribute('data-tab') || tab.getAttribute('data-target');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.querySelectorAll('.btn-tab').forEach(t => {
                t.classList.remove('active');
            });

            document.getElementById(targetId)?.classList.remove('hidden');
            tab.classList.add('active');
        });
    });
}


// Panggil fungsi utiliti semasa DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    initializeTabSwitching();
});

