    // Initialize Firebase
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
      firebase.initializeApp(firebaseConfig);
      const auth = firebase.auth();
  
      // Initialize Supabase client
      const supabaseUrl = 'https://fepujhdzovzbygczdjxe.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU';
      const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  
      let allSignals = [];
      let weekOptions = [];
      let currentPage = 1;
      const signalsPerPage = 20;
      let userSubscriptions = {
        hasForex: false,
        hasDeriv: false
      };
  
      // Load signals when page loads
      document.addEventListener('DOMContentLoaded', async () => {
        // Check authentication first
        auth.onAuthStateChanged(async (user) => {
          if (user) {
            // User is signed in, check subscriptions
            await checkUserSubscriptions(user.uid);
            await loadSignals();
            updateStats();
          } else {
            // User is not signed in, redirect to login
            window.location.href = '../../index.html';
          }
        });
      });
  
      // Function to check user subscriptions
      async function checkUserSubscriptions(uid) {
        try {
          // Check all subscription tables
          const tablesToCheck = [
            'DerivSignalsMonthly',
            'DerivSignalsWeekly',
            'FSM',
            'FSW'
          ];
          
          let hasAnySubscription = false;
          let hasForexSubscription = false;
          let hasDerivSubscription = false;
          
          // Check each table for the user's UID
          for (const table of tablesToCheck) {
            const { data, error } = await supabase
              .from(table)
              .select('id')
              .eq('id', uid);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              hasAnySubscription = true;
              
              // Determine which type of subscription they have
              if (table === 'FSM' || table === 'FSW') {
                hasForexSubscription = true;
              }
              if (table === 'DerivSignalsMonthly' || table === 'DerivSignalsWeekly') {
                hasDerivSubscription = true;
              }
            }
          }
          
          if (!hasAnySubscription) {
            alert('Please subscribe for signals');
            window.location.href = '../cashier/transact/subscriptions.html';
            return;
          }
          
          // Store subscription status
          userSubscriptions = {
            hasForex: hasForexSubscription,
            hasDeriv: hasDerivSubscription
          };
          
        } catch (error) {
          console.error('Error checking subscriptions:', error);
          alert('Error checking your subscriptions. Please try again later.');
          window.location.href = '../../index.html';
        }
      }
  
      // Function to load signals from Supabase
      async function loadSignals() {
        try {
          const { data: signals, error } = await supabase
            .from('Signals')
            .select('*')
            .order('Date', { ascending: false });
          
          if (error) throw error;
          
          allSignals = signals;
          generateWeekOptions();
          filterSignalsByTime(); // Default to showing today's signals
        } catch (error) {
          console.error('Error loading signals:', error);
        }
      }
  
      // Function to generate week options based on signal dates
      function generateWeekOptions() {
        if (allSignals.length === 0) return;
        
        const timePeriodSelect = document.getElementById('time-period');
        // Clear existing options except first three (Today, All Time, Last 7 Days)
        while (timePeriodSelect.options.length > 3) {
          timePeriodSelect.remove(3);
        }
        
        // Get all unique dates from signals
        const dates = allSignals.map(signal => new Date(signal.Date).toDateString());
        const uniqueDates = [...new Set(dates)];
        
        if (uniqueDates.length === 0) return;
        
        // Sort dates in descending order
        uniqueDates.sort((a, b) => new Date(b) - new Date(a));
        
        // Group dates into weeks (7-day periods)
        const today = new Date();
        const oldestDate = new Date(uniqueDates[uniqueDates.length - 1]);
        const daysDiff = Math.ceil((today - oldestDate) / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.ceil(daysDiff / 7);
        
        // Add week options
        for (let i = totalWeeks; i >= 1; i--) {
          const option = document.createElement('option');
          option.value = `week${i}`;
          option.textContent = `Week ${i}`;
          timePeriodSelect.appendChild(option);
        }
      }
  
      // Function to filter signals by time period
      function filterSignalsByTime() {
        const timePeriod = document.getElementById('time-period').value;
        let filteredSignals = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (timePeriod === 'today') {
          filteredSignals = allSignals.filter(signal => {
            const signalDate = new Date(signal.Date);
            signalDate.setHours(0, 0, 0, 0);
            return signalDate.getTime() === today.getTime();
          });
        } else if (timePeriod === 'all') {
          filteredSignals = [...allSignals]; // Show all signals
        } else if (timePeriod === 'last7') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          
          filteredSignals = allSignals.filter(signal => {
            const signalDate = new Date(signal.Date);
            return signalDate >= sevenDaysAgo;
          });
        } else if (timePeriod.startsWith('week')) {
          const weekNum = parseInt(timePeriod.replace('week', ''));
          const oldestDate = new Date(allSignals[allSignals.length - 1].Date);
          oldestDate.setHours(0, 0, 0, 0);
          
          const startDate = new Date(oldestDate);
          startDate.setDate(startDate.getDate() + (weekNum - 1) * 7);
          
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 7);
          
          filteredSignals = allSignals.filter(signal => {
            const signalDate = new Date(signal.Date);
            return signalDate >= startDate && signalDate < endDate;
          });
        }
        
        // Reset to first page when filtering
        currentPage = 1;
        displaySignals(filteredSignals);
        updateStats(filteredSignals);
      }
  
      // Function to display signals in the grid with pagination
      function displaySignals(signals) {
        const signalGrid = document.getElementById('signal-grid');
        const paginationControls = document.getElementById('pagination-controls');
        
        signalGrid.innerHTML = '';
        paginationControls.innerHTML = '';
        
        if (signals.length === 0) {
          signalGrid.innerHTML = '<div class="no-signals">No signals found for the selected period</div>';
          return;
        }
        
        // Calculate pagination
        const totalPages = Math.ceil(signals.length / signalsPerPage);
        const startIndex = (currentPage - 1) * signalsPerPage;
        const endIndex = Math.min(startIndex + signalsPerPage, signals.length);
        const paginatedSignals = signals.slice(startIndex, endIndex);
        
        // Display signals for current page
        paginatedSignals.forEach(signal => {
          const signalBox = document.createElement('div');
          signalBox.className = 'signal-box';
          signalBox.setAttribute('data-result', signal.Results || 'Active');
          
          // Apply blur effect based on subscription and market type
          if ((signal.Market === 'FOREX' && !userSubscriptions.hasForex) || 
              (signal.Market === 'DERIV' && !userSubscriptions.hasDeriv)) {
            signalBox.classList.add('blurred-signal');
          }
          
          // Format the date for display
          const date = new Date(signal.Date);
          const formattedDate = date.toLocaleString();
          
          signalBox.innerHTML = `
            <div class="signal-name">${signal.Name || 'Signal'}</div>
            <div class="signal-details">
              <div class="signal-detail">
                <span class="signal-detail-label">Market:</span>
                <span class="signal-detail-value">${signal.Market || '-'}</span>
              </div>
              <div class="signal-detail">
                <span class="signal-detail-label">Symbol:</span>
                <span class="signal-detail-value">${signal.Symbol || '-'}</span>
              </div>
              <div class="signal-detail">
                <span class="signal-detail-label">Action:</span>
                <span class="signal-detail-value action" data-action="${signal.Action || ''}">${signal.Action || '-'}</span>
              </div>
              <div class="signal-detail">
                <span class="signal-detail-label">Entry:</span>
                <span class="signal-detail-value">${signal.Entry || '-'}</span>
              </div>
              <div class="signal-detail">
                <span class="signal-detail-label">SL:</span>
                <span class="signal-detail-value">${signal.Sl || '-'}</span>
              </div>
              <div class="signal-detail">
                <span class="signal-detail-label">TP:</span>
                <span class="signal-detail-value">${signal.Tp || '-'}</span>
              </div>
              <div class="signal-detail">
                <span class="signal-detail-label">Timeframe:</span>
                <span class="signal-detail-value">${signal.Timeframe || '-'}</span>
              </div>
              <div class="signal-detail">
                <span class="signal-detail-label">Confidence:</span>
                <span class="signal-detail-value">${signal.Confidence || '-'}</span>
              </div>
              <div class="signal-detail">
                <span class="signal-detail-label">Date:</span>
                <span class="signal-detail-value">${formattedDate}</span>
              </div>
              <div class="signal-detail">
                <span class="signal-detail-label">Expiry:</span>
                <span class="signal-detail-value">${signal.Expiry || '-'}</span>
              </div>
            </div>
            <div class="signal-reason">${signal.Reason || ''}</div>
          `;
          
          // Add overlay for blurred signals
          if ((signal.Market === 'FOREX' && !userSubscriptions.hasForex) || 
              (signal.Market === 'DERIV' && !userSubscriptions.hasDeriv)) {
            const overlay = document.createElement('div');
            overlay.className = 'signal-overlay';
            overlay.innerHTML = `
              <div class="overlay-content">
                <p>Subscribe to view ${signal.Market} signals</p>
                <button onclick="window.location.href='../cashier/transact/subscriptions.html'">Subscribe Now</button>
              </div>
            `;
            signalBox.appendChild(overlay);
          }
          
          signalGrid.appendChild(signalBox);
        });
        
        // Create pagination controls if needed
        if (totalPages > 1) {
          const paginationDiv = document.createElement('div');
          paginationDiv.className = 'pagination';
          
          // Previous button
          const prevButton = document.createElement('button');
          prevButton.textContent = 'Previous';
          prevButton.disabled = currentPage === 1;
          prevButton.addEventListener('click', () => {
            currentPage--;
            displaySignals(signals);
          });
          paginationDiv.appendChild(prevButton);
          
          // Page numbers
          for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = currentPage === i ? 'active' : '';
            pageButton.addEventListener('click', () => {
              currentPage = i;
              displaySignals(signals);
            });
            paginationDiv.appendChild(pageButton);
          }
          
          // Next button
          const nextButton = document.createElement('button');
          nextButton.textContent = 'Next';
          nextButton.disabled = currentPage === totalPages;
          nextButton.addEventListener('click', () => {
            currentPage++;
            displaySignals(signals);
          });
          paginationDiv.appendChild(nextButton);
          
          paginationControls.appendChild(paginationDiv);
        }
      }
  
      // Function to update statistics
      function updateStats(filteredSignals = null) {
        const signalsToUse = filteredSignals || allSignals;
      
        // Forex stats - show all regardless of subscription
        const forexSignals = signalsToUse.filter(signal => signal.Market === 'FOREX');
        updateStatSection('forex', forexSignals);
      
        // Deriv stats - show all regardless of subscription
        const derivSignals = signalsToUse.filter(signal => signal.Market === 'DERIV');
        updateStatSection('deriv', derivSignals);
      
        // Combined stats - include all signals
        const combinedSignals = signalsToUse; // no filter based on subscription
        updateStatSection('combined', combinedSignals);
      }
      
  
      function updateStatSection(prefix, signals) {
        const active = signals.filter(s => !s.Results || s.Results === 'Active').length;
        const good = signals.filter(s => s.Results === 'Good').length;
        const bad = signals.filter(s => s.Results === 'Bad').length;
        const total = signals.length;
        const accuracy = total > 0 ? Math.round((good / (good + bad)) * 100) : 0;
        
        document.getElementById(`${prefix}-active`).textContent = active;
        document.getElementById(`${prefix}-good`).textContent = good;
        document.getElementById(`${prefix}-bad`).textContent = bad;
        document.getElementById(`${prefix}-total`).textContent = total;
        document.getElementById(`${prefix}-accuracy`).textContent = `${accuracy}%`;
      }
  
      // Menu toggle function
      function toggleMenu() {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.toggle('active');
      }
  
      // Logout function
      function logout(event) {
        event.preventDefault();
        auth.signOut().then(() => {
          window.location.href = event.target.href;
        }).catch((error) => {
          console.error('Logout error:', error);
          window.location.href = event.target.href;
        });
      }