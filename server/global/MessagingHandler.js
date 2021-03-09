import fs from "fs/promises";
import path from "path";

import admin from "firebase-admin";

import { queryPromise } from "../db/database.js";

import Logger from "./Logger.js";

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

            appInstance
              .messaging()
              .send(message)
              .catch((err) => Logger.error(err));
          })
          .catch((err) => Logger(err));
      })
      .catch((err) => Logger.error(err));
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
        .catch((err) => reject(err));
    });
  }
}

MessagingHandler.SERVICE_ACCOUNT_KEY_FILE = "files-config/serviceAccountKey.json";

export default MessagingHandlerFactory;
