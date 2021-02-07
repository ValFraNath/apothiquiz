-- ****************************************************************
--      TYPE 8-9-10 : 1 molecule - 4 property values
-- ****************************************************************


SET @molecule = (SELECT mo_id
                 FROM properties_by_molecule AS P1
                 WHERE P1.pr_name = @property
                 AND 3 <= (SELECT COUNT(DISTINCT pv_id)
                           FROM properties_by_molecule AS P2
                           WHERE P2.pr_name = @property
                           AND NOT EXISTS (SELECT *
                                           FROM properties_by_molecule AS P3
                                           WHERE P3.pr_name = @property
                                           AND P3.mo_id = P1.mo_id
                                           AND P3.pv_id = p2.pv_id
                                          )
                          )
                 ORDER BY RAND()
                 LIMIT 1);
                 
SET @good = (SELECT pv_id
             FROM properties_by_molecule
             WHERE pr_name = @property
             AND mo_id = @molecule
             ORDER BY RAND()
             LIMIT 1);                 
                 
SELECT DISTINCT	(SELECT mo_dci
                 FROM molecule
                 WHERE mo_id = @molecule) AS subject,
                (SELECT pv_name
                 FROM property_value
                 WHERE pv_id = @good) AS good_answer,
                 pv_name AS bad_answer
FROM properties_by_molecule AS P1
WHERE P1.pr_name = @property
AND NOT EXISTS (SELECT *
                FROM properties_by_molecule AS P2
                WHERE P2.pr_name = @property
                AND P1.pv_id = P2.pv_id
                AND P2.mo_id = @molecule) 
ORDER BY RAND()
LIMIT 3;                


