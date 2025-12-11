// config.js (KOD LENGKAP & DIKEMASKINI)

// Firebase modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Konfigurasi Firebase projek anda
const firebaseConfig = {
  apiKey: "AIzaSyAo-FyVocjOa8rD-ALoTeDdkJCqDyvQSt0", // Gantikan dengan kunci anda yang sebenar
  authDomain: "erph-auto.firebaseapp.com",
  projectId: "erph-auto",
  storageBucket: "erph-auto.firebasestorage.app",
  messagingSenderId: "28301521058",
  appId: "1:28301521058:web:47cd64e3cf098e2cb067fb",
  measurementId: "G-NV65Z5R7JH"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig); // <<< KRITIKAL: app kini dieksport
export const auth = getAuth(app);
export const db = getFirestore(app);

// Peta nama matapelajaran → nama fail JSON
// Dikekalkan sebagai global kerana mungkin digunakan dalam fail lain
export const MAP_SUBJECT_TO_FILE = {
  // BAHASA
  'BM': 'bm', 
  'Bahasa Melayu': 'bm',

  'BI': 'bi', 
  'Bahasa Inggeris': 'bi',

  // STEM
  'MT': 'mt', 
  'Matematik': 'mt',

  'SN': 'sn', 
  'Sains': 'sn',

  // PENDIDIKAN
  'PAI': 'pai', 
  'Pendidikan Islam': 'pai',
  
  'BA': 'ba', 
  'Buddha Agama': 'ba', 

  // SUBJEK LAIN
  'SJ': 'sj', 
  'Sejarah': 'sj',

  'PJ': 'pj', 
  'Pendidikan Jasmani': 'pj',

  'PK': 'pk', 
  'Pendidikan Kesihatan': 'pk',

  'MZ': 'mz', 
  'Muzik': 'mz',
  
  'PSV': 'psv', 
  'Pendidikan Seni Visual': 'psv',

  'RBT': 'rbt', 
  'Reka Bentuk dan Teknologi': 'rbt',

  'Pra': 'pra', 
  'Pravocational': 'pra' 
};

// ... (Jika ada fungsi lain di bawah, letakkannya di sini dan eksport jika perlu)
