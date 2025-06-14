  const supabaseUrl = 'https://fepujhdzovzbygczdjxe.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU';

  const { createClient } = supabase;
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  async function loadInstruments() {
    const selectElement = document.getElementById('instruments');

    // Clear existing options
    selectElement.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select Instrument';
    defaultOption.value = '';
    selectElement.appendChild(defaultOption);

    // Fetch rows from synthetic_price
    const { data, error } = await supabaseClient
      .from('synthetic_price')
      .select('id');

    if (error) {
      console.error('Error fetching instruments:', error.message);
      return;
    }

    // Populate options with IDs
    data.forEach(row => {
      const option = document.createElement('option');
      option.value = row.id;
      option.textContent = row.id;
      selectElement.appendChild(option);
    });
  }

  // Load instruments on page load
  document.addEventListener('DOMContentLoaded', loadInstruments);