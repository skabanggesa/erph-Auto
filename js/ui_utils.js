// =======================================================
// UI UTILITIES LOGIC (js/ui_utils.js)
// Kemas kini: Tukar dropdown kepada textarea auto-isi untuk RPH
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
        if (container) {
             container.insertBefore(notificationDiv, container.firstChild.nextSibling || container.firstChild); 
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
        notificationDiv.textContent = '';
    }, 5000);
}

/**
 * [FUNGSI WAJIB] displayRPHList(dataArray, tableId)
 * Menjana dan memaparkan senarai data RPH secara dinamik.
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
// FUNGSI JADUAL WAKTU (TIMETABLE)
// ------------------------------------------------------------------

function generateTimetableForm(existingData = []) {
    const daysOfWeek = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];
    let html = '';
    
    daysOfWeek.forEach(day => {
        const dayData = existingData.find(d => d.day === day) || { day: day, slots: [{ time: '', subject: '', class: '' }] };
        
        html += `<div class="day-section card mt-2" data-day="${day}">
            <h4>${day}</h4>
            <div class="slots-container" id="slots-${day}">`;
            
        const slotsToRender = dayData.slots.length > 0 ? dayData.slots : [{ time: '', subject: '', class: '' }];

        slotsToRender.forEach((slot, index) => {
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
    if (!container) return;
    const index = container.children.length;
    container.insertAdjacentHTML('beforeend', generateSlotInput(day, index));
}

window.removeTimeSlot = function(buttonElement) {
    buttonElement.closest('.slot-group').remove();
}

function collectTimetableFormData() {
    const timetableData = [];
    const daySections = document.querySelectorAll('#timetable-form .day-section'); 

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


// ------------------------------------------------------------------
// FUNGSI RPH GENERATION 
// ------------------------------------------------------------------

/**
 * Menjana satu set medan input untuk satu slot RPH, dengan pra-isian automatik.
 * @param {Object} slotData - Data slot waktu (time, subject, class).
 * @param {Array} subjectData - Data SP yang telah diflatkan untuk subjek slot ini.
 */
function generateRPHSlotInput(slotData, subjectData, slotIndex) {
    const subjectCode = slotData.subject.toLowerCase();
    
    // Auto-pilih pelajaran pertama sebagai cadangan (Default Lesson)
    // Jika data gagal diproses, defaultLesson akan menjadi null
    const defaultLesson = subjectData && Array.isArray(subjectData) && subjectData.length > 0 ? subjectData[0] : null;

    // Nilai-nilai Praisi. Guna join('\n') untuk array dipaparkan dalam textarea.
    const skValue = defaultLesson?.SK || '';
    const spValue = defaultLesson?.SP || '';
    const activitiesValue = defaultLesson?.activities?.join('\n') || '';
    const assessmentValue = defaultLesson?.assessment?.join('\n') || ''; // Penilaian
    const aidsValue = defaultLesson?.aids?.join('\n') || ''; // Bahan Bantu Mengajar

    let html = `<div class="rph-slot-group card-slot mt-3 p-3 border" data-slot-index="${slotIndex}" data-subject-code="${subjectCode}">
        <input type="hidden" name="time" value="${slotData.time}">
        <input type="hidden" name="subject" value="${slotData.subject}">
        <input type="hidden" name="class" value="${slotData.class}">
        
        <h4>${slotData.time} - ${slotData.subject} (${slotData.class})</h4>
        
        <div class="form-group">
            <label for="sk-${slotIndex}">Standard Kandungan (SK):</label>
            <textarea id="sk-${slotIndex}" name="sk" class="form-control" rows="1" placeholder="Masukkan SK (cth: RBT.1.1.1)" required>${skValue}</textarea>
        </div>

        <div class="form-group">
            <label for="sp-${slotIndex}">Standard Pembelajaran (SP):</label>
            <textarea id="sp-${slotIndex}" name="sp" class="form-control" rows="2" placeholder="Masukkan SP (cth: Murid dapat mengenal pasti...)" required>${spValue}</textarea>
        </div>
        
        <div class="form-group">
            <label for="aktiviti-${slotIndex}">Aktiviti Pembelajaran:</label>
            <textarea id="aktiviti-${slotIndex}" name="aktiviti" class="form-control" rows="3" placeholder="Contoh: Perbincangan berkumpulan, Pembentangan">${activitiesValue}</textarea>
        </div>
        
        <div class="form-group">
            <label for="penilaian-${slotIndex}">Penilaian:</label>
            <textarea id="penilaian-${slotIndex}" name="penilaian" class="form-control" rows="2" placeholder="Contoh: Senarai semak, Pemerhatian guru">${assessmentValue}</textarea>
        </div>

        <div class="form-group">
            <label for="bantuan-${slotIndex}">Bahan Bantu Mengajar (BBM):</label>
            <textarea id="bantuan-${slotIndex}" name="aids" class="form-control" rows="2" placeholder="Contoh: Kad nombor, Carta minda berkumpulan">${aidsValue}</textarea>
        </div>


        <div class="form-group">
            <label for="refleksi-${slotIndex}">Refleksi:</label>
            <textarea id="refleksi-${slotIndex}" name="refleksi" class="form-control" rows="2" placeholder="Contoh: 30/35 murid menguasai objektif."></textarea>
        </div>
        
    </div>`;
    return html;
}

