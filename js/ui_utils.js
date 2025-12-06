// =======================================================
// UI UTILITIES LOGIC (js/ui_utils.js)
// Kemas kini: Memulihkan Logik Jadual Waktu dan RPH
// =======================================================

/**
 * [FUNGSI WAJIB] showNotification(message, type)
 * Memaparkan mesej kejayaan/ralat kepada pengguna.
 */
function showNotification(message, type) {
    const container = document.querySelector('.container');
    let notificationDiv = document.querySelector('.notification-alert');

    if (!notificationDiv) {
        notificationDiv = document.createElement('div');
        notificationDiv.className = 'notification-alert';
        // Menyisipkan notifikasi selepas header
        if (container) {
             const header = document.querySelector('.navbar');
             if (header && header.nextSibling) {
                 container.insertBefore(notificationDiv, header.nextSibling);
             } else {
                 container.insertBefore(notificationDiv, container.firstChild);
             }
        } else {
            document.body.insertBefore(notificationDiv, document.body.firstChild);
        }
    }
    
    notificationDiv.className = `notification-alert alert alert-${type}`;
    notificationDiv.textContent = message;
    notificationDiv.style.display = 'block';

    clearTimeout(window.notificationTimeout);
    window.notificationTimeout = setTimeout(() => {
        notificationDiv.style.display = 'none';
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
            row.insertCell().textContent = item.status || 'Draf';
            
            const actionCell = row.insertCell();
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit/Semak';
            editButton.className = 'btn btn-secondary btn-sm';
            editButton.onclick = () => window.loadRPHtoEdit(item.id);
            actionCell.appendChild(editButton);
        }
    });
}

/**
 * Helper untuk menjana HTML input slot Jadual Waktu.
 * SP DIBUANG.
 */
function createSlotHtml(slot = {}) {
    return `
        <div class="slot-group">
            <input type="time" name="time" placeholder="Masa" value="${slot.time || ''}" required>
            <input type="text" name="subject" placeholder="Subjek" value="${slot.subject || ''}" required>
            <input type="text" name="class" placeholder="Kelas" value="${slot.class || ''}" required>
            <button type="button" class="btn btn-danger btn-remove-slot">X</button>
        </div>
    `;
}


/**
 * [FUNGSI WAJIB] renderTimetableForm()
 * Menjana struktur borang Jadual Waktu kosong.
 */
function renderTimetableForm(timetableData = []) {
    const days = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];
    const container = document.getElementById('timetable-input-form');
    if (!container) return;

    // Bersihkan isi lama dan sediakan struktur borang baru
    container.innerHTML = `
        <form id="timetable-form">
            <div class="slot-header">
                <label>Masa</label>
                <label>Subjek</label>
                <label>Kelas</label>
                <label></label> 
            </div>
            <div id="timetable-form-container">
                </div>
        </form>
    `;
    
    const formContainer = document.getElementById('timetable-form-container');
    
    days.forEach(day => {
        const dayData = timetableData.find(d => d.day === day) || { day, slots: [{}, {}] }; // 2 slot kosong lalai
        
        const daySection = document.createElement('div');
        daySection.className = 'day-section';
        daySection.setAttribute('data-day', day);
        daySection.innerHTML = `
            <h3>${day}</h3>
            <div id="slots-${day}-container" class="slots-container">
                </div>
            <button type="button" class="btn btn-secondary btn-add-slot" data-day="${day}">+ Slot</button>
        `;
        formContainer.appendChild(daySection);

        const slotsContainer = daySection.querySelector('.slots-container');
        
        // Panggil createSlotHtml untuk mengisi data sedia ada atau slot kosong
        if (dayData.slots && dayData.slots.length > 0) {
            dayData.slots.forEach(slot => {
                slotsContainer.insertAdjacentHTML('beforeend', createSlotHtml(slot));
            });
        } else {
            // Pastikan sekurang-kurangnya satu slot kosong wujud jika tiada data
            slotsContainer.insertAdjacentHTML('beforeend', createSlotHtml({}));
        }

        // Event listener untuk butang tambah slot
        daySection.querySelector('.btn-add-slot').addEventListener('click', function() {
            slotsContainer.insertAdjacentHTML('beforeend', createSlotHtml({}));
        });
    });
    
    // Event listener untuk butang buang slot (delegation)
    document.getElementById('timetable-form-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-slot')) {
            e.target.closest('.slot-group').remove();
        }
    });
}


/**
 * [FUNGSI WAJIB] fillTimetableForm(timetableData)
 * Mengisi borang Jadual Waktu dengan data sedia ada.
 * Kini hanya memanggil renderTimetableForm() sekali sahaja.
 */
