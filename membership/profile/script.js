// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
    authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
    databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com",
    projectId: "mt-trading-signup-and-log-in",
    storageBucket: "mt-trading-signup-and-log-in.appspot.com",
    messagingSenderId: "101302422584",
    appId: "1:101302422584:web:07d472b05e81a6930beacd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);

// Elements
const fileInput = document.getElementById('fileInput');
const previewImage = document.getElementById('previewImage');
const uploadButton = document.getElementById('uploadButton');
const loadingIndicator = document.getElementById('loadingIndicator');

// Show preview of the selected image
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            previewImage.src = reader.result;
        };
        reader.readAsDataURL(file);
    }
});

// Handle image upload
uploadButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select an image.");
        return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
        alert("Image not supported, please choose another image.");
        return;
    }

    // Show loading indicator
    loadingIndicator.style.display = "block";

    // Get the current user
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const storageRef = ref(storage, `profile_pictures/${user.uid}`);
            try {
                // Upload file to Firebase Storage
                await uploadBytes(storageRef, file);

                // Hide loading indicator and show success message
                loadingIndicator.style.display = "none";
                alert("Profile picture uploaded successfully!");
            } catch (error) {
                loadingIndicator.style.display = "none";
                alert(`Upload failed: ${error.message}`);
            }
        } else {
            loadingIndicator.style.display = "none";
            alert("User not signed in.");
        }
    });
});

// Load existing profile picture
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        try {
            const url = await getDownloadURL(storageRef);
            previewImage.src = url;
        } catch (error) {
            console.log("No existing profile picture.");
        }
    }
});
