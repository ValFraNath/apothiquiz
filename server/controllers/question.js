import fs from "fs/promises";
import path from "path";
import { queryPromise } from "../db/database.js";

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
  let generator;
  switch (type) {
    case 1: {
      generator = generateQuestionType1;
      break;
    }
    default: {
      generator = null;
    }
  }
  if (generator === null) {
    res.status(404).json({ message: "Incorrect type of question" });
    return;
  }

  generator()
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
 * Generate a question of type 1
 * @return {Promise<object>} The question
 */
async function generateQuestionType1() {
  return new Promise(function (resolve, reject) {
    fs.readFile(path.resolve(scriptsFolderPath, "question_A1.sql"), { encoding: "utf-8" }).then((script) => {
      queryPromise(script)
        .then((res) => {
          let question = null;
          try {
            const badAnswers = res[4].map((e) => e.bad_answers);
            const goodAnswer = res[4][0].good_answer;
            const randomIndex = Math.floor(Math.random() * 4);
            const answers = badAnswers.slice();
            answers.splice(randomIndex, 0, goodAnswer);
            question = {
              type: 1,
              subject: res[4][0].class,
              goodAnswer: randomIndex,
              answers,
            };
          } catch (e) {
            reject("bad mysql response format");
          }
          resolve(question);
        })
        .catch(reject);
    });
  });
}
