import dotenv from "dotenv";
import faker from "faker";

import { fetchConfigFromDB } from "../controllers/config.js";
import { createRounds, createDuelInDatabase } from "../controllers/duels.js";

import Database, { queryPromise } from "./database.js";

dotenv.config();

const NUMBER_OF_USERS = process.argv[2] ?? 300;
const NUMBER_OF_DUELS = process.argv[3] ?? NUMBER_OF_USERS * 10;
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
    await Database.start();

    console.info("Users...");
    const users = generateUsers(NUMBER_OF_USERS);
    await insertUsers(users);
    console.info("... Done!");

    console.info("Duels...");
    await createAndInsertDuels(users, NUMBER_OF_DUELS);
    console.info("... Done!");

    console.info("Data inserted, bye!");
    console.info(
      "You can connect to the app with one of these usernames",
      users.slice(0, 10).map((u) => u[0])
    );
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
      .replace(/\s+/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .substr(0, 8)
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

async function createAndInsertDuels(users, number) {
  const usernames = users.map((u) => u[0]);
  const config = await fetchConfigFromDB();
  
  
  for (let i = 0; i < number; i++) {
    const rounds = await createRounds(config);
    // const numberOfAnswer = rounds[0][0].answers.length;

    const [user1, user2] = faker.random.arrayElements(usernames, 2);
    await createDuelInDatabase(user1, user2, rounds);
  }

  return;
}
