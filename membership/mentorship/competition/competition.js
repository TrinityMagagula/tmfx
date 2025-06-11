
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, remove, push, get, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getStorage, ref as sRef, getDownloadURL, uploadBytes } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

const app = initializeApp({
  apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
  authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
  databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com",
  projectId: "mt-trading-signup-and-log-in",
  storageBucket: "mt-trading-signup-and-log-in.appspot.com",
  messagingSenderId: "101302422584",
  appId: "1:101302422584:web:07d472b05e81a6930beacd"
});

const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // User not logged in, redirect to signup
        window.location.href = "signup.html";
    } else {
        const userRef = ref(db, "users/" + user.uid);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
        // User exists in auth but not in database, treat as missing loginID
        window.location.href = "../../membership.html";
        } else {

        // Otherwise, allow access and proceed to show content
        }
    }
    });

            
            // Monitor user authentication status
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    const userId = user.uid;
                    const userRef = ref(db, 'users/' + userId);
        
                    // Fetch user data and assign login ID if missing
                    onValue(userRef, async (snapshot) => {
                        let userData = snapshot.val();
      
        
                        // Update the welcome message and display user details on the page
                        document.getElementById('welcome-message').textContent = `Welcome to Competition, ${userData.name}`;
        
                        document.getElementById('user-details').innerHTML = `
                            <p><strong>Name:</strong> ${userData.name}</p>
                            <p><strong>Email:</strong> ${userData.email}</p>
                            <p><strong>Account Type:</strong> ${userData.accountType || 'Standard'}</p>
                            
                            <p><strong>Password: </strong>@TMFXCompetition1 </p>
                            <p><strong>Platform:</strong> MT5</p>
                            <p><strong>Broker:</strong> Exness Technologies Ltd</p>
                            <p><strong>Server:</strong> Exness-MT5Trial9</p>
                            <p><strong>Leverage:</strong> 1:1000</p>
                        `;
                    });
                } else {
                    // Redirect to homepage if not authenticated
                    window.location.href = 'index.html';
                }
            });

const emojiPicker = document.getElementById("emojiPicker");
const replyToBox = document.getElementById("replyTo");
let currentUser, name;
let replyingTo = null;

function clearReply() {
  replyingTo = null;
  replyToBox.classList.add("hidden");
  replyToBox.textContent = "";
}

