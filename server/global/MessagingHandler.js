import fs from "fs";
import path from "path";

import admin from "firebase-admin";

import { addErrorTitle } from "./Logger";

/* Create singleton class */
const MessagingHandlerFactory = (function () {
  let instance = null;

  return {
    getInstance: function () {
      if (!instance) {
        instance = new MessagingHandler();
      }
      return instance;
    },
  };
})();

class MessagingHandler {
  constructor() {
    fs.readFile(
      path.resolve(fs.realpathSync("."), MessagingHandler.SERVICE_ACCOUNT_KEY_FILE),
      "utf-8",
      (err, data) => {
        if (err) {
          console.error(addErrorTitle(err, "Can't read service account key file", true));
          return;
        }
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(data)),
        });
      }
    );
  }

  sendNotificationToOneDevice(targetToken, data) {
    const message = {
      data: data,
      token: targetToken,
    };

    admin
      .messaging()
      .send(message)
      .catch((err) => addErrorTitle(err, "Can't send notification to one device", true));
  }
}

MessagingHandler.SERVICE_ACCOUNT_KEY_FILE = "files/serviceAccountKey.json";

export default MessagingHandlerFactory;
