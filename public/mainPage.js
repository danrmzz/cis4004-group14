import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

let auth, db;

// Function to check authentication state
const checkAuthState = () => {
  if (!auth) {
    console.error("Auth is not initialized yet.");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await updateGreeting(user);
    } else {
      window.location.href = "index.html"; // Redirect if not logged in
    }
  });
};

// Fetch Firebase config from backend
fetch('/api/firebase-config')
  .then(response => response.json())
  .then(config => {
    // Initialize Firebase with fetched config
    const firebaseConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      measurementId: config.measurementId
    };

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    console.log("Firebase Initialized:", app);
    checkAuthState(); // ✅ Now this function is defined before being called
  })
  .catch(error => console.error('Error fetching Firebase config:', error));


const greetingElement = document.getElementById("greeting");
const logoutBtn = document.getElementById("logoutBtn");

const storedName = localStorage.getItem("username");
if (storedName) {
  greetingElement.textContent = `Welcome Back, ${storedName}!`;
} else {
  greetingElement.textContent = "Welcome Back!";
}

const logoutUser = async () => {
  const auth = getAuth();
  try {
    await signOut(auth);

    localStorage.removeItem("username");

    alert("You have been logged out successfully!");

    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout failed:", error.message);
  }
};

if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutUser);
}

const updateGreeting = async (user) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();

    localStorage.setItem("username", userData.name);

    greetingElement.textContent = `Welcome Back, ${userData.name}!`;
  }
};
