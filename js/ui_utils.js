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
        // Pastikan notifikasi akan muncul semula jika ada panggilan baharu
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
        // Menggunakan kaedah toDate() Firebase untuk mendapatkan objek Date
        const dateObject = item.date.toDate(); 
        const dateString = dateObject.toLocaleDateString('ms-MY');

        row.insertCell().textContent = dateString;
        
        if (tableId === 'teacher-rph-list') {
            const dayName = getDayNameFromDate(dateObject);
            row.insertCell().textContent = dayName;
            
            row.insertCell().textContent = item.status;
            
            const actionCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-secondary btn-sm';
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => window.loadRPHtoEdit(item.id); 
            
            actionCell.appendChild(editBtn);
        }
    });
}

/**
 * Mengumpul data Jadual Waktu dari borang input.
 */
function collectTimetableFormData() {
    const timetableData = [];
    // Menggunakan ID kontena yang betul dari guru_rph.html
    const daySections = document.querySelectorAll('#timetable-input-form .day-section'); 

    daySections.forEach(daySection => {
        const day = daySection.getAttribute('data-day');
        const slots = [];
        
        daySection.querySelectorAll('.slot-group').forEach(slotGroup => {
            const slot = {};
            
            // Mengumpul semua input dalam slot, termasuk "standards"
            slotGroup.querySelectorAll('input').forEach(input => {
                slot[input.name] = input.value.trim();
            });

            // Pastikan semua medan utama diisi
            if (slot.time && slot.subject && slot.class && slot.standards) {
                slots.push(slot);
            }
        });

        timetableData.push({ day, slots });
    });

    // Hanya pulangkan hari yang mempunyai slot yang sah
    return timetableData.filter(d => d.slots.length > 0);
}

/**
 * Mengumpul data RPH yang telah diisi dalam borang.
 */
