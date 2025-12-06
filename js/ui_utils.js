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
            // Panggil window.loadRPHtoEdit yang telah dikemas kini
            editBtn.onclick = () => window.loadRPHtoEdit(item.id); 
            actionCell.appendChild(editBtn);
        }
    });
}

// ------------------------------------------------------------------
// FUNGSI JADUAL WAKTU (TIMETABLE) 
// ------------------------------------------------------------------

/**
 * Menjana borang HTML input Jadual Waktu.
 */
function generateTimetableForm(existingData = []) {
    console.log("Mula menjana borang Jadual Waktu. Data sedia ada:", existingData.length); 
    const daysOfWeek = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];
    let html = '';
    
    daysOfWeek.forEach(day => {
        // Ambil data sedia ada atau sediakan slot kosong jika tiada data
        const dayData = existingData.find(d => d.day === day) || { day: day, slots: [{ time: '', subject: '', class: '' }] };
        
        html += `<div class="day-section card mt-2" data-day="${day}">
            <h4>${day}</h4>
            <div class="slots-container" id="slots-${day}">`;
            
        // Pastikan ada sekurang-kurangnya satu slot untuk borang kosong
        const slotsToRender = dayData.slots.length > 0 ? dayData.slots : [{ time: '', subject: '', class: '' }];

        slotsToRender.forEach((slot, index) => {
            html += generateSlotInput(day, index, slot);
        });

        html += `</div>
            <button type="button" class="btn btn-secondary btn-sm mt-1" onclick="addTimeSlot('${day}')">+ Tambah Slot</button>
        </div>`;
    });

    const formHTML = `<form id="timetable-form">${html}</form>`;
    console.log("Borang Jadual Waktu Selesai Dijana. Panjang HTML:", formHTML.length); 
    return formHTML; 
}
window.generateTimetableForm = generateTimetableForm; 

/**
 * Menjana HTML untuk satu slot waktu.
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
 * Menambah slot waktu baharu ke dalam borang.
 */
window.addTimeSlot = function(day) {
    const container = document.getElementById(`slots-${day}`);
    if (!container) return;
    const index = container.children.length;
    container.insertAdjacentHTML('beforeend', generateSlotInput(day, index));
}

/**
 * Menghapus slot waktu dari borang.
 */
window.removeTimeSlot = function(buttonElement) {
    buttonElement.closest('.slot-group').remove();
}

/**
 * Mengumpul data dari borang Jadual Waktu.
 */
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
window.collectTimetableFormData = collectTimetableFormData; 


// ------------------------------------------------------------------
// FUNGSI RPH GENERATION DAN EDIT
// ------------------------------------------------------------------

/**
 * Menjana satu set medan input untuk satu slot RPH, dengan pra-isian automatik (atau data draf).
 */
function generateRPHSlotInput(slotData, subjectData, slotIndex) {
    const subjectCode = slotData.subject.toLowerCase();
    
    // Auto-pilih pelajaran pertama sebagai cadangan (Default Lesson)
    const defaultLesson = subjectData && Array.isArray(subjectData) && subjectData.length > 0 ? subjectData[0] : null;

    // Gunakan data sedia ada (dari slotData) atau fallback kepada cadangan auto
    const skValue = slotData.sk || defaultLesson?.SK || '';
    const spValue = slotData.sp || defaultLesson?.SP || '';
    // Jika data adalah array, gabungkan dengan newline. Jika string (dari draf), guna terus.
    const activitiesValue = slotData.aktiviti || defaultLesson?.activities?.join('\n') || ''; 
    const assessmentValue = slotData.penilaian || defaultLesson?.assessment?.join('\n') || ''; 
    const aidsValue = slotData.aids || defaultLesson?.aids?.join('\n') || ''; 
    const refleksiValue = slotData.refleksi || '';


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
            <textarea id="refleksi-${slotIndex}" name="refleksi" class="form-control" rows="2" placeholder="Contoh: 30/35 murid menguasai objektif.">${refleksiValue}</textarea>
        </div>
        
    </div>`;
    return html;
}

/**
 * Menjana borang RPH penuh berdasarkan slot dan data SP. (Diguna untuk Jana RPH baru)
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
}
window.displayRPHSlots = displayRPHSlots;


/**
 * Mengisi semula borang editor RPH menggunakan data yang disimpan. (Diguna untuk Edit Draf)
 */
function loadRPHFormWithData(slots_data) {
    const container = document.getElementById('rph-slots-container'); 
    if (!container || !slots_data || slots_data.length === 0) {
        showNotification("Gagal memuatkan data slot RPH.", 'error');
        return;
    }
    
    container.innerHTML = '';
    
    slots_data.forEach((slot, index) => {
        container.insertAdjacentHTML('beforeend', generateRPHSlotInput(slot, null, index));
    });
}
window.loadRPHFormWithData = loadRPHFormWithData;


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
            sk: slotGroup.querySelector('textarea[name="sk"]').value, 
            sp: slotGroup.querySelector('textarea[name="sp"]').value, 
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
