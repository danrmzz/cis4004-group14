import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
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
  console.log("h");
  // Hide register container
  registerDiv.classList.remove("visible");
  registerDiv.style.transform = "translateY(100%)";
 
  // Show login container
  loginDiv.classList.add("visible");
  loginDiv.style.transform = "translateY(0)";
});

document.getElementById("reg").addEventListener("click", function () {
  const loginDiv = document.getElementById("loginContainer");
  const registerDiv = document.getElementById("registerContainer");

  // Hide login container
  loginDiv.classList.remove("visible");
  loginDiv.style.transform = "translateY(100%)";
 
  // Show register container
  registerDiv.classList.add("visible");
  registerDiv.style.transform = "translateY(0)";
});




// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const googleSignInBtn = document.getElementById("googleSignIn");
const googleSignUpBtn = document.getElementById("googleRegister");

// Sign Up Function
registerBtn.addEventListener("click", async () => {
  const email = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    alert("Sign Up Successful! Welcome, " + userCredential.user.email);
    window.location.href = "mainPage.html"; // redirect after login
  } catch (error) {
    alert("Error: " + error.message);
  }
});

// Sign Up Function (Google)
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    alert(`Welcome, ${user.displayName}!`);
    window.location.href = "mainPage.html"; // redirect after login
  } catch (error) {
    console.error("Google Sign-In Error:", error.message);
    alert("Error: " + error.message);
  }
};

// Login Function
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    alert("Login Successful! Welcome back, " + userCredential.user.email);
    window.location.href = "mainPage.html"; // redirect after login
  } catch (error) {
    alert("Error: " + error.message);
  }
});

// Attach Event Listeners for Google Sign-In and Sign-Up
googleSignInBtn.addEventListener("click", signInWithGoogle);
googleSignUpBtn.addEventListener("click", signInWithGoogle);
