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
    .then((question) => {
      res.status(200).json({ question });
    })
    .catch((error) => {
      res.status(400).json({
        message: `Error while generating question of type ${type} : ${error}`,
      });
    });
}

export default { generateQuestion };

// ***** Internal functions *****

/**
 * Generate a question of type 1
 * @return {Promise<object>} The question
 */
async function generateQuestionType1() {
  let script = `SET @id = (SELECT cl_id 
                      FROM class
                      ORDER BY RAND() 
                      LIMIT 1);
                    
                      SELECT cl_name
                        FROM class
                        WHERE cl_id = @id;    
                    
                                             
                    SELECT  mo_dci
                        FROM molecule NATURAL JOIN molecule_class
                        WHERE cl_id <> @id
                        ORDER BY RAND()
                        LIMIT 3 ;
                        
                    SELECT  mo_dci
                        FROM molecule NATURAL JOIN molecule_class
                        WHERE cl_id = @id
                        ORDER BY RAND()
                        LIMIT 1;`;

  return new Promise(function (resolve, reject) {
    queryPromise(script)
      .catch((error) => {
        reject(error);
      })
      .then((res) => {
        let question = null;
        try {
          question = {
            type: 1,
            subject: res[1][0].cl_name,
            goodAnswer: res[3][0].mo_dci,
            badAnswers: res[2].map((e) => e.mo_dci),
          };
        } catch (e) {
          reject("bad mysql response format");
        }
        resolve(question);
      });
  });
}