onAuthStateChanged(auth, async (user) => {
    if (!user) return location.href = "../../../login/login.html";
    currentUser = user;

    const snap = await get(ref(db, `users/${user.uid}`));
    name = snap.exists() ? snap.val().name : "User";
    document.getElementById("username").textContent = name;

    const leaderboardTable = document.getElementById("leaderboardTable").getElementsByTagName("tbody")[0];

    onValue(ref(db, "users"), async (snap) => {
        leaderboardTable.innerHTML = "";
        const usersData = [];

        const fetchPromises = [];

        snap.forEach((child) => {
        const userData = child.val();
        const uid = child.key;

        if (userData.name) {
            const userPromise = getDownloadURL(sRef(storage, `profile_pictures/${uid}`))
            .then(url => url)
            .catch(() => "https://firebasestorage.googleapis.com/v0/b/mt-trading-signup-and-log-in.appspot.com/o/tm%20fx.png?alt=media&token=4e6aded3-2796-4487-82d4-987b75ca18c1");

            fetchPromises.push(
            userPromise.then(photoURL => {
                usersData.push({
                rank: 0,
                picture: photoURL,
                name: userData.name,
                province: userData.province || "Unknown",
                status: userData.status || "Inactive",
                equity: userData.equity || 0
                });
            })
            );
        }
        });

        await Promise.all(fetchPromises);

        // Sort by equity
        usersData.sort((a, b) => b.equity - a.equity);

        // Populate table
        usersData.forEach((user, index) => {
        const row = leaderboardTable.insertRow();
        row.insertCell(0).textContent = index + 1; // Rank
        row.insertCell(1).innerHTML = `<img src="${user.picture}" alt="${user.name}" width="40" height="40" style="border-radius: 50%;">`; // Picture
        row.insertCell(2).textContent = user.name;
        row.insertCell(3).textContent = user.province;
        row.insertCell(4).textContent = user.status;
        row.insertCell(5).textContent = user.equity;
        });
    });
    });

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "../../../login/login.html";
  currentUser = user;

  const snap = await get(ref(db, `users/${user.uid}`));
  name = snap.exists() ? snap.val().name : "User";
  document.getElementById("username").textContent = name;

  let photo = "https://firebasestorage.googleapis.com/v0/b/mt-trading-signup-and-log-in.appspot.com/o/tm%20fx.png?alt=media&token=4e6aded3-2796-4487-82d4-987b75ca18c1";
  try { photo = await getDownloadURL(sRef(storage, `profile_pictures/${user.uid}`)); } catch {}

  set(ref(db, `chatRoom/users/${user.uid}`), { name, photo });
  window.addEventListener("beforeunload", () => remove(ref(db, `chatRoom/users/${user.uid}`)));
  document.getElementById("leaveBtn").onclick = () => {
    remove(ref(db, `chatRoom/users/${user.uid}`));
    location.href = "../../membership.html";
  };



  onValue(ref(db, "chatRoom/users"), (snap) => {
    const usersBox = document.getElementById("usersBox");
    usersBox.innerHTML = "";
    let userCount = 0;
    snap.forEach(child => {
      if (userCount < 4) {
        const { name, photo } = child.val();
        usersBox.innerHTML += `<img src="${photo}" class="user-icon" alt="${name}" title="${name}" />`;
        userCount++;
      }
    });
    if (userCount > 2) {
      usersBox.innerHTML += `<div class="plus-icon" onclick="showUserList()">+</div>`;
    }
  });

  const chatBox = document.getElementById("chatBox");
  onValue(ref(db, "chatRoom/messages"), (snap) => {
    chatBox.innerHTML = "";
    snap.forEach(msgSnap => {
      const msg = msgSnap.val();
      const id = msgSnap.key;
      const time = new Date(msg.timestamp).toLocaleString();

      const msgDiv = document.createElement("div");
      msgDiv.className = "p-2 rounded bg-white/10 text-white group relative";

      const msgContent = document.createElement("div");
      msgContent.className = "flex justify-between items-center gap-2";

      const textArea = document.createElement("div");
      textArea.innerHTML = `<div class="mb-1"><strong>${msg.name}</strong>: ${msg.text}</div><div class="text-gray-400" style="font-size: 0.5rem;">${time}</div>`;
      if (msg.replyTo) {
        textArea.innerHTML = `<div class='reply-box text-gray-300'>Replying to ${msg.replyTo.name}: ${msg.replyTo.text}</div>` + textArea.innerHTML;
        }

      const actionArea = document.createElement("div");
      actionArea.className = "flex gap-2 ml-2";
      const reactBtn = document.createElement("button");
      reactBtn.textContent = "😊";
      reactBtn.className = "reaction-btn";
      reactBtn.onclick = (e) => {
        e.stopPropagation();
        emojiPicker.style.display = "block";
        const emojiHandler = (event) => {
          const emoji = event.detail.unicode;
          set(ref(db, `chatRoom/messages/${id}/reactions/${emoji}/${currentUser.uid}`), name);
          emojiPicker.removeEventListener('emoji-click', emojiHandler);
          emojiPicker.style.display = "none";
        };
        emojiPicker.addEventListener('emoji-click', emojiHandler);
      };

      const replyBtn = document.createElement("button");
      replyBtn.textContent = "↩️";
      replyBtn.onclick = () => {
        replyingTo = { id, text: msg.text, name: msg.name };
        replyToBox.textContent = `Replying to ${msg.name}: ${msg.text}`;
        replyToBox.classList.remove("hidden");
      };

      actionArea.appendChild(reactBtn);
      actionArea.appendChild(replyBtn);

      msgContent.appendChild(textArea);
      msgContent.appendChild(actionArea);
      msgDiv.appendChild(msgContent);

      const reactionsDiv = document.createElement("div");
      reactionsDiv.className = "reactions-box";
      if (msg.reactions) {
        for (const [emoji, users] of Object.entries(msg.reactions)) {
          const count = Object.keys(users).length;
          reactionsDiv.innerHTML += `<span class="reaction-btn">${emoji} ${count}</span>`;
        }
      }

      msgDiv.appendChild(reactionsDiv);
      chatBox.appendChild(msgDiv);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  document.getElementById("sendBtn").onclick = () => {
    const msg = document.getElementById("msgInput").value.trim();
    if (msg) {
      const newMsg = { name, text: msg, timestamp: Date.now() };
      if (replyingTo) newMsg.replyTo = replyingTo;
      push(ref(db, "chatRoom/messages"), newMsg);
      document.getElementById("msgInput").value = "";
      clearReply();
    }
  };

  document.getElementById("emojiBtn").onclick = () => {
    emojiPicker.style.display = (emojiPicker.style.display === 'block') ? 'none' : 'block';
    const pickerHandler = (event) => {
      document.getElementById("msgInput").value += event.detail.unicode;
      emojiPicker.removeEventListener('emoji-click', pickerHandler);
      emojiPicker.style.display = "none";
    };
    emojiPicker.addEventListener('emoji-click', pickerHandler);
  };

  document.getElementById("uploadBtn").onclick = () => document.getElementById("imageUpload").click();
  document.getElementById("imageUpload").onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageRef = sRef(storage, `chat_images/${file.name}`);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);
      push(ref(db, "chatRoom/messages"), {
        name,
        text: `<img src="${imageUrl}" class="w-32 h-32 object-cover rounded" />`,
        timestamp: Date.now()
      });
    }
  };

  let mediaRecorder, audioChunks = [];

    const recordBtn = document.getElementById("recordBtn");
    const previewContainer = document.createElement("div");
    previewContainer.className = "fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded p-4 z-50 hidden";
    document.body.appendChild(previewContainer);

    recordBtn.onclick = async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        audioChunks = [];

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

        mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);

        previewContainer.innerHTML = `
            <p class="font-bold mb-2">🎧 Voice Note Preview</p>
            <audio controls class="audio-control">
<source src="${audioUrl}" type="audio/webm" />
</audio>
            <div class="flex justify-between gap-4">
            <button id="sendVoice" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">✅ Send</button>
            <button id="cancelVoice" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">❌ Cancel</button>
            </div>
        `;
        previewContainer.classList.remove("hidden");

        // Handle Send
        document.getElementById("sendVoice").onclick = async () => {
            previewContainer.classList.add("hidden"); // Hide immediately on send click

            const fileName = `voice_notes/${Date.now()}_${name}.webm`;
            const audioRef = sRef(storage, fileName);
            await uploadBytes(audioRef, blob);
            const downloadURL = await getDownloadURL(audioRef);

            const newMsg = {
                name,
                text: `<audio controls class="w-full mt-2"><source src="${downloadURL}" type="audio/webm"></audio>`,
                timestamp: Date.now()
            };

            if (replyingTo) newMsg.replyTo = replyingTo;

            push(ref(db, "chatRoom/messages"), newMsg);
            clearReply();
            };


        // Handle Cancel
        document.getElementById("cancelVoice").onclick = () => {
            previewContainer.classList.add("hidden");
        };
        };

        mediaRecorder.start();
        recordBtn.textContent = "⏹️ Stop";
    } else if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        recordBtn.textContent = "🎙️";
    }
    };

  document.addEventListener('click', (event) => {
    if (!emojiPicker.contains(event.target) && event.target.id !== 'emojiBtn') {
      emojiPicker.style.display = "none";
    }
  });
});

function showUserList() {
  // Logic to show a popup with the list of users
}