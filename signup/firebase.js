
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
    authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
    databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com",
    projectId: "mt-trading-signup-and-log-in",
    storageBucket: "mt-trading-signup-and-log-in.appspot.com",
    messagingSenderId: "101302422584",
    appId: "1:101302422584:web:07d472b05e81a6930beacd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase();

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const birthdate = new Date(document.getElementById('birthdate').value);
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        const age = new Date().getFullYear() - birthdate.getFullYear();
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const isValidPhone = /^\d{10}$/.test(phone);
        const passwordRequirements = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (age < 18) {
            document.getElementById('birthdate-error').innerText = "You must be over the age of 18.";
            return;
        } else {
            document.getElementById('birthdate-error').innerText = "";
        }

        if (!isValidEmail) {
            document.getElementById('email-error').innerText = "Please enter a valid email address.";
            return;
        } else {
            document.getElementById('email-error').innerText = "";
        }

        if (!isValidPhone) {
            document.getElementById('phone-error').innerText = "Please enter a valid 10-digit phone number.";
            return;
        } else {
            document.getElementById('phone-error').innerText = "";
        }

        if (password !== confirmPassword) {
            document.getElementById('password-error').innerText = "Passwords do not match.";
            return;
        } else {
            document.getElementById('password-error').innerText = "";
        }

        if (!passwordRequirements.test(password)) {
            document.getElementById('password-error').innerText = "Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.";
            return;
        } else {
            document.getElementById('password-error').innerText = "";
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                const userData = {
                    name: name,
                    surname: surname,
                    birthdate: birthdate.toISOString().split('T')[0],
                    phone: phone,
                    email: email,
                    status: "Active",
                    equity: 1000,
                    last_login: Date.now()
                };
                set(ref(database, 'users/' + user.uid), userData)
            })
            .catch((error) => {
                alert(error.message);
            });
    });
});