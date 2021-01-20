-- ****************************************************************
--      TYPE A1 : Quelle molécule appartient à la // classe 1 //
-- ****************************************************************

-- // create a temp table to store the level 1 class of each molecule 
CREATE TEMPORARY TABLE classes_by_molecule(
       mo_id int(11),
       mo_dci varchar(256),
       cl_id int(11),
       cl_name varchar(256),
       cl_higher int(11),
       cl_level int(11)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

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
        SELECT mo_id,
            mo_dci,
            cl_id,
            cl_name,
            cl_higher,
            cl_level
        FROM classification
        WHERE cl_level = 1
        ORDER BY mo_id, cl_level
);

-- // Get a random class of level 1. 3 molecules which not belong to this class must exist
SET @class1 = (SELECT C1.cl_id
                FROM classes_by_molecule AS C1
                WHERE 3 <= (SELECT COUNT(DISTINCT mo_id)
                            FROM classes_by_molecule AS C2
                            WHERE C2.cl_id <> C1.cl_id)
                ORDER BY RAND()
                LIMIT 1);
                
-- // Get a random molecule belonging to @class1  
SET @good = (SELECT mo_id
             FROM classes_by_molecule
             WHERE cl_id = @class1
             ORDER BY RAND()
             LIMIT 1);

-- // Get 3 random molecule belonging to an other class 1 than @class1
SELECT (SELECT mo_dci 
        FROM molecule 
        WHERE mo_id = @good) AS good_answer,
        (SELECT cl_name
         FROM class
         WHERE cl_id = @class1) AS class,
         mo_dci as bad_answers
FROM classes_by_molecule
WHERE cl_id <> @class1
ORDER BY RAND()
LIMIT 3

         
        
             
             