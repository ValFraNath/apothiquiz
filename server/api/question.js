import { queryPromise } from "../db/database.js";

export async function generateQuestion(type) {
  switch (type) {
    case 1: {
      return await generateQuestionType1();
    }
  }
}

async function generateQuestionType1() {
  let script = `SET @id = (SELECT cl_id 
                      FROM class
                      ORDER BY RAND() 
                      LIMIT 1);
                    
                          
                    SELECT cl_name, cl_id
                        FROM class
                        WHERE cl_id = @id;
                                             
                    SELECT mo_id, mo_dci
                        FROM molecule NATURAL JOIN molecule_class
                        WHERE cl_id <> @id
                        ORDER BY RAND()
                        LIMIT 3 ;
                        
                    SELECT mo_id, mo_dci
                        FROM molecule NATURAL JOIN molecule_class
                        WHERE cl_id = @id
                        ORDER BY RAND()
                        LIMIT 1;`;

  queryPromise(script)
    .then((res) => {
      console.table(res[1]);
      console.table(res[2]);
      console.table(res[3]);
    })
    .catch((error) => {
      throw error;
    });
}
