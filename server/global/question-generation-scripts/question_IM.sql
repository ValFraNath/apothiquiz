-- **************************************************************** 
--                  TYPE 11  : 1 image - 4 molecules 
-- **************************************************************** 

SET @good = (SELECT mo_id
             FROM molecule
             WHERE mo_image IS NOT NULL
             ORDER BY RAND()
             LIMIT 1);
             
SELECT (SELECT mo_dci 
       FROM molecule
       WHERE mo_id = @good) AS good_answer,
       (SELECT mo_image
        FROM molecule
        WHERE mo_id = @good) AS subject,
        mo_dci AS bad_answer
FROM molecule 
WHERE mo_id <> @good
ORDER BY RAND()
LIMIT 3;