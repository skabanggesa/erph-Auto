// Firebase modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Konfigurasi Firebase projek anda
const firebaseConfig = {
  apiKey: "AIzaSyAo-FyVocjOa8rD-ALoTeDdkJCqDyvQSt0",
  authDomain: "erph-auto.firebaseapp.com",
  projectId: "erph-auto",
  storageBucket: "erph-auto.firebasestorage.app",
  messagingSenderId: "28301521058",
  appId: "1:28301521058:web:47cd64e3cf098e2cb067fb",
  measurementId: "G-NV65Z5R7JH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Peta nama matapelajaran → nama fail JSON
// Dikekalkan sebagai global kerana mungkin digunakan dalam fail lain tanpa import
window.MAP_SUBJECT_TO_FILE = {
  'Bahasa Melayu': 'bm',
  'Bahasa Inggeris': 'bi',
  'Matematik': 'mt',
  'Sains': 'sn',
  'Pendidikan Islam': 'pai',
  'Buddha Agama': 'ba', // Sesuaikan jika nama sebenar berbeza
  'Sejarah': 'sj',
  'Pendidikan Jasmani': 'pj',
  'Pendidikan Kesihatan': 'pk',
  'Muzik': 'mz',
  'Pendidikan Seni Visual': 'psv',
  'Reka Bentuk dan Teknologi': 'rbt',
  'Pravocational': 'pra' // atau "Pravocational Studies", dsb.
};

// Fungsi untuk dapatkan URL template JSON dari GitHub
const getTemplateUrl = (subjectDisplayName) => { // <--- TELAH DIUBAH SUAI
  const filename = window.MAP_SUBJECT_TO_FILE[subjectDisplayName];
  if (!filename) {
    console.warn(`Tiada template untuk matapelajaran: ${subjectDisplayName}`);
    return null;
  }
  return `https://raw.githubusercontent.com/skabanggesa/erph-Auto/main/templates/rph/${filename}.json`;
};

// Eksport untuk modular JS
export { app, auth, db, getTemplateUrl }; // <--- TELAH DIUBAH SUAI
