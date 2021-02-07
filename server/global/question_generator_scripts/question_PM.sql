-- ****************************************************************
--      TYPE 5-6-7 : 1 property values - 4 molecules
-- ****************************************************************
-- SET @property = "indications";

CREATE TEMPORARY TABLE properties_by_molecule(
       mo_id int(11),
       mo_dci varchar(256),
       pv_id int(11),
       pv_name varchar(256)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_bin;

INSERT INTO properties_by_molecule
SELECT mo_id, mo_dci, pv_id, pv_name 
FROM molecule_property NATURAL JOIN property_value 
JOIN property ON pr_id = pv_property NATURAL JOIN molecule
WHERE pr_name = @property
ORDER BY RAND();

SET @value = (SELECT pv_id
              FROM properties_by_molecule AS P1
              WHERE 3 <= (SELECT COUNT(DISTINCT mo_id)
                          FROM properties_by_molecule AS P2
                          WHERE mo_id NOT IN (SELECT mo_id
                                            FROM properties_by_molecule AS P3
                                            WHERE P3.mo_id = P2.mo_id
                                            AND P3.pv_id = P1.pv_id
                                           )
                         )
              
              LIMIT 1);
                 
SET @good = (SELECT mo_id
             FROM properties_by_molecule
             WHERE pv_id = @value
             ORDER BY RAND()
             LIMIT 1);                 
                 
SELECT DISTINCT	(SELECT pv_name
                 FROM property_value
                 WHERE pv_id = @value) AS subject,
                (SELECT mo_dci
                 FROM molecule
                 WHERE mo_id = @good) AS good_answer,
                 mo_dci AS bad_answer
FROM properties_by_molecule AS P1
WHERE NOT EXISTS (SELECT *
                FROM properties_by_molecule AS P2
                WHERE P1.mo_id = P2.mo_id
                AND P2.pv_id = @value) 
ORDER BY RAND()
LIMIT 3;                

DROP TABLE properties_by_molecule;


