import fs from "fs/promises";
import path from "path";
import { queryPromise } from "../db/database.js";

const typeGeneratorInfos = {
  1: {
    createFilename: () => filenameRandomLevel("question_CM", 2),
    before: "",
  },
  2: {
    createFilename: () => filenameRandomLevel("question_MC", 2),
    before: "",
  },
  3: {
    createFilename: () => filenameRandomLevel("question_SM", 2),
    before: "",
  },
  4: {
    createFilename: () => filenameRandomLevel("question_MS", 2),
    before: "",
  },
  5: {
    createFilename: () => "question_PM.sql",
    before: "SET @property = 'indications';",
  },
  6: {
    createFilename: () => "question_PM.sql",
    before: "SET @property = 'side_effects';",
  },
  7: {
    createFilename: () => "question_PM.sql",
    before: "SET @property = 'interactions';",
  },
  8: {
    createFilename: () => "question_MP.sql",
    before: "SET @property = 'indications';",
  },
  9: {
    createFilename: () => "question_MP.sql",
    before: "SET @property = 'side_effects';",
  },
  10: {
    createFilename: () => "question_MP.sql",
    before: "SET @property = 'interactions';",
  },
};

/**
 * @api {get} /question/:type Get a random question
 * @apiName GetRandomQuestion
 * @apiGroup Question
 *
 * @apiParam  {number{1...1}}         :type               Question type
 *
 * @apiSuccess (200) {Object}         question            Question object
 * @apiSuccess (200) {Number}         question.type       Type of the question
 * @apiSuccess (200) {String}         question.subject    Question subject
 * @apiSuccess (200) {String}         question.goodAnswer The good answer
 * @apiSuccess (200) {Array[String]}  question.badAnswers Three false answers
 *
 * @apiError   (404) NotFound Incorrect type of question
 * @apiUse     ErrorBadRequest
 */
async function generateQuestion(req, res) {
  let type = Number(req.params.type);
  let generateQuestion = generateQuestionOfType(type);

  if (!generateQuestion) {
    res.status(404).json({ message: "Incorrect type of question" });
    return;
  }

  generateQuestion()
    .then(({ type, subject, goodAnswer, answers }) => {
      res.status(200).json({ type, subject, goodAnswer, answers });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({
        message: `Error while generating question of type ${type} : ${error}`,
      });
    });
}

export default { generateQuestion };

// ***** Internal functions *****

const scriptsFolderPath = path.resolve("modules", "question_generator_scripts");

/**
 * Create a question by requesting database with a given script
 * @param {string} filename The script filename
 * @param {string} before An SQL script to add at the start of the script
 * @return {Promise<object>} The question
 */
async function queryQuestion(filename, type, before = "") {
  return new Promise(function (resolve, reject) {
    fs.readFile(path.resolve(scriptsFolderPath, filename), { encoding: "utf-8" }).then((script) => {
      queryPromise(before + script)
        .then((res) => {
          const data = res.find((e) => e instanceof Array);

          if (data.length < 3) {
            reject(new Error("Not enought data to generate question"));
          }
          resolve(Object.assign(formatQuestion(data), { type }));
        })
        .catch(reject);
    });
  });
}

/**
 * Compute a script filename with a random level
 * @param {string} filenamePrefix The beginning of the filename, without the level
 * @param {number} maxLevel The level maximum
 * @returns {string} The filename
 */
function filenameRandomLevel(filenamePrefix, maxLevel) {
  const level = Math.floor(1 + Math.random() * maxLevel);
  return `${filenamePrefix}${level}.sql`;
}

function generateQuestionOfType(type) {
  const typeInfos = typeGeneratorInfos[type];
  if (!typeInfos) {
    return null;
  }
  return () => {
    return new Promise((resolve, reject) => {
      const filename = typeInfos.createFilename();
      const before = typeInfos.before;
      queryQuestion(filename, type, before).then(resolve).catch(reject);
    });
  };
}

/**
 * Format a question from the SQL reponse data
 * @param {object[]} data The sql response data
 * @returns {string} The formatted question
 */
function formatQuestion(data) {
  const badAnswers = data.map((e) => e.bad_answer);
  const goodAnswer = data[0].good_answer;
  const randomIndex = Math.floor(Math.random() * 4);

  const answers = badAnswers.slice();
  answers.splice(randomIndex, 0, goodAnswer);

  return {
    subject: data[0].subject,
    goodAnswer: randomIndex,
    answers,
  };
}
