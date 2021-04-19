-- ************************************************************************
--                  TYPE 2 : 1 molecule - 4 classes 
-- ************************************************************************

SET @idparent = ?;
SET @difficulty = ?;
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
        	ON mo_class = cl_id JOIN system ON mo_system = sy_id
        WHERE (@idparent = sy_higher OR sy_id = @idparent OR @idparent = 0)  AND (mo_difficulty = @difficulty OR @difficulty = "ALL")
        
        
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
    ORDER BY  mo_id, cl_level
);

-- Get a random class which have at least 3 siblings
SET @class = ( SELECT cl_id
                FROM classes_by_molecule AS C1
                WHERE 3 < (	SELECT COUNT(DISTINCT cl_id)
                            FROM classes_by_molecule AS C2
                            WHERE (C1.cl_higher = C2.cl_higher 
                                   OR (C1.cl_higher IS NULL AND C2.cl_higher IS NULL))
                           	AND C1.cl_id <> C2.cl_id
                           	)
                ORDER BY RAND()
                LIMIT 1 );

-- Get a random molecule belonging to @class
SET @molecule = (SELECT mo_id
                 FROM classes_by_molecule
                 WHERE cl_id = @class
                 ORDER BY RAND()
                 LIMIT 1);    

-- Get the level of @class                 
SET @level = (SELECT cl_level
              FROM class
              WHERE cl_id = @class);

-- Get 3 random classes among @class siblings 
SELECT DISTINCT (SELECT mo_dci
        FROM molecule 
        WHERE mo_id = @molecule) as subject,
        (SELECT cl_name 
         FROM class
         WHERE cl_id = @class) AS good_answer,
         cl_name AS bad_answer
FROM classes_by_molecule AS C
WHERE cl_id <> @class
AND ((@level > 1 AND C.cl_higher = (SELECT cl_higher
                                   	FROM class
                                   	WHERE cl_id = @class))
OR (@level = 1 AND C.cl_level = 1))
ORDER BY RAND()
LIMIT 3;

DROP TABLE classes_by_molecule;
