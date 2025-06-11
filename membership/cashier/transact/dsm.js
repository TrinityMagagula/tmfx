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

        // Function to get DSM Yearly price from ItemList table
        async function getMentorshipPrice() {
            try {
                const { data, error } = await supabase
                    .from('ItemList')
                    .select('"Deriv Signals Monthly"')
                    .single();

                if (error) throw error;
                if (data && data['Deriv Signals Monthly']) {
                    mentorshipPrice = data['Deriv Signals Monthly'];
                    document.getElementById('subscriptionText5').textContent = 
                        `Subscribe to Deriv Signals Monthly For R${mentorshipPrice}`;
                }
            } catch (error) {
                console.error('Error fetching Deriv Signals Monthly price:', error);
            }
        }

        // Function to show popup
        async function DSM() {
            if (!currentUser) {
                alert('Please sign in to subscribe.');
                return;
            }

            // First check if user is already subscribed
            try {
                const { data, error } = await supabase
                    .from('DerivSignalsMonthly')
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
                const popup = document.getElementById('mentorshipPopup5');
                popup.classList.add('active');
            } catch (error) {
                console.error('Error checking subscription status:', error);
                alert('Error checking your subscription status. Please try again.');
            }
        }

        // Function to show already subscribed popup
        function showAlreadySubscribedPopup() {
            const popup = document.getElementById('alreadySubscribedPopup5');
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
            const confirmBtn = document.getElementById('confirmBtn5');
            const loadingSpinner = document.getElementById('loadingSpinner5');
            const subscriptionText = document.getElementById('subscriptionText5');
            const doneMessage = document.getElementById('doneMessage5');
            const closeBtn = document.getElementById('closeBtn5');

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
                        ItemName: 'Deriv Signals Monthly',
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
                    .from('DerivSignalsMonthly')
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
            document.getElementById('confirmBtn5').addEventListener('click', handleSubscription);
            
            // Close button click (subscription popup)
            document.getElementById('closeBtn5').addEventListener('click', () => hidePopup('mentorshipPopup5'));
            
            // Close button click (already subscribed popup)
            document.getElementById('alertCloseBtn5').addEventListener('click', () => hidePopup('alreadySubscribedPopup5'));
        });

        // Make MY function available globally
        window.DSM = DSM;