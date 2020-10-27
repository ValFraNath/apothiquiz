import { queryPromise } from "../db/database.js";

/**
 * Generate a question of type <type>
 * @param req {object} The http request object
 * @param res {object} The http response object
 * @return {Promise<object|null>} The question object or null if an error has occured
 * ```
 * {
 *     type : number,
 *     subject : string
 *     goodAnswer : string,
 *     badAnswer : Array<string>
 * }
 */
export async function generateQuestion(req, res) {
  let type = Number(req.params.type);
  let func;
  switch (type) {
    case 1: {
      func = generateQuestionType1;
      break;
    }
    default: {
      func = null;
    }
  }
  if (func === null) {
    res.status(404).json({ error: "Incorrect type of question" });
    return;
  }

  func()
    .then((question) => {
      res.status(200).json({ question });
    })
    .catch((error) => {
      res.status(400).json({
        error: `Error while generating question of type ${type} : ${error}`,
      });
    });
}

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
