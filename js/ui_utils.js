// =======================================================
// UI UTILITIES LOGIC (js/ui_utils.js)
// Fail ini mengandungi semua fungsi UI dan helper
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
            editBtn.onclick = () => window.loadRPHtoEdit(item.id); 
            actionCell.appendChild(editBtn);
        }
    });
}

// ------------------------------------------------------------------
// FUNGSI JADUAL WAKTU 
// ------------------------------------------------------------------

function generateTimetableForm(existingData = []) {
    const daysOfWeek = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];
    let html = '';
    
    daysOfWeek.forEach(day => {
        const dayData = existingData.find(d => d.day === day) || { day: day, slots: [{ time: '', subject: '', class: '' }] };
        
        html += `<div class="day-section card mt-2" data-day="${day}">
            <h4>${day}</h4>
            <div class="slots-container" id="slots-${day}">`;
            
        dayData.slots.forEach((slot, index) => {
            html += generateSlotInput(day, index, slot);
        });

        html += `</div>
            <button type="button" class="btn btn-secondary btn-sm mt-1" onclick="addTimeSlot('${day}')">+ Tambah Slot</button>
        </div>`;
    });

    return `<form id="timetable-form">${html}</form>`;
}

function generateSlotInput(day, index, slotData = { time: '', subject: '', class: '' }) {
    return `<div class="input-group slot-group mb-2" data-index="${index}">
        <input type="text" placeholder="Masa (cth: 0800-0900)" name="time" value="${slotData.time}" required>
        <input type="text" placeholder="Mata Pelajaran (BM, SN, MT)" name="subject" value="${slotData.subject}" required>
        <input type="text" placeholder="Kelas (4 Anggun)" name="class" value="${slotData.class}" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeTimeSlot(this)">Hapus</button>
    </div>`;
}

window.addTimeSlot = function(day) {
    const container = document.getElementById(`slots-${day}`);
    const index = container.children.length;
    container.insertAdjacentHTML('beforeend', generateSlotInput(day, index));
}

window.removeTimeSlot = function(buttonElement) {
    buttonElement.closest('.slot-group').remove();
}


// ------------------------------------------------------------------
// FUNGSI RPH GENERATION (BARU)
// ------------------------------------------------------------------

/**
 * [FUNGSI BARU] generateRPHSlotInput(slotData, subjectData, slotIndex)
 * Menjana satu set medan input untuk satu slot RPH.
 */
function generateRPHSlotInput(slotData, subjectData, slotIndex) {
    // SubjectData mengandungi tatasusunan SK dan SP. Kita perlukan SK unik sahaja.
    const skOptions = subjectData ? [...new Set(subjectData.map(item => item.SK))] : [];
    const subjectCode = slotData.subject.toLowerCase();
    
    let html = `<div class="rph-slot-group card-slot mt-3 p-3 border" data-slot-index="${slotIndex}" data-subject-code="${subjectCode}">
        <input type="hidden" name="time" value="${slotData.time}">
        <input type="hidden" name="subject" value="${slotData.subject}">
        <input type="hidden" name="class" value="${slotData.class}">
        
        <h4>${slotData.time} - ${slotData.subject} (${slotData.class})</h4>
        
        <div class="form-group">
            <label for="sk-${slotIndex}">Standard Kandungan (SK):</label>
            <select id="sk-${slotIndex}" name="sk" class="form-control select-sk" data-target-sp="#sp-${slotIndex}" required>
                <option value="">-- Pilih SK --</option>
                ${skOptions.map(sk => `<option value="${sk}">${sk}</option>`).join('')}
            </select>
        </div>

        <div class="form-group">
            <label for="sp-${slotIndex}">Standard Pembelajaran (SP):</label>
            <select id="sp-${slotIndex}" name="sp" class="form-control" required>
                <option value="">-- Pilih SP --</option>
                </select>
        </div>
        
        <div class="form-group">
            <label for="aktiviti-${slotIndex}">Aktiviti Pembelajaran:</label>
            <textarea id="aktiviti-${slotIndex}" name="aktiviti" class="form-control" rows="3" placeholder="Contoh: Perbincangan berkumpulan, Pembentangan"></textarea>
        </div>

        <div class="form-group">
            <label for="refleksi-${slotIndex}">Refleksi:</label>
            <textarea id="refleksi-${slotIndex}" name="refleksi" class="form-control" rows="2" placeholder="Contoh: 30/35 murid menguasai objektif."></textarea>
        </div>
        
    </div>`;
    return html;
}

/**
 * [FUNGSI BARU] displayRPHSlots(slotsArray, subjectDataMap)
 * Menjana borang RPH penuh berdasarkan slot dan data SP.
 */
