-- **************************************************************** 
--                  TYPE 11  : 1 image - 4 molecules 
-- **************************************************************** 
SET @idparent = ?;
SET @difficulty = ?;
SET @good = (SELECT mo_id
             FROM molecule INNER JOIN system ON sy_id = mo_system
             WHERE mo_image IS NOT NULL AND (@idparent = sy_higher OR sy_id = @idparent OR @idparent is null)  AND (mo_difficulty = @difficulty OR @difficulty = "ALL")
             ORDER BY RAND()
             LIMIT 1);
             
SELECT (SELECT mo_dci 
       FROM molecule
       WHERE mo_id = @good) AS good_answer,
       (SELECT mo_image
        FROM molecule
        WHERE mo_id = @good) AS subject,
        mo_dci AS bad_answer
FROM molecule INNER JOIN system ON sy_id = mo_system
WHERE mo_id <> @good AND (@idparent = sy_higher OR sy_id = @idparent OR @idparent is null)  AND (mo_difficulty = @difficulty OR @difficulty = "ALL")
ORDER BY RAND()
LIMIT 3;
