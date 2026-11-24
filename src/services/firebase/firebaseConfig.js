import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage";
import { getAuth} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAaFuN3BBEo-jcLIC2zCVax8_D_OAaUki4",
    authDomain: "rudy-web-app.firebaseapp.com",
    projectId: "rudy-web-app",
    storageBucket: "rudy-web-app.firebasestorage.app",
    messagingSenderId: "1076232877506",
    appId: "1:1076232877506:web:79e6f8ae4cb2f18917525b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore();
//const storage = getStorage(app)
const auth = getAuth(app);


export {db, auth}