function fillTimetableForm(timetableData) {
    if (!timetableData || timetableData.length === 0) {
        // Jika tiada data, borang kosong sudah dijana oleh renderTimetableForm() yang dipanggil awal
        return; 
    }

    // Hanya mengisi semula HTML tanpa menjana semula struktur utama
    timetableData.forEach(dayData => {
        const slotsContainer = document.getElementById(`slots-${dayData.day}-container`);
        if (slotsContainer) {
            slotsContainer.innerHTML = ''; // Kosongkan slot kosong sedia ada
            
            dayData.slots.forEach(slot => {
                // Guna fungsi createSlotHtml untuk menjana slot dengan data
                slotsContainer.insertAdjacentHTML('beforeend', createSlotHtml(slot));
            });
        }
    });

    // showNotification('Jadual Waktu berjaya dimuatkan.', 'success'); // Pindah ke guru_rph_logic.js
}


/**
 * [FUNGSI WAJIB] collectTimetableFormData()
 * Mengumpul data dari borang Jadual Waktu.
 */
function collectTimetableFormData() {
    const timetableData = [];
    const daySections = document.querySelectorAll('#timetable-form-container .day-section');

    daySections.forEach(daySection => {
        const day = daySection.getAttribute('data-day');
        const slots = [];
        
        daySection.querySelectorAll('.slot-group').forEach(slotGroup => {
            const slot = {};
            
            // Mengumpul input: time, subject, class. (SP dikeluarkan)
            slotGroup.querySelectorAll('input').forEach(input => {
                slot[input.name] = input.value.trim();
            });

            // Hanya tolak slot jika ada data yang lengkap (time, subject, class)
            if (slot.time && slot.subject && slot.class) {
                slots.push(slot);
            }
        });

        timetableData.push({ day, slots });
    });

    return timetableData.filter(d => d.slots.length > 0);
}


// --- FUNGSI RPH EDITOR (Kekal Sama) ---

/**
 * Menjana HTML untuk satu slot RPH (Lengkap)
 */
function createRPHSlotHtml(slot = {}) {
    // Pastikan nilai lalai ditetapkan untuk mengelakkan ralat 'undefined'
    const defaults = { 
        time: '', day: '', subject: '', class: '', standard: '', objective: '', 
        aktiviti: '', penilaian: '', aids: '', refleksi: '', id: `rph-${Math.random().toString(36).substr(2, 9)}` 
    };
    const data = { ...defaults, ...slot };

    return `
        <div class="rph-slot-group" data-id="${data.id}">
            <h4>Slot RPH: ${data.subject} (${data.class})</h4>
            <input type="hidden" name="time" value="${data.time}">
            <input type="hidden" name="day" value="${data.day}">
            <input type="hidden" name="subject" value="${data.subject}">
            <input type="hidden" name="class" value="${data.class}">
            
            <label>Standard Pembelajaran (SP):</label>
            <input type="text" name="standard" value="${data.standard}" placeholder="Contoh: 1.1.1 Mengenal pasti..." required>

            <label>Objektif Pembelajaran:</label>
            <input type="text" name="objective" value="${data.objective}" placeholder="Murid dapat menyatakan..." required>
            
            <label>Aktiviti (Langkah-Langkah):</label>
            <textarea name="aktiviti" placeholder="Contoh: Set Induksi (5 minit): Soal jawab..." required>${data.aktiviti}</textarea>
            
            <label>Kaedah Penilaian:</label>
            <textarea name="penilaian" placeholder="Contoh: Pemerhatian, Soalan Lisan, Lembaran Kerja">${data.penilaian}</textarea>
            
            <label>Bahan Bantu Mengajar (BBM):</label>
            <textarea name="aids" placeholder="Contoh: Komputer, Kad Imbas, Buku Teks">${data.aids}</textarea>

            <label>Refleksi:</label>
            <textarea name="refleksi" placeholder="Contoh: 20/30 murid menguasai. Aktiviti perlu diperluaskan.">${data.refleksi}</textarea>
            
            <button type="button" class="btn btn-danger btn-remove-rph-slot">Buang Slot RPH</button>
        </div>
    `;
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

        slotGroup.innerHTML = `
            <h4 class="slot-header">${slot.time} - ${slot.subject} (${slot.class})</h4>
            <div class="rph-slot-details">
                <input type="hidden" name="time" value="${slot.time}">
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

    // Delegasi Event Listener untuk butang buang
    editorContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-rph-slot')) {
            e.target.closest('.rph-slot-group').remove();
        }
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
            
            // MEDAN UNIT BARU
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


function getDayNameFromDate(dateInput) {
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    if (isNaN(date)) return "Tarikh Tidak Sah"; 
    // Menggunakan ms-MY untuk mendapatkan nama hari dalam Bahasa Melayu
    return date.toLocaleDateString('ms-MY', { weekday: 'long' }); 
}

function initializeTabSwitching() {
    const tabs = document.querySelectorAll('.btn-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            
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


document.addEventListener('DOMContentLoaded', () => {
    initializeTabSwitching();

    // Event listener tambahan untuk borang RPH Editor
    const rphForm = document.getElementById('rph-editor-form');
    if (rphForm) {
        // Mencegah penghantaran borang lalai
        rphForm.addEventListener('submit', (e) => e.preventDefault());
    }
});

