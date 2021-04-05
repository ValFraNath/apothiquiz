import axios from "axios";
import firebase from "firebase";
import "firebase/messaging";

// Initialize app with firebase data
// You can create a project and get these data here: https://firebase.google.com/
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

/**
 * Get the push registration token for a user
 */
export async function getToken(user) {
  // Service-worker registration
  const reg = await navigator.serviceWorker.getRegistration();

  // Get the token and link our own service-worker
  const currentToken = await messaging.getToken({
    vapidKey: "YOUR_VAPID_KEY",
    serviceWorkerRegistration: reg,
  });

  // Save the user's token in database
  if (currentToken) {
    await axios.put("/api/v1/messaging/token/add", {
      user: user,
      messagingToken: currentToken,
    });
  }

  // Save the user's token in localStorage
  localStorage.setItem(
    "messagingToken",
    JSON.stringify({
      user: user,
      token: currentToken,
    })
  );

  return currentToken;
}

/**
 * Check if there is a token stored in localStorage and remove it
 * @returns
 */
export async function checkAndRemoveToken() {
  if (!localStorage.getItem("messagingToken")) return;

  // Remove from localStorage
  const curretToken = JSON.parse(localStorage.getItem("messagingToken"));
  localStorage.removeItem("messagingToken");

  // Remove from database
  await axios.put("/api/v1/messaging/token/remove", {
    user: curretToken.user,
  });
}

/**
 * Return the received message from firebase
 */
export function onMessage() {
  return new Promise((resolve) => {
    messaging.onMessage((payload) => resolve(payload));
  });
}
