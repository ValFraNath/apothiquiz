import firebase from "firebase";
import "firebase/messaging";
import axios from "axios";

const firebaseConfig = {
  apiKey: "AIzaSyCtGrFY1_UOzWAFn1xt1CRPNGZ40JZcaJw",
  authDomain: "guacamole-31ba0.firebaseapp.com",
  projectId: "guacamole-31ba0",
  storageBucket: "guacamole-31ba0.appspot.com",
  messagingSenderId: "46062321146",
  appId: "1:46062321146:web:bcd9f8b8caf30c2aacf843",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

export async function getToken(user) {
  const reg = await navigator.serviceWorker.getRegistration();

  const currentToken = await messaging.getToken({
    vapidKey:
      "BFW2K4Eu0CFRDsJFJTVrdXbwalM7iIiL4t_BVzbgqPik9WJvHUgzedh5baLT0ukRsm1WG_BGT7A_5KygJ_WLfYs",
    serviceWorkerRegistration: reg,
  });

  if (currentToken) {
    await axios.put("/api/v1/messaging/token/add", {
      user: user,
      messagingToken: currentToken,
    });
  }

  localStorage.setItem(
    "messagingToken",
    JSON.stringify({
      user: user,
      token: currentToken,
    })
  );

  return currentToken;
}

export async function checkAndRemoveToken() {
  if (!localStorage.getItem("messagingToken")) return;

  const curretToken = JSON.parse(localStorage.getItem("messagingToken"));
  localStorage.removeItem("messagingToken");

  await axios.put("/api/v1/messaging/token/remove", {
    user: curretToken.user,
  });
}

export function onMessage() {
  return new Promise((resolve) => {
    messaging.onMessage((payload) => resolve(payload));
  });
}
