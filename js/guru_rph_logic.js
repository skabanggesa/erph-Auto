// guru_rph_logic.js - Versi Dikemaskini
// Mengendalikan logik utama, pemuatan data, dan semakan tahun/subjek.

// (Fungsi showNotification hanya untuk tujuan ujian/debug di sini, fungsi sebenar berada dalam ui_utils.js)
// function showNotification(message, type = 'info') {
//     console.log(`[NOTIFIKASI - ${type.toUpperCase()}]: ${message}`);
// }

// Fungsi untuk mendapatkan nilai yang dipilih (Anda perlu sesuaikan pengambil nilai ini)
function getSelectedSubject() {
    // Andaikan elemen <select> subjek mempunyai id 'subject_select'
    return document.getElementById('subject_select')?.value || '';
}

function getSelectedYear() {
    // Andaikan elemen <select> tahun mempunyai id 'year_select'
    const yearValue = document.getElementById('year_select')?.value || ''; // Cth: TAHUN_4
    const yearNumber = parseInt(yearValue.replace('TAHUN_', ''));
    return { value: yearValue, number: isNaN(yearNumber) ? 0 : yearNumber };
}

async function loadSubjectData(subjectCode) {
    const filePath = `data/sp-${subjectCode.toLowerCase()}.json`;
    
    try {
        const response = await fetch(filePath);
        
        // 💡 PEMBAIKAN: Semak respons HTTP (Menangkap 404 Not Found)
        if (!response.ok) {
            showNotification(`Ralat: Gagal memuatkan fail data untuk subjek ${subjectCode}. (Kod ${response.status})`, 'error');
            return null;
        }
        
        return await response.json();
        
    } catch (error) {
        showNotification(`Ralat memuatkan data: ${error.message}`, 'error');
        console.error("Ralat memuatkan fail JSON:", error);
        return null;
    }
}

// Fungsi utama yang dipanggil apabila butang Jana RPH ditekan
async function generateRPHData() {
    const selectedSubject = getSelectedSubject();
    const selectedYear = getSelectedYear();
    
    // Semak Subjek dan Tahun dipilih
    if (!selectedSubject || selectedYear.number === 0) {
        showNotification("Sila pilih Subjek dan Tahun yang sah.", 'warning');
        return;
    }

    // 💡 PEMBAIKAN: Logik Semakan Tahun untuk RBT/Sejarah
    if ((selectedSubject.toUpperCase() === 'RBT' || selectedSubject.toUpperCase() === 'SEJARAH') && selectedYear.number < 4) {
        showNotification(`RPH ${selectedSubject} hanya disokong untuk Tahun 4 dan ke atas.`, 'warning');
        return; // Hentikan proses
    }

    showNotification("RPH sedang dijana...", 'info');

    const subjectData = await loadSubjectData(selectedSubject);
    
    // 💡 PEMBAIKAN: Semak Data Muatan Gagal
    if (subjectData === null) {
        return; // Hentikan proses jika data gagal dimuatkan
    }
    
    // Dapatkan data mengikut tahun yang dipilih
    const selectedYearData = subjectData[selectedYear.value];

    // 💡 PEMBAIKAN: Semak Kunci Tahun Tidak Wujud
    if (!selectedYearData) {
        showNotification(`Tiada data RPH ditemui untuk ${selectedSubject} ${selectedYear.value}.`, 'warning');
        return;
    }
    
    // Kita anggap 'topics' adalah Array data yang perlu di-map (seperti dalam sp-rbt.json)
    const dataForDisplay = selectedYearData.topics;

    if (dataForDisplay && Array.isArray(dataForDisplay)) {
        displayRPHSlots(dataForDisplay); // Fungsi UI (dalam ui_utils.js)
        showNotification("RPH berjaya dijana dan dipaparkan.", 'success');
    } else {
         showNotification("Struktur data tidak lengkap (tiada topik/Array ditemui).", 'error');
         console.error("Data For Display tidak dalam format Array:", dataForDisplay);
    }
}

// Anda perlu mengaitkan generateRPHData() dengan butang Jana RPH anda.
// Contoh:
// document.getElementById('jana_rph_btn').addEventListener('click', generateRPHData);
