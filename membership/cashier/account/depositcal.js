
  // Utility to safely convert text to float
  function getFloatFromElement(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const value = parseFloat(el.textContent || el.value || "0");
    return isNaN(value) ? 0 : value;
  }

  // Calculation function
  function calculateAndUpdate() {
    const credits = getFloatFromElement('user-credits');
    const amount = getFloatFromElement('amount');

    const balance = credits + amount;
    const depositZar = amount;

    const balanceEl = document.getElementById('user-balance');
    const depositZarEl = document.getElementById('deposit-zar');

    if (balanceEl) balanceEl.textContent = balance.toFixed(2);
    if (depositZarEl) depositZarEl.textContent = depositZar.toFixed(2);
  }

  // Mutation Observer Setup for real-time updates
  const observeIds = ['user-credits', 'amount'];
  const observer = new MutationObserver(calculateAndUpdate);

  // Start observing text content changes
  observeIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      observer.observe(el, { childList: true, subtree: true, characterData: true });
    }
  });

  // Also listen to input changes (if amount is an input field)
  observeIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.tagName === "INPUT") {
      el.addEventListener('input', calculateAndUpdate);
    }
  });

  // Initial calculation
  document.addEventListener("DOMContentLoaded", calculateAndUpdate);
