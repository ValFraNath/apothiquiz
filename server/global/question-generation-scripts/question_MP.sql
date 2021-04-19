-- ****************************************************************
--            TYPE 8-900 : 1 molecule - 4 property values
-- ****************************************************************

SET @idparent = ?;
SET @difficulty = ?;
CREATE TEMPORARY TABLE properties_by_molecule(
       mo_id int(11),
       mo_dci varchar(256),
       pv_id int(11),
       pv_name varchar(256)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_bin;

INSERT INTO properties_by_molecule
SELECT mo_id, mo_dci, pv_id, pv_name 
FROM molecule_property NATURAL JOIN property_value 
JOIN property ON pr_id = pv_property NATURAL JOIN molecule m JOIN system ON sy_id = m.mo_system
WHERE pr_name = @property AND (@idparent = sy_higher OR sy_id = @idparent OR @idparent = 0) AND (m.mo_difficulty = @difficulty OR @difficulty = "ALL")
ORDER BY RAND();

-- Get a random molecule for which there are at least 3 property values ​​that it does not have
SET @molecule = (SELECT mo_id
                 FROM properties_by_molecule AS P1
                 WHERE 3 <= (SELECT COUNT(DISTINCT pv_id)
                           FROM properties_by_molecule AS P2
                           WHERE NOT EXISTS (SELECT *
                                           FROM properties_by_molecule AS P3
                                           WHERE P3.mo_id = P1.mo_id
                                           AND P3.pv_id = P2.pv_id
                                          )
                          )
                 
                 LIMIT 1);

-- Get a random property value among these of @molecule                 
SET @good = (SELECT pv_id
             FROM properties_by_molecule
             WHERE mo_id = @molecule
             ORDER BY RAND()
             LIMIT 1);                 

-- - Get 3 random property values ​​that @molecule doesn't have                 
SELECT DISTINCT (SELECT mo_dci
                 FROM molecule
                 WHERE mo_id = @molecule) AS subject,
                (SELECT pv_name
                 FROM property_value
                 WHERE pv_id = @good) AS good_answer,
                 pv_name AS bad_answer
FROM properties_by_molecule AS P1
WHERE NOT EXISTS (SELECT *
                FROM properties_by_molecule AS P2
                WHERE P1.pv_id = P2.pv_id
                AND P2.mo_id = @molecule) 
ORDER BY RAND()
LIMIT 3;                


DROP TABLE properties_by_molecule;
