import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

let auth, provider, db;

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
    provider = new GoogleAuthProvider();
    db = getFirestore(app);

    console.log("Firebase Initialized:", app);
  })
  .catch(error => console.error('Error fetching Firebase config:', error));

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

    // Save user to Firebase Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      name: name,
      createdAt: new Date(),
    });

    // Also save user to MySQL database
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: name
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error('Failed to save user to MySQL:', data.message);
      } else {
        console.log('User saved to MySQL successfully');
        
        // Create a default checking account for the new user
        const accountResponse = await fetch('/api/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseUid: user.uid,
            accountType: 'checking',
            initialBalance: 0,
            currency: 'USD'
          }),
        });
        
        const accountData = await accountResponse.json();
        if (!accountData.success) {
          console.error('Failed to create default account:', accountData.message);
        } else {
          console.log('Default account created successfully');
        }
      }
    } catch (dbError) {
      console.error('Error saving to MySQL:', dbError);
      // Continue with login even if MySQL save fails
    }

    // Store username locally for instant display
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

    // Save to Firebase Firestore
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email,
        name: name,
        createdAt: new Date(),
      },
      { merge: true }
    );

    // Also save to MySQL database
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: name
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error('Failed to save Google user to MySQL:', data.message);
      } else {
        console.log('Google user saved to MySQL successfully');
        
        // Check if user already has accounts
        const accountsResponse = await fetch(`/api/users/${user.uid}/accounts`);
        const accountsData = await accountsResponse.json();
        
        // If no accounts exist, create a default checking account
        if (accountsData.success && (!accountsData.accounts || accountsData.accounts.length === 0)) {
          const accountResponse = await fetch('/api/accounts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebaseUid: user.uid,
              accountType: 'checking',
              initialBalance: 0,
              currency: 'USD'
            }),
          });
          
          const accountData = await accountResponse.json();
          if (!accountData.success) {
            console.error('Failed to create default account:', accountData.message);
          } else {
            console.log('Default account created successfully');
          }
        }
      }
    } catch (dbError) {
      console.error('Error saving Google user to MySQL:', dbError);
      // Continue with login even if MySQL save fails
    }

    localStorage.setItem("username", name);

    window.location.href = "mainPage.html";
  } catch (error) {
    console.error("Google Sign-In Error:", error.message);
    alert("Error: " + error.message);
  }
};

// Login
loginBtn.addEventListener("click", async () => {
  let identifier = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  try {
    let email = identifier;

    if (!identifier.includes("@")) {
      const usersQuery = query(
        collection(db, "users"),
        where("name", "==", identifier)
      );
      const querySnapshot = await getDocs(usersQuery);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        email = userDoc.data().email;
      } else {
        throw new Error("Username not found.");
      }
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    const user = userCredential.user;
    
    // Ensure user exists in MySQL database during login
    try {
      // Check if user exists
      const userResponse = await fetch(`/api/users/${user.uid}`);
      const userData = await userResponse.json();
      
      if (!userData.success) {
        // User doesn't exist in MySQL, create them
        console.log('User not found in MySQL, creating...');
        
        let userName = "";
        if (!identifier.includes("@")) {
          userName = identifier;
        } else {
          const usersQuery = query(
            collection(db, "users"),
            where("email", "==", email)
          );
          const querySnapshot = await getDocs(usersQuery);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            userName = userDoc.data().name;
          }
        }
        
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseUid: user.uid,
            email: user.email,
            name: userName || "User"
          }),
        });
        
        const createData = await createResponse.json();
        if (!createData.success) {
          console.error('Failed to create user in MySQL:', createData.message);
        } else {
          console.log('User created in MySQL successfully during login');
        }
      } else {
        console.log('User found in MySQL database');
      }
    } catch (dbError) {
      console.error('Error checking/creating user in MySQL:', dbError);
      // Continue with login even if MySQL operations fail
    }
    
    if (!identifier.includes("@")) {
      localStorage.setItem("username", identifier);
    } else {
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(usersQuery);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        localStorage.setItem("username", userDoc.data().name);
      }
    }

    window.location.href = "mainPage.html";
  } catch (error) {
    alert("Error: " + error.message);
  }
});

googleSignInBtn.addEventListener("click", signInWithGoogle);
googleSignUpBtn.addEventListener("click", signInWithGoogle);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();

    const loginContainer = document.getElementById("loginContainer");
    const registerContainer = document.getElementById("registerContainer");

    if (loginContainer.classList.contains("visible")) {
      loginBtn.click();
    } else if (registerContainer.classList.contains("visible")) {
      registerBtn.click();
    }
  }
});