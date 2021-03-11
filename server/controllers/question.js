import fs from "fs/promises";
import path from "path";

// eslint-disable-next-line no-unused-vars
import express from "express";

import { fetchConfigFromDB } from "../controllers/config.js";
import { queryPromise } from "../db/database.js";
// eslint-disable-next-line no-unused-vars
import { HttpResponseWrapper } from "../global/HttpControllerWrapper.js";

const generatorInfosByType = {
  1: {
    filename: "question_CM.sql",
    before: "",
    createWording: (subject) => `Quelle molécule appartient à la classe '${subject}' ?`,
    title: "1 classe - 4 molécules",
  },
  2: {
    filename: "question_MC.sql",
    before: "",
    createWording: (subject) => `À quelle classe appartient la molécule '${subject}' ?`,
    title: "1 molecule - 4 classes",
  },
  3: {
    filename: "question_SM.sql",
    before: "",
    createWording: (subject) => `Quelle molécule appartient au système '${subject}' ?`,
    title: "1 système - 4 molécules",
  },
  4: {
    filename: "question_MS.sql",
    before: "",
    createWording: (subject) => `À quel système appartient la molécule '${subject}' ?`,
    title: "1 molecule - 4 systèmes",
  },
  5: {
    filename: "question_PM.sql",
    before: "SET @property = 'indications';",
    createWording: (subject) => `Quelle molécule a comme indication '${subject}' ?`,
    title: "1 indication - 4 molecules",
  },
  6: {
    filename: "question_PM.sql",
    before: "SET @property = 'sideEffects';",
    createWording: (subject) => `Quelle molécule a comme effet indésirable '${subject}' ?`,
    title: "1 effet indésirable - 4 molecules",
  },
  7: {
    filename: "question_PM.sql",
    before: "SET @property = 'interactions';",
    createWording: (subject) => `Quelle molécule a comme intéraction '${subject}' ?`,
    title: "1 intéraction - 4 molecules",
  },
  8: {
    filename: "question_MP.sql",
    before: "SET @property = 'indications';",
    createWording: (subject) => `Quelle indication a la molécule '${subject}' ?`,
    title: "1 molécule - 4 indications",
  },
  9: {
    filename: "question_MP.sql",
    before: "SET @property = 'sideEffects';",
    createWording: (subject) => `Quel effet indésirable a la molécule '${subject}' ?`,
    title: "1 molécule - 4 effets indésirables",
  },
  10: {
    filename: "question_MP.sql",
    before: "SET @property = 'interactions';",
    createWording: (subject) => `Quelle intéraction a la molécule '${subject}' ?`,
    title: "1 molécule - 4 intéractions",
  },
  11: {
    filename: "question_IM.sql",
    before: "",
    createWording: (subject) => `Quelle molécule a la structure chimique '${subject}' ?`,
    title: "1 structure chimique - 4 molécules",
  },
  12: {
    filename: "question_MI.sql",
    before: "",
    createWording: (subject) => `Quelle molécule a la structure chimique '${subject}' ?`,
    title: "1 molécules - 4 structure chimique",
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
 *
 * @param {express.Request} req The http request
 * @param {HttpResponseWrapper} res The http response
 */
async function generateQuestion(req, res) {
  const type = Number(req.params.type);
  const generateQuestion = createGeneratorOfType(type);

  if (!generateQuestion) {
    res.sendUsageError(404, "Incorrect type of question");
    return;
  }
  const config = await fetchConfigFromDB();

  try {
    const { type, title, subject, goodAnswer, answers, wording } = await generateQuestion();

    res.sendResponse(200, {
      type,
      title,
      subject,
      goodAnswer,
      answers,
      wording,
      timerDuration: config.questionTimerDuration,
    });
  } catch (error) {
    if (NotEnoughDataError.isInstance(error)) {
      res.sendUsageError(422, "Not enough data to generate this type of question", {
        code: error.code,
      });
      return;
    }
    throw error;
  }
}

export default { generateQuestion };

/**
 * Get all questions types
 * @returns {number[]}
 */
export const getAllQuestionTypes = () => Object.keys(generatorInfosByType).map(Number);

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
  const script = await fs.readFile(path.resolve(scriptsFolderPath, filename), {
    encoding: "utf-8",
  });
  const res = await queryPromise(before + script);

  const data = res.find((e) => e instanceof Array);

  if (data.length < 3) {
    throw new NotEnoughDataError();
  }

  const formattedQuestion = formatQuestion(data);
  if (formattedQuestion.answers.includes(null)) {
    throw new NotEnoughDataError();
  }
  return Object.assign(formattedQuestion, { type });
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

  return async () => {
    const { before, filename } = typeInfos;
    const question = await queryQuestion(filename, type, before);

    return Object.assign(question, {
      wording: typeInfos.createWording(question.subject),
      title: typeInfos.title,
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

  const randomIndex = Math.floor(Math.random() * (data.length + 1));
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
