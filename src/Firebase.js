import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Note: "etsuji-react-test" is a non-existent project.
const firebaseConfig = {
  apiKey: "AIzaSyDB2J-T-Z90b-Oe8zF6YMHFTSso-DazTek",
  authDomain: "terraform-001-490014.firebaseapp.com",
  projectId: "terraform-001-490014",
  storageBucket: "terraform-001-490014.firebasestorage.app",
  messagingSenderId: "932824339316",
  appId:  "1:932824339316:web:5ba179b9750a1d4fad5221",
  measurementId: "G-VZDY6DYL7V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  signInWithPopup(auth, provider)
    .catch((error) => {console.log(error)})
};

export const projectId = firebaseConfig.projectId;

// If you want to add a handler.
//
//export const signInWithGoogle = (handler) => {
//  return () => {
//    signInWithPopup(auth, provider).then(handler)
//    .catch((error) => {console.log(error)})
//  };
//};
