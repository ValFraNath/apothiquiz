import fs from "fs/promises";
import path from "path";

import { queryPromise } from "../db/database.js";
import { logError } from "../global/ErrorLogger.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";

const generatorInfosByType = {
  1: {
    createFilename: () => filenameRandomLevel("question_CM", 2),
    before: "",
    createWording: (subject) => `Quelle molécule appartient à la classe '${subject}' ?`,
    title: "1 classe - 4 molécules",
  },
  2: {
    createFilename: () => filenameRandomLevel("question_MC", 2),
    before: "",
    createWording: (subject) => `À quelle classe appartient la molécule '${subject}' ?`,
    title: "1 molecule - 4 classes",
  },
  3: {
    createFilename: () => filenameRandomLevel("question_SM", 2),
    before: "",
    createWording: (subject) => `Quelle molécule appartient au système '${subject}' ?`,
    title: "1 système - 4 molécules",
  },
  4: {
    createFilename: () => filenameRandomLevel("question_MS", 2),
    before: "",
    createWording: (subject) => `À quel système appartient la molécule '${subject}' ?`,
    title: "1 molecule - 4 systèmes",
  },
  5: {
    createFilename: () => "question_PM.sql",
    before: "SET @property = 'indications';",
    createWording: (subject) => `Quelle molécule a comme indication '${subject}' ?`,
    title: "1 indication - 4 molecules",
  },
  6: {
    createFilename: () => "question_PM.sql",
    before: "SET @property = 'side_effects';",
    createWording: (subject) => `Quelle molécule a comme effet indésirable '${subject}' ?`,
    title: "1 effet indésirable - 4 molecules",
  },
  7: {
    createFilename: () => "question_PM.sql",
    before: "SET @property = 'interactions';",
    createWording: (subject) => `Quelle molécule a comme intéraction '${subject}' ?`,
    title: "1 intéraction - 4 molecules",
  },
  8: {
    createFilename: () => "question_MP.sql",
    before: "SET @property = 'indications';",
    createWording: (subject) => `Quelle indication a la molécule '${subject}' ?`,
    title: "1 molécule - 4 indications",
  },
  9: {
    createFilename: () => "question_MP.sql",
    before: "SET @property = 'side_effects';",
    createWording: (subject) => `Quel effet indésirable a la molécule '${subject}' ?`,
    title: "1 molécule - 4 effets indésirables",
  },
  10: {
    createFilename: () => "question_MP.sql",
    before: "SET @property = 'interactions';",
    createWording: (subject) => `Quelle intéraction a la molécule '${subject}' ?`,
    title: "1 molécule - 4 intéractions",
  },
};

/**
 * @apiDefine NotEnoughDataError
 * @apiError  (422) NotEnoughData There is not enough data to generate questions
 */

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
 * @apiSuccess (200) {Number}         question.goodAnswer The good answer index
 * @apiSuccess (200) {Array[String]}  question.answers    All answers possible
 * @apiSuccess (200) {String}         question.wording    The question wording
 *
 * @apiUse     NotEnoughDataError
 * @apiError   (404) NotFound Incorrect type of question
 * @apiUse     ErrorBadRequest
 */
async function generateQuestion(req, _res) {
  const res = new HttpResponseWrapper(_res);
  const type = Number(req.params.type);
  const generateQuestion = createGeneratorOfType(type);

  if (!generateQuestion) {
    res.sendUsageError(404, "Incorrect type of question");
    return;
  }

  generateQuestion()
    .then(({ type, title, subject, goodAnswer, answers, wording }) => {
      res.sendResponse(200, { type, title, subject, goodAnswer, answers, wording });
    })
    .catch((error) => {
      if (NotEnoughDataError.isInstance(error)) {
        res.sendUsageError(422, "Not enough data to generate this type of question", error.code);
        return;
      }
      res.sendServerError();
    });
}

export default { generateQuestion };

// ***** Internal functions *****

const scriptsFolderPath = path.resolve("global", "question_generator_scripts");

/**
 * Create a question by requesting database with a given script
 * @param {string} filename The script filename
 * @param {number} type The question type
 * @param {string} before An SQL script to add at the start of the script
 * @return {Promise<object>} The question
 */
async function queryQuestion(filename, type, before = "") {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(scriptsFolderPath, filename), { encoding: "utf-8" })
      .then((script) => {
        queryPromise(before + script)
          .then((res) => {
            const data = res.find((e) => e instanceof Array);

            if (data.length < 3) {
              return reject(new NotEnoughDataError());
            }
            const formattedQuestion = formatQuestion(data);
            if (formattedQuestion.answers.includes(null)) {
              return reject(new NotEnoughDataError());
            }
            resolve(Object.assign(formattedQuestion, { type }));
          })
          .catch((error) => {
            if (!NotEnoughDataError.isInstance(error)) {
              logError(error, "Can't generate question");
              return reject();
            }
            reject(error);
          });
      })
      .catch((error) => {
        if (!NotEnoughDataError.isInstance(error)) {
          logError(error, `Can't read the script ${filename}`);
          return reject();
        }
        reject(error);
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

/**
 * Create a function generator to a given type
 * @param {number} type The question type
 * @returns {function():Promise}
 */
export function createGeneratorOfType(type) {
  const typeInfos = generatorInfosByType[type];
  if (!typeInfos) {
    return null;
  }

  return function () {
    return new Promise((resolve, reject) => {
      const filename = typeInfos.createFilename();
      const before = typeInfos.before;

      queryQuestion(filename, type, before)
        .then((question) =>
          resolve(
            Object.assign(question, { wording: typeInfos.createWording(question.subject), title: typeInfos.title })
          )
        )
        .catch((error) => {
          if (!NotEnoughDataError.isInstance(error)) {
            logError(error, "Can't create the question");
            return reject();
          }
          reject(error);
        });
    });
  };
}

/**
 * Format a question from the SQL reponse data
 * @param {object[]} data The sql response data
 * @returns {{subject : string, goodAnswer : number, answers : string[]}} The formatted question
 */
function formatQuestion(data) {
  const badAnswers = data.map((e) => e.bad_answer);
  const goodAnswer = data[0].good_answer;
  const randomIndex = Math.floor(Math.random() * data.length + 1);

  const answers = badAnswers.slice();
  answers.splice(randomIndex, 0, goodAnswer);

  return {
    subject: data[0].subject,
    goodAnswer: randomIndex,
    answers,
  };
}

export class NotEnoughDataError extends Error {
  constructor() {
    super();
    this.name = "Not Enough Data";
    this.code = "NED";
  }

  static isInstance(error) {
    return error instanceof NotEnoughDataError;
  }
}
