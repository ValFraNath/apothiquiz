-- **************************************************************** 
--                  TYPE 12  : 1 molécule - 4 images 
-- **************************************************************** 

SET @good = (SELECT mo_id
             FROM molecule
             WHERE mo_image IS NOT NULL
             ORDER BY RAND()
             LIMIT 1);
             
SELECT (SELECT mo_image 
       FROM molecule
       WHERE mo_id = @good) AS good_answer,
       (SELECT mo_dci
        FROM molecule
        WHERE mo_id = @good) AS subject,
        mo_image AS bad_answers
FROM molecule    
WHERE mo_image IS NOT NULL
AND mo_id <> @good
LIMIT 3
        