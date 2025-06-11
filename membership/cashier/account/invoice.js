// Firebase + Supabase Unified Realtime Script with Invoice Functionality
import { getFirebaseAuth } from './init-services.js';
import { getSupabaseClient } from './init-services.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Get the singleton instances
const auth = getFirebaseAuth();
const supabase = getSupabaseClient();

// Global variables
let currentTransaction = null;
let transactions = []; // Store transactions globally for invoice access

// Utility to render transaction rows
function renderTransactions(transactionsArray) {
  const tableBody = document.getElementById('TransactionHistory');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  transactions = transactionsArray; // Update global transactions reference

  transactionsArray.forEach(tx => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${tx.TransactionID || ''}</td>
      <td>${tx.ItemName || ''}</td>
      <td>${new Date(tx.Date).toLocaleString() || ''}</td>
      <td>${tx.Type || ''}</td>
      <td>${tx.Quantity || ''}</td>
      <td>R${(tx.Amount || 0).toFixed(2)}</td>
      <td>R${(tx.OpeningBalance || 0).toFixed(2)}</td>
      <td>R${(tx.ClosingBalance || 0).toFixed(2)}</td>
      <td>${tx.Status || ''}</td>
      <td><button class="invoice-btn" data-transaction-id="${tx.TransactionID}">Invoice</button></td>
    `;
    tableBody.appendChild(row);
  });

  // Add event listeners to all invoice buttons
  document.querySelectorAll('.invoice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      downloadInvoice(e.target.dataset.transactionId);
    });
  });
}

// Load + subscribe function
async function loadAndSubscribe(uid) {
  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('TransactionHistory')
      .select('*')
      .eq('id', uid)
      .eq('Status', 'Completed')
      .order('Date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error.message);
      return;
    }

    renderTransactions(data);
  };

  await loadTransactions(); // Initial load

  // Subscribe to changes
  supabase
    .channel('realtime:TransactionHistory')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'TransactionHistory',
        filter: `id=eq.${uid}`,
      },
      payload => {
        if (payload.new.Type === 'Withdrawal') {
          loadTransactions(); // Refresh when relevant change happens
        }
      }
    )
    .subscribe();
}

// Invoice functions
function downloadInvoice(transactionId) {
  const transaction = transactions.find(tx => tx.TransactionID === transactionId);
  
  if (!transaction) {
    alert('Transaction not found');
    return;
  }
  
  currentTransaction = transaction;
  showInvoiceModal(transaction);
}

function showInvoiceModal(transaction) {
  const modal = document.getElementById('invoiceModal');
  if (!modal) {
    console.error('Invoice modal element not found');
    return;
  }

  // Populate invoice data
  document.getElementById('invNumber').textContent = transaction.TransactionID;
  document.getElementById('invoiceDate').textContent = new Date(transaction.Date).toLocaleDateString();
  
  // Calculate due date (7 days from invoice date)
  const dueDate = new Date(transaction.Date);
  dueDate.setDate(dueDate.getDate() + 7);
  document.getElementById('dueDate').textContent = dueDate.toLocaleDateString();
  
  // Client info (you might need to fetch this from your database)
  document.getElementById('clientName').textContent = 'Client Name'; // Replace with actual client name
  document.getElementById('clientEmail').textContent = 'client@email.com'; // Replace with actual email
  document.getElementById('clientAddress').textContent = '123 Client Street, City, Country'; // Replace with actual address
  
  // Invoice items
  const itemsTable = document.getElementById('invoiceItems');
  if (itemsTable) {
    itemsTable.innerHTML = `
      <tr>
        <td>${transaction.ItemName || 'Product/Service'}</td>
        <td>${transaction.Type || 'Standard item'}</td>
        <td>${transaction.Quantity || 1}</td>
        <td>R${(transaction.Amount || 0).toFixed(2)}</td>
        <td>R${(transaction.Amount || 0).toFixed(2)}</td>
      </tr>
    `;
  }
  
  // Calculate totals
  const subtotal = transaction.Amount || 0;
  const vat = subtotal * 0.15; // Assuming 15% VAT
  const grandTotal = subtotal + vat;
  
  document.getElementById('subtotal').textContent = `R${subtotal.toFixed(2)}`;
  document.getElementById('vat').textContent = `R${vat.toFixed(2)}`;
  document.getElementById('grandTotal').textContent = `R${grandTotal.toFixed(2)}`;
  
  // Show modal
  modal.style.display = 'block';
}

function closeInvoiceModal() {
  const modal = document.getElementById('invoiceModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function printInvoice() {
  const invoiceContainer = document.querySelector('.invoice-container');
  if (!invoiceContainer || !currentTransaction) return;

  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice ${currentTransaction.TransactionID}</title>
        <style>
          ${document.querySelector('style')?.innerHTML || ''}
          @media print {
            body { margin: 0; padding: 0; }
            .invoice-actions { display: none; }
            .invoice-container { box-shadow: none; padding: 0; margin: 0; }
          }
        </style>
      </head>
      <body>
        ${invoiceContainer.outerHTML}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 1000);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function downloadInvoicePDF() {
  // For a real implementation, you would use a library like jsPDF or make an API call
  // This is a simplified version that just triggers the print dialog
  alert('In a production environment, this would generate a PDF. For now, please use the Print option and save as PDF.');
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('invoiceModal');
  if (event.target === modal) {
    closeInvoiceModal();
  }
};

// Expose functions to window for HTML onclick attributes
window.downloadInvoice = downloadInvoice;
window.closeInvoiceModal = closeInvoiceModal;
window.printInvoice = printInvoice;
window.downloadInvoicePDF = downloadInvoicePDF;

// Auth listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadAndSubscribe(user.uid);
  } else {
    console.warn('User not authenticated');
    // Clear transactions when user logs out
    transactions = [];
    const tableBody = document.getElementById('TransactionHistory');
    if (tableBody) tableBody.innerHTML = '';
  }
});