function collectRPHFormData() {
    const slotsData = [];
    const rphSlots = document.querySelectorAll('#rph-slots-container .rph-slot-group');

    rphSlots.forEach(slotGroup => {
        const slot = {
            id: slotGroup.getAttribute('data-slot-id'), // Simpan ID slot untuk rujukan
            masa: slotGroup.querySelector('input[name="masa"]').value,
            subjek: slotGroup.querySelector('input[name="subjek"]').value,
            kelas: slotGroup.querySelector('input[name="kelas"]').value,
            modul_unit: slotGroup.querySelector('input[name="modul_unit"]').value,
            standard_kandungan: slotGroup.querySelector('textarea[name="standard_kandungan"]').value,
            standard_pembelajaran: slotGroup.querySelector('textarea[name="standard_pembelajaran"]').value,
            objektif: slotGroup.querySelector('textarea[name="objektif"]').value,
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
 * Fungsi pembantu untuk menjana HTML bagi satu baris slot jadual waktu.
 * @param {Object} slot - Data slot (time, subject, class, standards).
 */
function createSlotHtml(slot = { time: '', subject: '', class: '', standards: '' }) {
    return `
        <div class="slot-group input-group mb-2 p-2 border rounded">
            <input type="text" name="time" value="${slot.time}" placeholder="Masa (cth: 0730-0830)" required>
            <input type="text" name="subject" value="${slot.subject}" placeholder="Subjek (cth: RBT)" required>
            <input type="text" name="class" value="${slot.class}" placeholder="Kelas (cth: 4 Bestari)" required>
            <input type="text" name="standards" value="${slot.standards}" placeholder="Kod SP (cth: RBT.1.1.1)" title="Kod Standard Pembelajaran (SP) untuk Automasi" required>
            <button type="button" class="btn btn-danger btn-sm btn-remove-slot" onclick="removeSlot(this)">X</button>
        </div>
    `;
}

/**
 * Mengendalikan penambahan slot baharu ke dalam hari tertentu.
 * @param {string} day - Nama hari (cth: Isnin).
 */
function addSlot(day) {
    const container = document.getElementById(`slots-${day}-container`);
    if (container) {
        container.insertAdjacentHTML('beforeend', createSlotHtml());
        // Auto-scroll ke slot baharu
        container.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Mengendalikan penghapusan slot.
 * @param {HTMLElement} buttonElement - Butang 'X' yang diklik.
 */
function removeSlot(buttonElement) {
    buttonElement.closest('.slot-group').remove();
}

/**
 * Menjana struktur borang Jadual Waktu kosong (Isnin-Jumaat).
 */
function renderTimetableForm() {
    const container = document.getElementById('timetable-input-form');
    if (!container) return;

    const days = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];
    let html = '';

    days.forEach(day => {
        html += `
            <div class="day-section card mt-2 p-3" data-day="${day}">
                <h5>${day}</h5>
                <div id="slots-${day}-container">
                    ${createSlotHtml()}
                </div>
                <button type="button" class="btn btn-secondary btn-sm mt-2" onclick="addSlot('${day}')">Tambah Slot ${day}</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Mengisi borang Jadual Waktu dengan data sedia ada.
 * @param {Array<Object>} timetableData - Data jadual waktu yang dimuatkan dari Firestore.
 */
function fillTimetableForm(timetableData) {
    if (!timetableData || timetableData.length === 0) {
        showNotification('Tiada data jadual waktu ditemui. Menjana borang kosong.', 'info');
        // Pastikan borang dijana kosong jika tiada data
        renderTimetableForm(); 
        return;
    }

    // Pertama, pastikan struktur borang telah dijana
    renderTimetableForm(); 

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

    showNotification('Jadual Waktu berjaya dimuatkan.', 'success');
}


function loadRPHFormWithData(slotsData) {
    const container = document.getElementById('rph-slots-container');
    if (!container) return;

    container.innerHTML = ''; // Kosongkan kontena

    slotsData.forEach((slot, index) => {
        const slotHtml = `
            <div class="rph-slot-group card mt-3 p-3" data-slot-id="${slot.id || index}">
                <div class="header-slot">
                    <input type="text" name="masa" value="${slot.masa || ''}" readonly>
                    <input type="text" name="subjek" value="${slot.subjek || ''}" readonly>
                    <input type="text" name="kelas" value="${slot.kelas || ''}" readonly>
                </div>
                
                <label for="modul_unit_${index}">Modul / Unit:</label>
                <input type="text" id="modul_unit_${index}" name="modul_unit" value="${slot.modul_unit || ''}" required>

                <label for="standard_kandungan_${index}">Standard Kandungan:</label>
                <textarea id="standard_kandungan_${index}" name="standard_kandungan" required>${slot.standard_kandungan || ''}</textarea>
                
                <label for="standard_pembelajaran_${index}">Standard Pembelajaran:</label>
                <textarea id="standard_pembelajaran_${index}" name="standard_pembelajaran" required>${slot.standard_pembelajaran || ''}</textarea>

                <label for="objektif_${index}">Objektif:</label>
                <textarea id="objektif_${index}" name="objektif" required>${slot.objektif || ''}</textarea>
                
                <label for="aktiviti_${index}">Aktiviti:</label>
                <textarea id="aktiviti_${index}" name="aktiviti" required>${slot.aktiviti || ''}</textarea>
                
                <label for="penilaian_${index}">Penilaian (Assessment):</label>
                <textarea id="penilaian_${index}" name="penilaian" required>${slot.penilaian || ''}</textarea>
                
                <label for="aids_${index}">Bahan Bantu Mengajar (BBM / AIDS):</label>
                <textarea id="aids_${index}" name="aids" required>${slot.aids || ''}</textarea>

                <label for="refleksi_${index}">Refleksi:</label>
                <textarea id="refleksi_${index}" name="refleksi" placeholder="Masukkan refleksi selepas sesi pengajaran">${slot.refleksi || ''}</textarea>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', slotHtml);
    });
}


function getDayNameFromDate(dateInput) {
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    if (isNaN(date)) return "Tarikh Tidak Sah"; 
    return date.toLocaleDateString('ms-MY', { weekday: 'long' }); 
}

function initializeTabSwitching() {
    const tabs = document.querySelectorAll('.btn-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target'); // Menggunakan data-target
            
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


// Expose helper functions to the window object so they can be called from onclick attributes in HTML
window.addSlot = addSlot;
window.removeSlot = removeSlot;


document.addEventListener('DOMContentLoaded', () => {
    initializeTabSwitching();

    const rphForm = document.getElementById('rph-form');
    if (rphForm) {
        rphForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.saveRPHDraft(); // Panggil fungsi simpan draf dari guru_rph_logic.js
        });
    }

    const submitRphBtn = document.getElementById('submit-rph-btn');
    if (submitRphBtn) {
        submitRphBtn.addEventListener('click', () => {
            window.submitRPH(); // Panggil fungsi serah RPH dari guru_rph_logic.js
        });
    }

});
