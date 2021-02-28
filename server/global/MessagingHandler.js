import fs from "fs/promises";
import path from "path";

import admin from "firebase-admin";

import { queryPromise } from "../db/database.js";

import { addErrorTitle } from "./Logger.js";

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
    this.app = this._initializeApp();
  }

  sendNotificationToOneDevice(user, data) {
    this.app
      .then((appInstance) => {
        this._getUserMessagingToken(user)
          .then((token) => {
            const message = {
              data: data,
              token: token,
            };

            console.log(data);

            appInstance
              .messaging()
              .send(message)
              .catch((err) =>
                console.error(addErrorTitle(err, "Can't send notification to one device", true))
              );
          })
          .catch((err) =>
            console.error(addErrorTitle(err, "Can't get messaging token from user", true))
          );
      })
      .catch((err) => console.error(addErrorTitle(err, "Can't get firebase instance", true)));
  }

  async _initializeApp() {
    const data = await fs.readFile(
      path.resolve(process.cwd(), MessagingHandler.SERVICE_ACCOUNT_KEY_FILE),
      "utf-8"
    );
    return admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(data)),
    });
  }

  _getUserMessagingToken(user) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT us_messaging_token
                   FROM user
                   WHERE us_login = ?`;
      queryPromise(sql, [user])
        .then((res) => resolve(res[0].us_messaging_token))
        .catch((err) => reject(addErrorTitle(err, "Can't get messaging token", true)));
    });
  }
}

MessagingHandler.SERVICE_ACCOUNT_KEY_FILE = "files/serviceAccountKey.json";

export default MessagingHandlerFactory;
