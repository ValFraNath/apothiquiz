import fs from "fs/promises";
import path from "path";
import { queryPromise } from "../db/database.js";

const generatorInfosByType = {
  1: {
    createFilename: () => filenameRandomLevel("question_CM", 2),
    before: "",
    createWording: (subject) => `Quelle molécule appartient à la classe '${subject}' ?`,
  },
  2: {
    createFilename: () => filenameRandomLevel("question_MC", 2),
    before: "",
    createWording: (subject) => `À quelle classe appartient la molécule '${subject}' ?`,
  },
  3: {
    createFilename: () => filenameRandomLevel("question_SM", 2),
    before: "",
    createWording: (subject) => `Quelle molécule appartient au système '${subject}' ?`,
  },
  4: {
    createFilename: () => filenameRandomLevel("question_MS", 2),
    before: "",
    createWording: (subject) => `À quel système appartient la molécule '${subject}' ?`,
  },
  5: {
    createFilename: () => "question_PM.sql",
    before: "SET @property = 'indications';",
    createWording: (subject) => `Quelle molécule a comme indication '${subject}' ?`,
  },
  6: {
    createFilename: () => "question_PM.sql",
    before: "SET @property = 'side_effects';",
    createWording: (subject) => `Quelle molécule a comme effet indésirable '${subject}' ?`,
  },
  7: {
    createFilename: () => "question_PM.sql",
    before: "SET @property = 'interactions';",
    createWording: (subject) => `Quelle molécule a comme intéraction '${subject}' ?`,
  },
  8: {
    createFilename: () => "question_MP.sql",
    before: "SET @property = 'indications';",
    createWording: (subject) => `Quelle indication a la molécule '${subject}' ?`,
  },
  9: {
    createFilename: () => "question_MP.sql",
    before: "SET @property = 'side_effects';",
    createWording: (subject) => `Quel effet indésirable a la molécule '${subject}' ?`,
  },
  10: {
    createFilename: () => "question_MP.sql",
    before: "SET @property = 'interactions';",
    createWording: (subject) => `Quelle intéraction a la molécule '${subject}' ?`,
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
 * @apiSuccess (200) {Number}         question.goodAnswer The good answer index
 * @apiSuccess (200) {Array[String]}  question.answers    All answers possible
 * @apiSuccess (200) {String}         question.wording    The question wording
 *
 * @apiError   (422) NotEnoughData  There is not enough data to generate the question
 * @apiError   (404) NotFound Incorrect type of question
 * @apiUse     ErrorBadRequest
 */
async function generateQuestion(req, res) {
  let type = Number(req.params.type);
  let generateQuestion = createGeneratorOfType(type);

  if (!generateQuestion) {
    res.status(404).json({ message: "Incorrect type of question" });
    return;
  }

  generateQuestion()
    .then(({ type, subject, goodAnswer, answers, wording }) => {
      res.status(200).json({ type, subject, goodAnswer, answers, wording });
    })
    .catch((error) => {
      if (NotEnoughDataError.isInstance(error)) {
        res.status(422).json({ message: error.message, code: error.code });
        return;
      }
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
 * @param {number} type The question type
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
            reject(new NotEnoughDataError());
          }
          const formattedQuestion = formatQuestion(data);
          if (formattedQuestion.answers.includes(null)) {
            reject(new NotEnoughDataError());
          }
          resolve(Object.assign(formattedQuestion, { type }));
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

/**
 * Create a function generator to a given type
 * @param {number} type The question type
 * @returns {function():Promise}
 */
function createGeneratorOfType(type) {
  const typeInfos = generatorInfosByType[type];
  if (!typeInfos) {
    return null;
  }

  return function () {
    return new Promise((resolve, reject) => {
      const filename = typeInfos.createFilename();
      const before = typeInfos.before;
      queryQuestion(filename, type, before)
        .then((question) => resolve(Object.assign(question, { wording: typeInfos.createWording(question.subject) })))
        .catch(reject);
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
  const randomIndex = Math.floor(Math.random() * data.length);

  const answers = badAnswers.slice();
  answers.splice(randomIndex, 0, goodAnswer);

  return {
    subject: data[0].subject,
    goodAnswer: randomIndex,
    answers,
  };
}

class NotEnoughDataError extends Error {
  constructor() {
    super();
    this.message = "This type of question is currently not available";
    this.name = "Not Enough Data";
    this.code = "NED";
  }

  static isInstance(error) {
    return error instanceof NotEnoughDataError;
  }
}
