import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    authDomain: "zaza-football-pool.firebaseapp.com",
    projectId: "zaza-football-pool",
    storageBucket: "zaza-football-pool.firebasestorage.app",
    messagingSenderId: "990184896145",
    appId: "1:990184896145:web:b725852f28c41e794e7130",
    measurementId: "G-4X4K91GY2X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
