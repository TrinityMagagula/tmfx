// Firebase + Supabase Unified Realtime Script
import { getFirebaseAuth } from './init-services.js';
import { getSupabaseClient } from './init-services.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Get the singleton instances
const auth = getFirebaseAuth();
const supabase = getSupabaseClient();

        // Global variables
        let currentUser = null;
        let mentorshipPrice = null; // Default value, will be updated from ItemList

        // Check auth state
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUser = user;
                // Get the price from ItemList table
                await getMentorshipPrice();
            } else {
                currentUser = null;
            }
        });

        // Function to get FSW Yearly price from ItemList table
        async function getMentorshipPrice() {
            try {
                const { data, error } = await supabase
                    .from('ItemList')
                    .select('"FSW"')
                    .single();

                if (error) throw error;
                if (data && data['FSW']) {
                    mentorshipPrice = data['FSW'];
                    document.getElementById('subscriptionText6').textContent = 
                        `Subscribe to Forex Signals Weekly For R${mentorshipPrice}`;
                }
            } catch (error) {
                console.error('Error fetching Forex Signals Weekly price:', error);
            }
        }

        // Function to show popup
        async function FSW() {
            if (!currentUser) {
                alert('Please sign in to subscribe.');
                return;
            }

            // First check if user is already subscribed
            try {
                const { data, error } = await supabase
                    .from('FSW')
                    .select('id')
                    .eq('id', currentUser.uid)
                    .single();

                if (error && error.code !== 'PGRST116') throw error; // Ignore "No rows found" error

                if (data) {
                    // User is already subscribed
                    showAlreadySubscribedPopup();
                    return;
                }

                // User is not subscribed - show subscription popup
                const popup = document.getElementById('mentorshipPopup6');
                popup.classList.add('active');
            } catch (error) {
                console.error('Error checking subscription status:', error);
                alert('Error checking your subscription status. Please try again.');
            }
        }

        // Function to show already subscribed popup
        function showAlreadySubscribedPopup() {
            const popup = document.getElementById('alreadySubscribedPopup6');
            popup.classList.add('active');
        }

        // Function to hide popup
        function hidePopup(popupId) {
            const popup = document.getElementById(popupId);
            popup.classList.remove('active');
        }

        // Function to get current timestamp
        function getCurrentTimestamp() {
            return new Date().toISOString();
        }

        // Function to get user credits
        function getUserCredits() {
            const creditsElement = document.getElementById('user-credits');
            if (creditsElement) {
                return parseFloat(creditsElement.textContent) || 0;
            }
            return 0;
        }

        // Function to handle subscription
        async function handleSubscription() {
            // Get elements
            const confirmBtn = document.getElementById('confirmBtn6');
            const loadingSpinner = document.getElementById('loadingSpinner6');
            const subscriptionText = document.getElementById('subscriptionText6');
            const doneMessage = document.getElementById('doneMessage6');
            const closeBtn = document.getElementById('closeBtn6');

            // Show loading state
            confirmBtn.style.display = 'none';
            subscriptionText.style.display = 'none';
            loadingSpinner.style.display = 'block';

            try {
                // Get required values
                const date = getCurrentTimestamp();
                const openingBalance = getUserCredits();
                const amount = mentorshipPrice;
                const closingBalance = openingBalance - amount;

                // Check if user has enough credits
                if (closingBalance < 0) {
                    if (confirm('Insufficient credits.')) {
                        window.location.href = '../account/deposit.html';
                    }
                    throw new Error('Add funds');
                }

                // Insert into TransactionHistory table with user's UID
                const { data: transactionData, error: transactionError } = await supabase
                    .from('TransactionHistory')
                    .insert([{
                        id: currentUser.uid,
                        ItemName: 'Forex Signals Weekly',
                        Date: date,
                        Quantity: 1,
                        Amount: - amount,
                        OpeningBalance: openingBalance,
                        ClosingBalance: closingBalance,
                        Status: 'Completed'
                    }])
                    .select();

                if (transactionError) throw transactionError;

                // Insert into WeeklyMentorship table
                const { error: mentorshipError } = await supabase
                    .from('FSW')
                    .insert([{
                        id: currentUser.uid,
                        Date: date
                    }]);

                if (mentorshipError) throw mentorshipError;

                // Update UI to show success
                loadingSpinner.style.display = 'none';
                doneMessage.style.display = 'block';
                closeBtn.style.display = 'block';

            } catch (error) {
                console.error('Error processing subscription:', error);
                // Show error to user
                loadingSpinner.style.display = 'none';
                subscriptionText.style.display = 'block';
                confirmBtn.style.display = 'block';
                alert('Error processing subscription: ' + error.message);
            }
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', () => {
            // Confirm button click
            document.getElementById('confirmBtn6').addEventListener('click', handleSubscription);
            
            // Close button click (subscription popup)
            document.getElementById('closeBtn6').addEventListener('click', () => hidePopup('mentorshipPopup6'));
            
            // Close button click (already subscribed popup)
            document.getElementById('alertCloseBtn6').addEventListener('click', () => hidePopup('alreadySubscribedPopup6'));
        });

        // Make FSW function available globally
        window.FSW = FSW;