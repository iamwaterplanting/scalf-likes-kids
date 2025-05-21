// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "XXXXXXXXXXXX",
    appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firestore instance
const db = firebase.firestore();

// Export Firestore instance
window.FirebaseDB = db; 