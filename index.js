import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { firebaseConfig } from "./env.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
const auth = getAuth(app); // Get Firebase Auth instance

// DOM Elements
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");

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
