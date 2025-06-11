// ✅ Import Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ✅ Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
// ✅ Firebase Realtime Database
import {
  getDatabase,
  ref,
  set
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
  authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
  projectId: "mt-trading-signup-and-log-in",
  storageBucket: "mt-trading-signup-and-log-in.appspot.com",
  messagingSenderId: "101302422584",
  appId: "1:101302422584:web:07d472b05e81a6930beacd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Supabase setup
const supabase = createClient(
  "https://fepujhdzovzbygczdjxe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU"
);

// Form elements
const form = document.getElementById('signup-form');
const errorEls = {
  name: document.getElementById('name-error'),
  surname: document.getElementById('surname-error'),
  birthdate: document.getElementById('birthdate-error'),
  phone: document.getElementById('phone-error'),
  email: document.getElementById('email-error'),
  password: document.getElementById('password-error'),
  confirmPassword: document.getElementById('confirm-password-error'),
  Agent: document.getElementById('Agent-error')
};

function clearErrors() {
  Object.values(errorEls).forEach(el => {
    el.textContent = '';
    el.style.color = 'red';
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

function isValidPhone(phone) {
  return /^0\d{9}$/.test(phone);
}

function isValidAgent(agent) {
  return agent === '' || /^\d{6}$/.test(agent);
}

function isOver18(birthdate) {
  const birth = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  return age > 18 || (age === 18 && m >= 0);
}

async function checkReferralCodeExists(code) {
  // If no code is entered, skip the check
  if (code.trim() === '') {
    return true;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('code')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('Error checking referral code:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('Exception when checking referral code:', err);
    return false;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const name = form.name.value.trim();
  const surname = form.surname.value.trim();
  const birthdate = form.birthdate.value;
  const phone = form.phone.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirmPassword = form['confirm-password'].value;
  const Agent = form.Agent.value.trim();

  let valid = true;

  // Basic validation
  if (!name) errorEls.name.textContent = 'Name is required', valid = false;
  if (!surname) errorEls.surname.textContent = 'Surname is required', valid = false;
  if (!birthdate || !isOver18(birthdate)) errorEls.birthdate.textContent = 'You must be at least 18 years old', valid = false;
  if (!isValidPhone(phone)) errorEls.phone.textContent = 'Phone must be 10 digits starting with 0', valid = false;
  if (!isValidEmail(email)) errorEls.email.textContent = 'Enter a valid email', valid = false;
  if (!isValidPassword(password)) errorEls.password.textContent = 'Password must be 8+ chars with uppercase, lowercase, number, symbol', valid = false;
  if (password !== confirmPassword) errorEls.confirmPassword.textContent = 'Passwords do not match', valid = false;
  
  // Validate Agent format if provided
  if (Agent && !isValidAgent(Agent)) {
    errorEls.Agent.textContent = 'Referral code must be 6 digits';
    valid = false;
  }

  if (!valid) {
    alert('Please correct the errors in the form');
    return;
  }

  // Only check referral code if one was provided
  if (Agent) {
    const codeExists = await checkReferralCodeExists(Agent);
    if (!codeExists) {
      errorEls.Agent.textContent = 'Invalid referral code';
      alert('The referral code you entered is invalid');
      return;
    }
  }

  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
  
    // Send verification email
    await sendEmailVerification(user);
    alert('Signup successful! Check your email to verify your account.');
    
    // Prepare data object for Supabase
    const userData = {
      id: user.uid,
      name,
      surname,
      birthdate,
      phone,
      email
    };
    
    // Only add Agent to the data if it was provided
    if (Agent) {
      userData.Agent = Agent;
    }
    
    // ✅ Save to Supabase
    const { error: supabaseError } = await supabase.from('users').insert([userData]);
  
    if (supabaseError) {
      console.error('Supabase insert error:', supabaseError.message);
      throw new Error('Failed to save user data to database');
    }
    
    // ✅ Save to Firebase Realtime Database
    const db = getDatabase();
    await set(ref(db, 'users/' + user.uid), userData);
  
    // Reset form and redirect
    form.reset();
    window.location.href = '../login/login.html';
    
  } catch (err) {
    console.error("Signup failed:", err);
    alert("Signup failed: " + err.message);
  }
});