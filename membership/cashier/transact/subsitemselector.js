import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ✅ Initialize Supabase using the imported createClient function
const supabaseUrl = "https://fepujhdzovzbygczdjxe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU";
const supabase = createClient(supabaseUrl, supabaseKey); // ✅ use createClient, not supabase.createClient

const itemName = document.getElementById('item-name');
const dropdown = document.getElementById('item-dropdown');
const itemCost = document.getElementById('item-cost');

let columnNames = [];
let rowData = null;

// Fetch the first row and extract column names
async function loadItemListSchema() {
  const { data, error } = await supabase
    .from('ItemList')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching ItemList row:', error.message);
    return;
  }

  rowData = data;
  columnNames = Object.keys(data);
}

await loadItemListSchema();

// Show dropdown on click
itemName.addEventListener('click', () => {
  dropdown.innerHTML = '';
  columnNames.forEach(column => {
    const li = document.createElement('li');
    li.textContent = column;
    li.style.padding = '5px';
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      itemName.textContent = column;
      itemCost.textContent = rowData[column] ?? 'N/A';
      dropdown.style.display = 'none';
    });
    dropdown.appendChild(li);
  });
  dropdown.style.display = 'block';
});

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.panel-item')) {
    dropdown.style.display = 'none';
  }
});
