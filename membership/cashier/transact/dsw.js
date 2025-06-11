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

        // Function to get Deriv Signals Weekly price from ItemList table
        async function getMentorshipPrice() {
            try {
                const { data, error } = await supabase
                    .from('ItemList')
                    .select('"Deriv Signals Weekly"')
                    .single();

                if (error) throw error;
                if (data && data['Deriv Signals Weekly']) {
                    mentorshipPrice = data['Deriv Signals Weekly'];
                    document.getElementById('subscriptionText4').textContent = 
                        `Subscribe to Deriv Signals Weekly For R${mentorshipPrice}`;
                }
            } catch (error) {
                console.error('Error fetching Deriv Signals price:', error);
            }
        }

        // Function to show popup
        async function DSW() {
            if (!currentUser) {
                alert('Please sign in to subscribe.');
                return;
            }

            // First check if user is already subscribed
            try {
                const { data, error } = await supabase
                    .from('DerivSignalsWeekly')
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
                const popup = document.getElementById('mentorshipPopup4');
                popup.classList.add('active');
            } catch (error) {
                console.error('Error checking subscription status:', error);
                alert('Error checking your subscription status. Please try again.');
            }
        }

        // Function to show already subscribed popup
        function showAlreadySubscribedPopup() {
            const popup = document.getElementById('alreadySubscribedPopup4');
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
            const confirmBtn = document.getElementById('confirmBtn4');
            const loadingSpinner = document.getElementById('loadingSpinner4');
            const subscriptionText = document.getElementById('subscriptionText4');
            const doneMessage = document.getElementById('doneMessage4');
            const closeBtn = document.getElementById('closeBtn4');

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
                        ItemName: 'Deriv Signals Weekly',
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
                    .from('DerivSignalsWeekly')
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
            document.getElementById('confirmBtn4').addEventListener('click', handleSubscription);
            
            // Close button click (subscription popup)
            document.getElementById('closeBtn4').addEventListener('click', () => hidePopup('mentorshipPopup4'));
            
            // Close button click (already subscribed popup)
            document.getElementById('alertCloseBtn4').addEventListener('click', () => hidePopup('alreadySubscribedPopup4'));
        });

        // Make DSW function available globally
        window.DSW = DSW;