function displayRPHSlots(slotsArray, subjectDataMap) {
    const container = document.getElementById('rph-slots-container');
    container.innerHTML = '';
    
    slotsArray.forEach((slot, index) => {
        const subjectCode = slot.subject.toLowerCase();
        const subjectData = subjectDataMap[subjectCode];
        
        // Hanya jana jika data subjek ditemui
        if (subjectData) {
            container.insertAdjacentHTML('beforeend', generateRPHSlotInput(slot, subjectData, index));
        } else {
            container.insertAdjacentHTML('beforeend', `<p class="alert alert-warning">Amaran: Data untuk subjek ${slot.subject} tidak ditemui (Fail JSON hilang).</p>`);
        }
    });
    
    // Inisialisasi event listener untuk dropdown SK/SP selepas borang dijana
    initializeRPHSelectListeners(subjectDataMap);
}

/**
 * [FUNGSI BARU] initializeRPHSelectListeners(subjectDataMap)
 * Mengendalikan logik bersarang dropdown (SK dipilih -> SP diisi).
 */
function initializeRPHSelectListeners(subjectDataMap) {
    document.querySelectorAll('.select-sk').forEach(selectSK => {
        
        // Hapus listener lama jika ada (untuk borang yang dijana semula)
        selectSK.removeEventListener('change', updateSPDropdown);
        
        // Tambah listener baru
        selectSK.addEventListener('change', updateSPDropdown);
    });

    // Pasang subjectDataMap ke window untuk diakses oleh listener
    window.subjectDataMap = subjectDataMap;
}

/**
 * Fungsi callback untuk listener SK/SP
 */
function updateSPDropdown(event) {
    const selectSK = event.target;
    const selectedSK = selectSK.value;
    const selectSP = document.querySelector(selectSK.getAttribute('data-target-sp'));
    const slotGroup = selectSK.closest('.rph-slot-group');
    const subjectCode = slotGroup.getAttribute('data-subject-code');
    const subjectData = window.subjectDataMap[subjectCode];
    
    selectSP.innerHTML = '<option value="">-- Pilih SP --</option>'; // Kosongkan SP

    if (selectedSK && subjectData) {
        // Tapis SP yang sepadan dengan SK yang dipilih
        const spOptions = subjectData
            .filter(item => item.SK === selectedSK)
            .map(item => item.SP);

        // Tambah pilihan SP
        spOptions.forEach(sp => {
            selectSP.innerHTML += `<option value="${sp}">${sp}</option>`;
        });
    }
}


// ------------------------------------------------------------------
// FUNGSI UMUM DAN LISTENER
// ------------------------------------------------------------------

function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

function handleFormSubmission(event) {
    event.preventDefault();
    
    const action = event.submitter.getAttribute('data-action');
    
    // TODO: Fungsi ini perlu dikemaskini untuk mengumpul data RPH sebenar
    const rphData = {
        date: document.getElementById('rph-date').value,
        id: document.getElementById('rph-document-id').value,
        slots_data: collectRPHSlotsData() // Panggil fungsi baru
    };

    const status = (action === 'draft') ? 'Draf' : 'Menunggu Semakan';
    
    if (typeof saveRPH !== 'undefined') {
        saveRPH(rphData, status);
    } else {
        showNotification("Ralat sistem: Fungsi saveRPH tidak ditemui.", 'error');
    }
}

/**
 * [FUNGSI BARU] collectRPHSlotsData()
 * Mengumpul semua data dari borang RPH Slot (SK, SP, Aktiviti, Refleksi).
 */
function collectRPHSlotsData() {
    const slotsData = [];
    document.querySelectorAll('.rph-slot-group').forEach(slotGroup => {
        const slot = {
            time: slotGroup.querySelector('input[name="time"]').value,
            subject: slotGroup.querySelector('input[name="subject"]').value,
            class: slotGroup.querySelector('input[name="class"]').value,
            sk: slotGroup.querySelector('select[name="sk"]').value,
            sp: slotGroup.querySelector('select[name="sp"]').value,
            aktiviti: slotGroup.querySelector('textarea[name="aktiviti"]').value,
            refleksi: slotGroup.querySelector('textarea[name="refleksi"]').value
        };
        slotsData.push(slot);
    });
    return slotsData;
}


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

function collectTimetableFormData() {
    // Logik sedia ada...
    const timetableData = [];
    const daySections = document.querySelectorAll('#timetable-form-container .day-section');

    daySections.forEach(daySection => {
        const day = daySection.getAttribute('data-day');
        const slots = [];
        
        daySection.querySelectorAll('.slot-group').forEach(slotGroup => {
            const slot = {};
            
            slotGroup.querySelectorAll('input').forEach(input => {
                slot[input.name] = input.value.trim();
            });

            if (slot.time && slot.subject && slot.class) {
                slots.push(slot);
            }
        });

        timetableData.push({ day, slots });
    });

    return timetableData.filter(d => d.slots.length > 0);
}

function getDayNameFromDate(dateInput) {
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
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
