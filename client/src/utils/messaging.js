import axios from "axios";
import firebase from "firebase/app";
import "firebase/messaging";

export function installFirebase() {
  // Information available in the firebase console
  firebase.initializeApp({
    apiKey: "AIzaSyCtGrFY1_UOzWAFn1xt1CRPNGZ40JZcaJw",
    authDomain: "guacamole-31ba0.firebaseapp.com",
    projectId: "guacamole-31ba0",
    storageBucket: "guacamole-31ba0.appspot.com",
    messagingSenderId: "46062321146",
    appId: "1:46062321146:web:bcd9f8b8caf30c2aacf843",
  });
}

export function saveToken() {
  const messaging = firebase.messaging();
  navigator.serviceWorker
    .getRegistration()
    .then((reg) => {
      messaging
        .getToken({
          vapidKey:
            "BFW2K4Eu0CFRDsJFJTVrdXbwalM7iIiL4t_BVzbgqPik9WJvHUgzedh5baLT0ukRsm1WG_BGT7A_5KygJ_WLfYs",
          serviceWorkerRegistration: reg,
        })
        .then((currentToken) => {
          if (currentToken) {
            const savedToken = localStorage.getItem("messagingToken");
            if (savedToken !== currentToken) {
              axios
                .put("/api/v1/messaging/token/add", {
                  user: JSON.parse(localStorage.getItem("user_informations")).pseudo,
                  messagingToken: currentToken,
                })
                .catch((err) => console.error("Can't send token to server", err));
            }
            localStorage.setItem("messagingToken", currentToken);
          }
        })
        .catch((err) => console.error("Can't retrieve token", err));
    })
    .catch((err) => console.error("Can't get service-worker registration", err));
}

export function removeToken() {
  if (!localStorage.getItem("messagingToken")) return;

  const messaging = firebase.messaging();
  messaging.deleteToken().catch((err) => console.error("Can't delete token", err));

  axios
    .put("/api/v1/messaging/token/remove", {
      user: JSON.parse(localStorage.getItem("user_informations")).pseudo,
    })
    .then(() => {
      localStorage.removeItem("messagingToken");
    })
    .catch((err) => console.error("Can't request server to delete token", err));
}
