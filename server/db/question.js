import { querySync } from "./database.js";

export async function generateQuestionType1() {
  let script = `SET @id = (
      SELECT cl_id 
      FROM class
      ORDER BY RAND() 
      LIMIT 1);

    SELECT * FROM molecule;
        
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

  await querySync(script)
    .then((res) => {
      console.log(res);
    })
    .catch((error) => {
      throw error;
    });
}
