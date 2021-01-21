-- ************************************************************************
--    TYPE B2 : A quelle // classe 2 // appartient la molecule // DCI // 
-- ************************************************************************

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
        
        
        UNION ALL
        
        SELECT parent.cl_id,
            parent.cl_name,
            parent.cl_higher,
            parent.cl_level,
            c.mo_id,
            c.mo_dci
        FROM class parent INNER JOIN classification c 
        	ON parent.cl_id = c.cl_higher
        
    )
    SELECT  mo_id,
        mo_dci,
        cl_id,
        cl_name,
        cl_higher,
        cl_level
    FROM classification
    WHERE cl_level <= 2
    ORDER BY  mo_id, cl_level
);

-- // Get a random class 1 which have at least 4 child
SET @class1 = ( SELECT cl_id
                FROM classes_by_molecule AS C1
                WHERE 3 < (	SELECT COUNT(DISTINCT cl_id)
                            FROM classes_by_molecule AS C2
                            WHERE C1.cl_id = C2.cl_higher 
                           	AND C2.cl_level = 2
                          )
               	AND C1.cl_level = 1
                ORDER BY RAND()
                LIMIT 1 );

-- // Get a random class 2, child of @class1
SET @good = (SELECT cl_id
               FROM classes_by_molecule
               WHERE cl_higher = @class1
               AND cl_level = 2
               ORDER BY RAND()
               LIMIT 1);

-- // Get a molecule belonging to @class2
SET @molecule = (SELECT mo_id
                 FROM classes_by_molecule
                 WHERE cl_id = @good
                 ORDER BY RAND()
                 LIMIT 1);

-- // Get 3 classes different than @class2, but belonging to @class1                 
SELECT (SELECT mo_dci
        FROM molecule 
        WHERE mo_id = @molecule) as subject,
        (SELECT cl_name 
         FROM class
         WHERE cl_id = @good) AS good_answer,
         cl_name AS bad_answer
FROM classes_by_molecule
WHERE cl_higher = @class1
AND cl_id <> @good
ORDER BY RAND()
LIMIT 3
          