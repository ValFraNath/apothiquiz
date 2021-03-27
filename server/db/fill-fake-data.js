import fs from "fs/promises";
import path from "path";

import chai from "chai";
import chaiHttp from "chai-http";
import dotenv from "dotenv";
import faker from "faker";

import { fetchConfigFromDB } from "../controllers/config.js";
import app from "../index.js";

import { queryPromise } from "./database.js";

chai.use(chaiHttp);
dotenv.config();

const NUMBER_OF_USERS = process.argv[2] ?? 300;
const NUMBER_OF_DUELS = process.argv[3] ?? NUMBER_OF_USERS * 10;
const SEED = 123;

if (NUMBER_OF_USERS < 2 && NUMBER_OF_DUELS > 0) {
  console.error("You have to generate at least two users");
  process.exit(1);
}

faker.locale = "fr";
faker.seed(SEED);

start();

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
async function start() {
  try {
    // Sleep waiting that the server starts
    while (!app.isReady) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.info(`Filling database with ${NUMBER_OF_USERS} users and ${NUMBER_OF_DUELS} duels.`);
    console.info(`Using seed ${SEED}`);
    console.info("");

    console.info("\nUsers...");
    const users = generateUsers(NUMBER_OF_USERS);
    const nbInserted = await insertUsers(users);
    console.info(`... Done! Inserted ${nbInserted} new users`);

    console.info("\nChecking molecules...");
    const nbMolecules = (await queryPromise("SELECT COUNT(*) AS count FROM molecule;"))[0].count;

    if (nbMolecules === 0) {
      console.info("  No molecule found, inserting default molecules from tests");
      const script = await fs.readFile(path.resolve("test", "required_data", "molecules.sql"), {
        encoding: "utf8",
      });

      await queryPromise(script);
    }
    console.info("...Done!");

    console.info("\nDuels...");
    const nbCreatedDuels = await createAndInsertFakeDuelsWithAPI(users, NUMBER_OF_DUELS);
    console.info(`... Done! Created ${nbCreatedDuels} duels`);

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

  const res = await queryPromise(sqlUsers, users);

  const nbOfNewUsers = res.affectedRows - res.changedRows;
  return nbOfNewUsers;
}

async function createAndInsertFakeDuelsWithAPI(users, number) {
  const usernames = users.map((u) => u[0]);
  const config = await fetchConfigFromDB();
  const MAX_ANSWER = 3;
  const BATCH_SIZE = 100;
  const NUMBER_OF_BATCH = Math.ceil(number / BATCH_SIZE);

  let nbCreatedDuels = 0;

  try {
    for (let i = 0; i < NUMBER_OF_BATCH; i++) {
      const currentBatchSize = Math.min(BATCH_SIZE, number - i * BATCH_SIZE);

      console.info(`  Duel batch of ${currentBatchSize} duels (${1 + i} / ${NUMBER_OF_BATCH})`);

      const promises = Array(currentBatchSize)
        .fill()
        .map((_, localI) =>
          createFakeDuelWithAPI(config, usernames, MAX_ANSWER, i * BATCH_SIZE + localI + 1)
        );

      const resp = await Promise.all(promises);
      nbCreatedDuels += resp.filter(Boolean).length;
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  return nbCreatedDuels;
}

async function createFakeDuelWithAPI(config, usernames, MAX_ANSWER, index) {
  // For printing
  const strIndex = index.toString().padStart(Math.log10(NUMBER_OF_DUELS));

  const [user1, user2] = faker.random.arrayElements(usernames, 2);
  if (user1 === user2) {
    console.warn(`     ${user1} can't defy himself/herself!`);
    return false;
  }

  const [token1, token2] = await Promise.all([getToken(user1, "1234"), getToken(user2, "1234")]);

  const resp = await postToAPI("duels/new", {
    token: token1,
    method: "post",
    body: { opponent: user2 },
  });

  if (resp.statusCode === 409) {
    console.warn(`    ${strIndex}. Duel already exists between ${user1} and ${user2}`);
    return false;
  }

  if (resp.statusCode !== 201) {
    throw "Can't create duel: " + resp.statusCode + " " + resp.error.text;
  }

  const duelID = resp.body.id;

  const numberOfRoundsPlayed = faker.random.number(config.roundsPerDuel);
  const nbQuestions = Number(config.questionsPerRound);

  for (let i = 1; i <= numberOfRoundsPlayed; i++) {
    const res = await sendFakeAnswersWithAPI(nbQuestions, MAX_ANSWER, duelID, i, token1);

    if (res.statusCode !== 200) {
      throw `User 1 ${user1} can't play round ${i}. Error ${res.statusCode} ${res.error.text}`;
    }

    // Sometimes the second user doesn't play the last round
    if (i !== numberOfRoundsPlayed || faker.random.boolean()) {
      const res = await sendFakeAnswersWithAPI(nbQuestions, MAX_ANSWER, duelID, i, token2);

      if (res.statusCode !== 200) {
        throw `User 2 ${user2} can't play round ${i}. Error ${res.statusCode} ${res.error.text}`;
      }
    }
  }

  // Printing
  const strDuelId = duelID.toString().padEnd(6);
  const strUser1 = user1.padEnd(8);
  const strUser2 = user2.padEnd(8);
  console.info(
    `    ${strIndex}. Generated duel ${strDuelId} between ${strUser1} and ${strUser2} with ${numberOfRoundsPlayed} played rounds`
  );

  return true;
}

async function sendFakeAnswersWithAPI(nbQuestionPerRound, MAX_ANSWER, duelID, roundID, userToken) {
  const fakeAnswers = Array(nbQuestionPerRound)
    .fill()
    .map(() => faker.random.number(MAX_ANSWER));

  const res = await postToAPI(`duels/${duelID}/${roundID}`, {
    token: userToken,
    method: "post",
    body: { answers: fakeAnswers },
  });

  return res;
}

/**
 * Make a authenticated post request to the api
 * @param {string} endpoint The endpoint
 * @param {{body? : object, token : string}} param1 The request option
 * @returns
 */
async function postToAPI(endpoint, { body = {}, token } = {}) {
  const res = await chai
    .request(app)
    .post("/api/v1/" + endpoint)
    .set("Authorization", `Bearer ${token}`)
    .send(body);

  return res;
}

/**
 * Get a token for a user
 * @param {string} username The user login
 * @param {string} password The user password
 * @returns {Promise<string>} The token
 */
export async function getToken(username, password = "1234") {
  const res = await postToAPI("users/login", {
    body: { userPseudo: username, userPassword: password },
    method: "post",
  });

  return res.body.accessToken;
}
