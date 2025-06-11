import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { firebaseConfig, supabaseConfig } from './shared-config.js';

let firebaseApp;
let firebaseAuth;
let supabaseClient;

export function getFirebaseApp() {
    if (!firebaseApp) {
        firebaseApp = initializeApp(firebaseConfig);
    }
    return firebaseApp;
}

export function getFirebaseAuth() {
    if (!firebaseAuth) {
        firebaseAuth = getAuth(getFirebaseApp());
    }
    return firebaseAuth;
}

export function getSupabaseClient() {
    if (!supabaseClient) {
        supabaseClient = createClient(supabaseConfig.url, supabaseConfig.key);
    }
    return supabaseClient;
}