-- **************************************************************** 
--     TYPE C2  : Quelle molécule appartient au // systeme 2 // 
-- **************************************************************** 

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
        WHERE sy_level >= 2
        
        UNION ALL
        
        SELECT parent.sy_id,
            parent.sy_name,
            parent.sy_higher,
            parent.sy_level,
            c.mo_id,
            c.mo_dci
        FROM system parent INNER JOIN classification c 
        	ON parent.sy_id = c.sy_higher
        WHERE
        	parent.sy_level >= 2
    )
    SELECT  mo_id,
        mo_dci,
        sy_id,
        sy_name,
        sy_higher,
        sy_level
    FROM classification
    ORDER BY  mo_id, sy_level
);

-- // GET a random system of level 2, 
-- // for which there are at least 3 molecules not belonging to this system 
-- // but to the same parent system
SET @system2 = ( SELECT DISTINCT C1.sy_id
              	FROM systems_by_molecule AS C1
              	WHERE 2 < ( SELECT COUNT(*)
                            FROM systems_by_molecule AS C2
                            WHERE C1.sy_higher = C2.sy_higher
                           	AND C1.sy_id <> C2.sy_id )
              	ORDER BY RAND()
              	LIMIT 1 );
       

-- // Get a random molecule belonging to @system2
SET @good = ( SELECT mo_id
              FROM systems_by_molecule AS C
              WHERE C.sy_id = @system2
              ORDER BY RAND()
              LIMIT 1 );

-- // Get 3 random molecules, belonging to the parent system of @system2, but not to @system2
SELECT 	(SELECT mo_dci
         FROM molecule
         WHERE mo_id = @good) AS good_answer,
        (SELECT sy_name
         FROM system
         WHERE sy_id = @system2) AS subject,
         mo_dci AS bad_answer
FROM systems_by_molecule AS C
WHERE C.sy_id <> @system2
AND C.sy_higher = ( SELECT sy_higher
              		FROM system
              		WHERE sy_id = @system2 )
ORDER BY RAND()
LIMIT 3;

DROP TABLE systems_by_molecule;