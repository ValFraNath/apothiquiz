import * as admin from "firebase-admin";
import * as serviceAccount from "files/";

function sendNotificationToOneDevice(data, target) {
  const message = {
    data: data,
    token: target,
  };

  admin
    .messaging()
    .send(message)
    .catch((err) => console.warn("error", err));
}
