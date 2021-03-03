import dotenv from "dotenv";
import faker from "faker";

import Database, { queryPromise } from "./database.js";

dotenv.config();

Database.connect()
  .then(() => {})
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

faker.locale = "fr";
faker.seed(123);

function generateUsers(number) {
  const users = [];
  const usedLogins = {
    /** us_login: true */
  };

  for (let i = 0; i < number; i++) {
    const fakeName = (faker.name.firstName().substr(0, 1) + faker.name.lastName())
      .substr(0, 8)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();

    if (usedLogins[fakeName]) {
      i--;
      continue;
    }

    const fakeUser = [
      fakeName,
      false,
      null,
      0,
      JSON.stringify({
        eyes: faker.random.number({ min: 0, max: 4 }),
        hands: faker.random.number({ min: 0, max: 4 }),
        hat: faker.random.number({ min: 0, max: 4 }),
        mouth: faker.random.number({ min: 0, max: 4 }),
        colorBody: faker.internet.color().toUpperCase(),
        colorBG: faker.internet.color().toUpperCase(),
      }),
    ];

    usedLogins[fakeName] = true;
    users.push(fakeUser);
  }

  return users;
}

const users = generateUsers(300);

const sqlUsers = `INSERT INTO user (us_login, us_admin, us_deleted, us_defeats, us_avatar)
                  VALUES ${users.map(() => `(?)`).join(",")} \
                  ON DUPLICATE KEY UPDATE us_admin = FALSE, us_deleted = NULL; `;

queryPromise(sqlUsers, users)
  .then()
  .catch((err) => console.error(err));
