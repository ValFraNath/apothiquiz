import axios from "axios";
import firebase from "firebase/app";
import "firebase/messaging";

class MessagingHandler {
  constructor() {
    // Information available in the firebase console
    this.app = firebase.initializeApp({
      apiKey: "AIzaSyCtGrFY1_UOzWAFn1xt1CRPNGZ40JZcaJw",
      authDomain: "guacamole-31ba0.firebaseapp.com",
      projectId: "guacamole-31ba0",
      storageBucket: "guacamole-31ba0.appspot.com",
      messagingSenderId: "46062321146",
      appId: "1:46062321146:web:bcd9f8b8caf30c2aacf843",
    });
  }

  getMessaging() {
    return this.app.messaging();
  }

  saveToken() {
    const messaging = this.app.messaging();
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
              const user = JSON.parse(localStorage.getItem("user_informations")).pseudo;
              let savedToken = localStorage.getItem("messagingToken");
              if (savedToken) {
                savedToken = JSON.parse(savedToken).token;
              }
              if (savedToken !== currentToken) {
                axios
                  .put("/api/v1/messaging/token/add", {
                    user: user,
                    messagingToken: currentToken,
                  })
                  .catch((err) => console.error("Can't send token to server", err));
              }
              localStorage.setItem(
                "messagingToken",
                JSON.stringify({
                  user: user,
                  token: currentToken,
                })
              );

              this.saved = true;
            }
          })
          .catch((err) => console.error("Can't retrieve token", err));
      })
      .catch((err) => console.error("Can't get service-worker registration", err));
  }

  removeToken() {
    if (!localStorage.getItem("messagingToken")) return;

    const curretToken = JSON.parse(localStorage.getItem("messagingToken"));
    localStorage.removeItem("messagingToken");

    axios
      .put("/api/v1/messaging/token/remove", {
        user: curretToken.user,
      })
      .catch((err) => console.error("Can't request server to delete token", err));
  }
}

export default MessagingHandler;
