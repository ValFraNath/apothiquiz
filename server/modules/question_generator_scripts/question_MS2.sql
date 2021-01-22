-- ************************************************************************
--    TYPE D2 : A quelle // systeme 2 // appartient la molecule // DCI // 
-- ************************************************************************

-- // create a temp table to store the level 2 system of each molecule 
CREATE TEMPORARY TABLE systems_by_molecule(
       mo_id int(11),
       mo_dci varchar(256),
       sy_id int(11),
       sy_name varchar(256),
       sy_higher int(11),
       sy_level int(11)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_bin;

INSERT INTO systems_by_molecule(
    WITH RECURSIVE classification AS(
        SELECT sy_id,
            sy_name,
            sy_higher,
            sy_level,
            molecule.mo_id,
            molecule.mo_dci
        FROM system JOIN molecule 
        	ON mo_system = sy_id
        
        
        UNION ALL
        
        SELECT parent.sy_id,
            parent.sy_name,
            parent.sy_higher,
            parent.sy_level,
            c.mo_id,
            c.mo_dci
        FROM system parent INNER JOIN classification c 
        	ON parent.sy_id = c.sy_higher
        
    )
    SELECT  mo_id,
        mo_dci,
        sy_id,
        sy_name,
        sy_higher,
        sy_level
    FROM classification
    WHERE sy_level <= 2
    ORDER BY  mo_id, sy_level
);



-- // Get a random system 1 which have at least 4 child
SET @system1 = ( SELECT sy_id
                FROM systems_by_molecule AS C1
                WHERE 3 < (	SELECT COUNT(DISTINCT sy_id)
                            FROM systems_by_molecule AS C2
                            WHERE C1.sy_id = C2.sy_higher 
                           	AND C2.sy_level = 2
                          )
               	AND C1.sy_level = 1
                ORDER BY RAND()
                LIMIT 1 );
                           

-- // Get a random system 2, child of @system1
SET @good = (SELECT sy_id
               FROM systems_by_molecule
               WHERE sy_higher = @system1
               AND sy_level = 2
               ORDER BY RAND()
               LIMIT 1);

-- // Get a molecule belonging to @good
SET @molecule = (SELECT mo_id
                 FROM systems_by_molecule
                 WHERE sy_id = @good
                 ORDER BY RAND()
                 LIMIT 1);

-- // Get 3 systems different than @class2, but belonging to @system1                 
SELECT DISTINCT (SELECT mo_dci
        FROM molecule 
        WHERE mo_id = @molecule) as subject,
        (SELECT sy_name 
         FROM system
         WHERE sy_id = @good) AS good_answer,
         sy_name AS bad_answer
FROM systems_by_molecule
WHERE sy_higher = @system1
AND sy_id <> @good
ORDER BY RAND()
LIMIT 3;

DROP TABLE systems_by_molecule;
          