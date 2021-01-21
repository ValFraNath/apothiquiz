-- **************************************************************** 
--     TYPE A2  : Quelle molécule appartient à la // classe 2 // 
-- **************************************************************** 

-- // create a temp table to store the level 2 class of each molecule 
CREATE TEMPORARY TABLE classes_by_molecule(
       mo_id int(11),
       mo_dci varchar(256),
       cl_id int(11),
       cl_name varchar(256),
       cl_higher int(11),
       cl_level int(11)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_bin;

INSERT INTO classes_by_molecule(
    WITH RECURSIVE classification AS(
        SELECT cl_id,
            cl_name,
            cl_higher,
            cl_level,
            molecule.mo_id,
            molecule.mo_dci
        FROM class JOIN molecule 
        	ON mo_class = cl_id
        WHERE cl_level >= 2
        
        UNION ALL
        
        SELECT parent.cl_id,
            parent.cl_name,
            parent.cl_higher,
            parent.cl_level,
            c.mo_id,
            c.mo_dci
        FROM class parent INNER JOIN classification c 
        	ON parent.cl_id = c.cl_higher
        WHERE
        	parent.cl_level >= 2
    )
    SELECT  mo_id,
        mo_dci,
        cl_id,
        cl_name,
        cl_higher,
        cl_level
    FROM classification
    ORDER BY  mo_id, cl_level
);

-- // GET a random class of level 2, 
-- // for which there are at least 3 molecules not belonging to this class 
-- // but to the same parent class
SET @class2 = ( SELECT DISTINCT C1.cl_id
              	FROM classes_by_molecule AS C1
              	WHERE 2 < ( SELECT COUNT(*)
                            FROM classes_by_molecule AS C2
                            WHERE C1.cl_higher = C2.cl_higher
                           	AND C1.cl_id <> C2.cl_id )
              	ORDER BY RAND()
              	LIMIT 1 );
       

-- // Get a random molecule belonging to @class2
SET @good = ( SELECT mo_id
              FROM classes_by_molecule AS C
              WHERE C.cl_id = @class2
              ORDER BY RAND()
              LIMIT 1 );

-- // Get 3 random molecules, belonging to the parent class of @class2, but not to @class2
SELECT 	(SELECT mo_dci
         FROM molecule
         WHERE mo_id = @good) AS good_answer,
        (SELECT cl_name
         FROM class
         WHERE cl_id = @class2) AS subject,
         mo_dci AS bad_answer
FROM classes_by_molecule AS C
WHERE C.cl_id <> @class2
AND C.cl_higher = ( SELECT cl_higher
              		FROM class
              		WHERE cl_id = @class2 )
ORDER BY RAND()
LIMIT 3;

DROP TABLE classes_by_molecule;