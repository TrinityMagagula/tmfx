import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ✅ Initialize Supabase using the imported createClient function
const supabaseUrl = "https://fepujhdzovzbygczdjxe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU";
const supabase = createClient(supabaseUrl, supabaseKey); // ✅ use createClient, not supabase.createClient

const form = document.getElementById('signup-form');
const errorEls = {
  name: document.getElementById('name-error'),
  surname: document.getElementById('surname-error'),
  birthdate: document.getElementById('birthdate-error'),
  phone: document.getElementById('phone-error'),
  email: document.getElementById('email-error'),
  password: document.getElementById('password-error'),
  confirmPassword: document.getElementById('confirm-password-error')
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

function isOver18(birthdate) {
  const birth = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  return age > 18 || (age === 18 && m >= 0);
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

  let valid = true;

  if (!name) {
    errorEls.name.textContent = 'Name is required';
    valid = false;
  }

  if (!surname) {
    errorEls.surname.textContent = 'Surname is required';
    valid = false;
  }

  if (!birthdate || !isOver18(birthdate)) {
    errorEls.birthdate.textContent = 'You must be at least 18 years old';
    valid = false;
  }

  if (!isValidPhone(phone)) {
    errorEls.phone.textContent = 'Phone must be 10 digits starting with 0';
    valid = false;
  }

  if (!isValidEmail(email)) {
    errorEls.email.textContent = 'Enter a valid email';
    valid = false;
  }

  if (!isValidPassword(password)) {
    errorEls.password.textContent = 'Password must be at least 8 characters, with uppercase, lowercase, number and symbol';
    valid = false;
  }

  if (password !== confirmPassword) {
    errorEls.confirmPassword.textContent = 'Passwords do not match';
    valid = false;
  }

  if (!valid) {
    alert('Incorrect inputs, try again');
    return;
  }

  // ✅ Register user and send email verification
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'http://127.0.0.1:5500/TMFXTRADINGINSTITUTE/login1.html'
    }
  });

  if (signUpError) {
    alert('Signup failed: ' + signUpError.message);
    return;
  }

  const userId = signUpData.user?.id;
  if (userId) {
    // ✅ Insert only relevant user details — no EmailVerification flag
    const { error: insertError } = await supabase.from('users').insert([{
      id: userId,
      name,
      surname,
      birthdate,
      phone,
      email
    }]);

    if (insertError) {
      console.error('Error saving user data:', insertError.message);
    } else {
      alert('Signup successful! Please check your email to verify your account.');
      form.reset();
    }
  }
});