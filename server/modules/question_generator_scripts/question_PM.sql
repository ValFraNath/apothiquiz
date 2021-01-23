-- ****************************************************************
--      TYPE 5 : Quelle molécule a la propriété // {propriété} //
-- ****************************************************************

-- SET @property = "indications";

SET @molecule = ( SELECT mo_id
                  FROM molecule  NATURAL JOIN molecule_property  
                  NATURAL JOIN property_value 
                  JOIN property ON pv_property = pr_id
                  WHERE pr_name = @property
                  ORDER BY RAND()
                  LIMIT 1);
                 
SET @value = (SELECT pv_id
              FROM property JOIN property_value ON pv_property = pr_id 
              NATURAL JOIN molecule_property 
              WHERE mo_id = @molecule
              AND pr_name = @property
              ORDER BY RAND()
              LIMIT 1);

 SELECT DISTINCT (SELECT mo_dci 
         FROM molecule
         WHERE mo_id = @molecule) AS good_answer,
         (SELECT pv_name 
          FROM property_value
          WHERE pv_id = @value) AS subject,
          mo_dci AS bad_answer
FROM molecule NATURAL JOIN molecule_property
WHERE NOT EXISTS (SELECT * 
                  FROM molecule_property
                  WHERE mo_id = molecule.mo_id
                  AND pv_id = @value)
ORDER BY RAND()
LIMIT 3

		
                              					
 

                 
                  