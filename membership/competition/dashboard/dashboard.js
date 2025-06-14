        // Import Firebase modules
        import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
        import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
        import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
        import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";
        import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
        import { get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

        // Supabase import
        import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

        // Firebase config
        const firebaseConfig = {
            apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
            authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
            databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com",
            projectId: "mt-trading-signup-and-log-in",
            storageBucket: "mt-trading-signup-and-log-in.appspot.com",
            messagingSenderId: "101302422584",
            appId: "1:101302422584:web:07d472b05e81a6930beacd"
        };

        // Supabase config
        const supabaseConfig = {
            url: 'https://fepujhdzovzbygczdjxe.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU'
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getDatabase(app);
        const storage = getStorage(app);

        // Initialize Supabase
        const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

        // Global variables for leaderboard data and pagination
        let allLeaderboardData = [];
        const itemsPerPage = 10;
        let currentPage = 1;

        // Toggle password visibility
        function togglePasswordVisibility(elementId) {
            const passwordElement = document.getElementById(elementId);
            passwordElement.classList.toggle('blurred');
            
            const eyeIcon = passwordElement.nextElementSibling.querySelector('i');
            if (passwordElement.classList.contains('blurred')) {
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            } else {
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            }
        }

        // Copy to clipboard
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const text = element.textContent;
            
            navigator.clipboard.writeText(text).then(() => {
                // Show copied feedback
                const originalText = element.textContent;
                element.textContent = 'Copied!';
                setTimeout(() => {
                    element.textContent = originalText;
                }, 2000);
            });
        }

        // Toggle menu
        function toggleMenu() {
            document.querySelector('.nav-links').classList.toggle('active');
        }

        // Logout function
        function logout(event) {
            event.preventDefault();
            auth.signOut().then(() => {
                window.location.href = "../../../index.html";
            }).catch((error) => {
                console.error("Logout error:", error);
            });
        }

        // Inactivity timer
        let inactivityTime = function () {
            let timer;
            window.onload = resetTimer;
            window.onmousemove = resetTimer;
            window.onkeypress = resetTimer;

            function logoutUser() {
                auth.signOut().then(() => {
                    window.location.href = "../../index.html";
                }).catch((error) => {
                    console.error("Logout error:", error);
                });
            }

            function resetTimer() {
                clearTimeout(timer);
                timer = setTimeout(logoutUser, 600000); // 10 minutes
            }
        };

        inactivityTime();

        // Check authentication state
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = "../../../login/login.html";
                return;
            }

            // Fetch user data from Firebase
            const userRef = ref(db, 'users/' + user.uid);
            onValue(userRef, async (snapshot) => {
                const userData = snapshot.val();
                if (!userData) {
                    window.location.href = "../../membership.html";
                    return;
                }

                // Display user info
                document.getElementById('user-name').textContent = userData.name || 'Unknown';
                document.getElementById('user-province').textContent = userData.province || 'Unknown';
                document.getElementById('user-status').textContent = userData.status || 'Active';

                // Load profile picture from Firebase Storage
                try {
                    const storageReference = storageRef(storage, `profile_pictures/${user.uid}`);
                    const photoURL = await getDownloadURL(storageReference);
                    document.getElementById('user-avatar').src = photoURL;
                } catch (error) {
                    document.getElementById('user-avatar').src = 'https://firebasestorage.googleapis.com/v0/b/mt-trading-signup-and-log-in.appspot.com/o/tm%20fx.png?alt=media&token=4e6aded3-2796-4487-82d4-987b75ca18c1';
                }

                // Check and create broker account if needed
                await checkAndCreateBrokerAccount(user.uid);
            });

            // Load leaderboard
            loadLeaderboard(user.uid);
        });


// Check and create broker account in Supabase
async function checkAndCreateBrokerAccount(uid) {
    try {
        // Check if account exists
        const { data: existingAccount, error: fetchError } = await supabase
            .from('broker')
            .select('*')
            .eq('id', uid)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching account:', fetchError);
            return;
        }

        if (!existingAccount) {
            // Generate account details
            const login = generateRandomNumber(8);
            const password = generateRandomPassword(8);

            // Create new account with minimal fields
            const { error: createError } = await supabase
                .from('broker')
                .insert([
                    { 
                        id: uid,
                        Login: login,
                        Password: password
                        // Server, Platform, Account type, Broker left NULL
                    }
                ]);

            if (createError) {
                console.error('Error creating account:', createError);
                return;
            }

            console.log('New broker account created');
        }

        // Load account details
        loadAccountDetails(uid);
    } catch (error) {
        console.error('Error in checkAndCreateBrokerAccount:', error);
    }
}

