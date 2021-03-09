import dotenv from "dotenv";
import faker from "faker";

import Database, { queryPromise } from "./database.js";

dotenv.config();

const NUMBER_OF_USERS = parseInt(process.argv[2]) ?? 300;
const NUMBER_OF_DUELS = parseInt(process.argv[3]) ?? Math.pow(NUMBER_OF_USERS, 2);
const SEED = 123;

console.info(`Filling database with ${NUMBER_OF_USERS} users and ${NUMBER_OF_DUELS} duels.`);
console.info(`Using seed ${SEED}`);

faker.locale = "fr";
faker.seed(SEED);

start();

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

async function start() {
  try {
    await Database.connect();

    console.info("Users...");
    await insertUsers(generateUsers(NUMBER_OF_USERS));
    console.info("... Done!");

    console.info("Data inserted, bye!");
    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}

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

async function insertUsers(users) {
  const sqlUsers = `INSERT INTO user (us_login, us_admin, us_deleted, us_defeats, us_avatar)
  VALUES ${users.map(() => `(?)`).join(",")} \
  ON DUPLICATE KEY UPDATE us_admin = FALSE, us_deleted = NULL; `;

  await queryPromise(sqlUsers, users);
}
