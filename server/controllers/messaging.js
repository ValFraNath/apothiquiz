import admin from "firebase-admin";

import saKey from "../files/serviceAccountKey.json";

/* Initialize firebase */
admin.initializeApp({
  credential: admin.credential.cert(saKey),
});

/* Users tokens */
const subscribedUsers = {};

export function sendNotificationToOneDevice(username, data) {
  const message = {
    data: data,
    token: subscribedUsers[username],
  };

  admin
    .messaging()
    .send(message)
    .catch((err) => console.error("Can't send notification to a single device", err));
}

export function sendNotificationToAllDevices(data) {
  const message = {
    data: data,
    tokens: Object.values(subscribedUsers),
  };

  admin
    .messaging()
    .sendMulticast(message)
    .catch((err) => console.error("Can't send notification to several devices", err));
}