// Load account details from Supabase
async function loadAccountDetails(uid) {
    try {
        const { data: account, error } = await supabase
            .from('broker')
            .select('*')
            .eq('id', uid)
            .single();

        if (error) {
            console.error('Error loading account details:', error);
            return;
        }

        if (account) {
            document.getElementById('account-login').textContent = account.Login || 'N/A';
            document.getElementById('account-password').textContent = account.Password || 'N/A';

        }
    } catch (error) {
        console.error('Error in loadAccountDetails:', error);
    }
}


        // Load leaderboard data
        async function loadLeaderboard(currentUserId) {
            try {
                // Get all users from DMC and MCS tables
                const { data: dmcUsers } = await supabase.from('DMC').select('id');
                const { data: mcsUsers } = await supabase.from('MCS').select('id');
                
                // Combine and deduplicate user IDs
                const eligibleUserIds = [...new Set([
                    ...(dmcUsers?.map(u => u.id) || []),
                    ...(mcsUsers?.map(u => u.id) || [])
                ])];

                if (!eligibleUserIds.length) {
                    document.getElementById('total-participants').textContent = '0';
                    return;
                }

                // Get past trades for eligible users
                const { data: pastTrades } = await supabase
                    .from('past-trades')
                    .select('id, profit')
                    .in('id', eligibleUserIds);

                // Calculate equity (sum of profits) for each user
                const equityMap = {};
                pastTrades?.forEach(trade => {
                    if (!equityMap[trade.id]) {
                        equityMap[trade.id] = 0;
                    }
                    equityMap[trade.id] += trade.profit || 0;
                });

                // Get user details from Firebase
                const leaderboardData = [];
                for (const userId of Object.keys(equityMap)) {
                    const userRef = ref(db, 'users/' + userId);
                    const snapshot = await get(userRef);

                    const userData = snapshot.val();

                    if (userData) {
                        try {
                            const storageReference = storageRef(storage, `profile_pictures/${userId}`);
                            const photoURL = await getDownloadURL(storageReference);
                            leaderboardData.push({
                                id: userId,
                                name: userData.name,
                                province: userData.province || 'Unknown',
                                status: userData.status || 'Active',
                                equity: equityMap[userId],
                                photo: photoURL
                            });
                        } catch (error) {
                            leaderboardData.push({
                                id: userId,
                                name: userData.name,
                                province: userData.province || 'Unknown',
                                status: userData.status || 'Active',
                                equity: equityMap[userId],
                                photo: 'https://firebasestorage.googleapis.com/v0/b/mt-trading-signup-and-log-in.appspot.com/o/tm%20fx.png?alt=media&token=4e6aded3-2796-4487-82d4-987b75ca18c1'
                            });
                        }
                    }
                }

                // Update total participants count to only those with trades
                document.getElementById('total-participants').textContent = leaderboardData.length;

                // Sort by equity (descending)
                leaderboardData.sort((a, b) => b.equity - a.equity);

                // Store the full leaderboard data
                allLeaderboardData = leaderboardData;

                // Set current user's rank and equity if they're in the leaderboard
                const currentUserIndex = leaderboardData.findIndex(user => user.id === currentUserId);
                if (currentUserIndex !== -1) {
                    document.getElementById('user-rank').textContent = currentUserIndex + 1;
                    document.getElementById('user-equity').textContent = leaderboardData[currentUserIndex].equity.toFixed(2);
                }

                // Set up pagination and display first page
                setupPagination(leaderboardData.length);
                displayPage(1);
            } catch (error) {
                console.error('Error loading leaderboard:', error);
            }
        }

        // Set up pagination
        function setupPagination(totalItems) {
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const paginationContainer = document.getElementById('leaderboard-pagination');
            
            paginationContainer.innerHTML = '';
            
            // Previous button
            const prevBtn = document.createElement('button');
            prevBtn.className = 'page-btn';
            prevBtn.innerHTML = '&laquo;';
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    displayPage(currentPage - 1);
                }
            });
            paginationContainer.appendChild(prevBtn);
            
            // Page buttons
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn' + (i === 1 ? ' active' : '');
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                    displayPage(i);
                });
                paginationContainer.appendChild(pageBtn);
            }
            
            // Next button
            const nextBtn = document.createElement('button');
            nextBtn.className = 'page-btn';
            nextBtn.innerHTML = '&raquo;';
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    displayPage(currentPage + 1);
                }
            });
            paginationContainer.appendChild(nextBtn);
        }

        // Display a specific page of the leaderboard
        function displayPage(page) {
            currentPage = page;
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageData = allLeaderboardData.slice(startIndex, endIndex);
            
            // Update active page button
            document.querySelectorAll('.page-btn').forEach((btn, index) => {
                // Skip prev/next buttons (first and last)
                if (index !== 0 && index !== document.querySelectorAll('.page-btn').length - 1) {
                    const pageNum = parseInt(btn.textContent);
                    btn.classList.toggle('active', pageNum === page);
                }
            });
            
            // Populate the table with current page data
            const leaderboardBody = document.getElementById('leaderboard-body');
            leaderboardBody.innerHTML = '';
            
            pageData.forEach((user, index) => {
                const globalIndex = startIndex + index;
                const row = document.createElement('tr');
                if (user.id === auth.currentUser?.uid) {
                    row.style.backgroundColor = 'rgba(26, 188, 156, 0.1)';
                }
                
                row.innerHTML = `
                    <td>${globalIndex + 1}</td>
                    <td class="user-cell">
                        <img src="${user.photo}" alt="${user.name}" class="user-avatar-small">
                        <span>${user.name}</span>
                    </td>
                    <td>${user.province}</td>
                    <td>${user.status}</td>
                    <td>${user.equity.toFixed(2)}</td>
                `;
                
                leaderboardBody.appendChild(row);
            });
        }

        // Helper functions
        function generateRandomNumber(length) {
            let result = '';
            for (let i = 0; i < length; i++) {
                result += Math.floor(Math.random() * 10);
            }
            return result;
        }

        function generateRandomPassword(length) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }

        // Expose functions globally for HTML onclick handlers
        window.togglePasswordVisibility = togglePasswordVisibility;
        window.copyToClipboard = copyToClipboard;
        window.toggleMenu = toggleMenu;
        window.logout = logout;