/**
 * Menjana borang RPH penuh berdasarkan slot dan data SP.
 */
function displayRPHSlots(slotsArray, subjectDataMap) {
    const container = document.getElementById('rph-slots-container'); 
    if (!container) return; 
    
    container.innerHTML = '';
    
    slotsArray.forEach((slot, index) => {
        const subjectCode = slot.subject.toLowerCase();
        const allSubjectData = subjectDataMap[subjectCode]; 
        
        if (allSubjectData && Array.isArray(allSubjectData)) {
            container.insertAdjacentHTML('beforeend', generateRPHSlotInput(slot, allSubjectData, index));
        } else if (allSubjectData === null) {
             container.insertAdjacentHTML('beforeend', `<div class="rph-slot-group card-slot mt-3 p-3 border"><p class="alert alert-danger">Ralat: Data SP untuk subjek ${slot.subject} gagal dimuatkan atau diproses. Sila isi manual.</p></div>`);
        } 
    });
    
    // Tiada lagi event listener untuk dropdown kerana kita guna textarea auto-isi
}

// ------------------------------------------------------------------
// FUNGSI UMUM DAN HELPER
// ------------------------------------------------------------------

function handleFormSubmission(event) {
    event.preventDefault();
    
    const action = event.submitter ? event.submitter.getAttribute('data-action') : 'draft'; 
    
    const rphData = {
        date: document.getElementById('rph-date').value,
        id: document.getElementById('rph-document-id').value,
        slots_data: collectRPHSlotsData()
    };

    const status = (action === 'draft') ? 'Draf' : 'Menunggu Semakan';
    
    if (typeof saveRPH !== 'undefined') {
        saveRPH(rphData, status);
    } else {
        showNotification("Ralat sistem: Fungsi saveRPH tidak ditemui.", 'error');
    }
}

function collectRPHSlotsData() {
    const slotsData = [];
    document.querySelectorAll('.rph-slot-group').forEach(slotGroup => {
        const slot = {
            time: slotGroup.querySelector('input[name="time"]').value,
            subject: slotGroup.querySelector('input[name="subject"]').value,
            class: slotGroup.querySelector('input[name="class"]').value,
            // Semua medan kini dikumpul dari TEXTAREA
            sk: slotGroup.querySelector('textarea[name="sk"]').value, 
            sp: slotGroup.querySelector('textarea[name="sp"]').value, 
            aktiviti: slotGroup.querySelector('textarea[name="aktiviti"]').value,
            penilaian: slotGroup.querySelector('textarea[name="penilaian"]').value, // Medan Baharu
            aids: slotGroup.querySelector('textarea[name="aids"]').value, // Medan Baharu (BBM)
            refleksi: slotGroup.querySelector('textarea[name="refleksi"]').value
        };
        slotsData.push(slot);
    });
    return slotsData;
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

    const rphForm = document.getElementById('rph-form'); 
    if (rphForm) {
        rphForm.addEventListener('submit', handleFormSubmission);
    }
});
