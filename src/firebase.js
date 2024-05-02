import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage, ref } from "firebase/storage"

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAmtYwsNn7J5bSqFKuL7LU4bOE5o6yA5Ac",
  authDomain: "manov-98bc5.firebaseapp.com",
  projectId: "manov-98bc5",
  storageBucket: "manov-98bc5.appspot.com",
  messagingSenderId: "619928868535",
  appId: "1:619928868535:web:977add40dd54530c405f32",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const firestore = getFirestore(app)
export const auth = getAuth(app)

// Export auth
export const storage = getStorage(app)
export const storageRef = ref(storage)

// Create Firestore Collections
export const usersCollection = collection(firestore, "users")
