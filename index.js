import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { firebaseConfig } from "./env.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

document.getElementById("log").addEventListener("click", function () {
  const loginDiv = document.getElementById("loginContainer");
  const registerDiv = document.getElementById("registerContainer");

  // Hide register container
  registerDiv.classList.remove("visible");
  registerDiv.style.transform = "translateX(0px)";

  // Show login container
  loginDiv.classList.add("visible");
  loginDiv.style.transform = "translateX(350px)";
});

document.getElementById("reg").addEventListener("click", function () {
  const loginDiv = document.getElementById("loginContainer");
  const registerDiv = document.getElementById("registerContainer");

  // Hide login container
  loginDiv.classList.remove("visible");
  loginDiv.style.transform = "translateX(0px)";

  // Show register container
  registerDiv.classList.add("visible");
  registerDiv.style.transform = "translateX(350px)";
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// DOM Elements
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const googleSignInBtn = document.getElementById("googleSignIn");
const googleSignUpBtn = document.getElementById("googleRegister");

// Sign Up Email/Password
registerBtn.addEventListener("click", async () => {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const name = document.getElementById("signup-name").value;

  if (!name) {
    alert("Please enter your name.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      name: name,
      createdAt: new Date(),
    });

    // store username locally for instant display
    localStorage.setItem("username", name);

    window.location.href = "mainPage.html";
  } catch (error) {
    alert("Error: " + error.message);
  }
});

// Sign Up Google
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const name = user.displayName || "User";

    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email,
        name: name,
        createdAt: new Date(),
      },
      { merge: true }
    );

    localStorage.setItem("username", name);

    window.location.href = "mainPage.html";
  } catch (error) {
    console.error("Google Sign-In Error:", error.message);
    alert("Error: " + error.message);
  }
};

// Login
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    window.location.href = "mainPage.html"; // redirect after login
  } catch (error) {
    alert("Error: " + error.message);
  }
});

googleSignInBtn.addEventListener("click", signInWithGoogle);
googleSignUpBtn.addEventListener("click", signInWithGoogle);
