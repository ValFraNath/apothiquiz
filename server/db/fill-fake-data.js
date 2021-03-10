import dotenv from "dotenv";
import faker from "faker";

import { fetchConfigFromDB } from "../controllers/config.js";
import {
  createRounds,
  createDuelInDatabase,
  insertResultInDatabase,
  updateDuelState,
} from "../controllers/duels.js";
import { formatDate } from "../global/dateUtils.js";

import Database, { queryPromise } from "./database.js";

dotenv.config();

const NUMBER_OF_USERS = process.argv[2] ?? 300;
const NUMBER_OF_DUELS = process.argv[3] ?? NUMBER_OF_USERS * 10;
const SEED = 123;

if (NUMBER_OF_USERS < 2 && NUMBER_OF_DUELS > 0) {
  console.error("You have to generate at least two users");
  process.exit(1);
}

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

    console.info("\nUsers...");
    const users = generateUsers(NUMBER_OF_USERS);
    await insertUsers(users);
    console.info("... Done!");

    console.info("\nDuels...");
    await createAndInsertDuels(users, NUMBER_OF_DUELS);
    console.info("... Done!");

    console.info("\nData inserted, bye!");
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
  const MAX_ANSWER = 3;
  const BATCH_SIZE = 100;
  const NUMBER_OF_BATCH = Math.ceil(number / BATCH_SIZE);

  try {
    for (let i = 0; i < NUMBER_OF_BATCH; i++) {
      const currentBatchSize = Math.min(BATCH_SIZE, number - i * BATCH_SIZE);

      console.debug(`  Duel batch of ${currentBatchSize} duels (${1 + i} / ${NUMBER_OF_BATCH})`);

      const promises = Array(currentBatchSize)
        .fill()
        .map((_, localI) =>
          createFakeDuel(config, usernames, MAX_ANSWER, i * BATCH_SIZE + localI + 1)
        );

      await Promise.all(promises);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

function createFakeDuel(config, usernames, MAX_ANSWER, index) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const rounds = await createRounds(config);

        const [user1, user2] = faker.random.arrayElements(usernames, 2);
        const duelID = await createDuelInDatabase(user1, user2, rounds);

        const numberOfRoundsPlayed = faker.random.number(config.roundsPerDuel);
        const numberOfQuestionsPerRound = Number(config.questionsPerRound);

        for (let i = 0; i < numberOfRoundsPlayed; i++) {
          const fakeAnswersUser1 = Array(numberOfQuestionsPerRound)
            .fill()
            .map(() => faker.random.number(MAX_ANSWER));

          const fakeAnswersUser2 = Array(numberOfQuestionsPerRound - faker.random.number(1))
            .fill()
            .map(() => faker.random.number(MAX_ANSWER));

          const [updatedDuel1, updatedDuel2] = await Promise.all([
            insertResultInDatabase(duelID, user1, fakeAnswersUser1),
            insertResultInDatabase(duelID, user2, fakeAnswersUser2),
          ]);

          const [reallyUpdatedDuel1, reallyUpdatedDuel2] = await Promise.all([
            updateDuelState(updatedDuel1, user1),
            updateDuelState(updatedDuel2, user2),
          ]);

          if (reallyUpdatedDuel1.inProgress === 0 || reallyUpdatedDuel2.inProgress === 0) {
            const currentDate = formatDate();
            const sql = "UPDATE duel SET du_finished = ? WHERE du_id = ?;";
            await queryPromise(sql, [currentDate, duelID]);
          }
        }

        console.info(
          `    ${index
            .toString()
            .padStart(Math.log10(NUMBER_OF_DUELS))}. Generated duel ${duelID
            .toString()
            .padEnd(6)} between ${user1.padEnd(8)} and ${user2.padEnd(
            8,
            " "
          )} with ${numberOfRoundsPlayed} played rounds`
        );

        resolve();
      } catch (err) {
        reject(err);
      }
    })();
  });
}
