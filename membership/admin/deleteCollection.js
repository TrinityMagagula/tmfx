const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK with your service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com" // Replace with your actual database URL
});

const db = admin.database();

async function deleteNode(nodePath) {
  try {
    const ref = db.ref(nodePath);

    // Log the attempt to remove the node
    console.log(`Attempting to delete node at: ${nodePath}`);

    // Attempt to remove the specified node and its children
    await ref.remove();
    console.log(`Successfully deleted the node: ${nodePath}`);
  } catch (error) {
    // Log detailed error information for debugging
    console.error('Error deleting node:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

// Call the function to delete the 'syntheticIndex' node
deleteNode('syntheticIndex')
  .catch(error => console.error('Error deleting syntheticIndex: ', error));
