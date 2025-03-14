import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { firebaseConfig } from "./env.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const greetingElement = document.getElementById("greeting");

const storedName = localStorage.getItem("username");
if (storedName) {
  greetingElement.textContent = `Hello, ${storedName}!`;
} else {
  greetingElement.textContent = "Hello!";
}

const updateGreeting = async (user) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    
    localStorage.setItem("username", userData.name);
    
    greetingElement.textContent = `Hello, ${userData.name}!`;
  }
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await updateGreeting(user);
  } else {
    window.location.href = "index.html"; // redirect if not logged in
  }
});
