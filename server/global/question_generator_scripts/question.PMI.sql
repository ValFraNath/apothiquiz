-- ****************************************************************
--      TYPE 5-6-7 : 1 property values - 4 molecules
-- ****************************************************************


SET @value = (SELECT pv_id
                 FROM properties_by_molecule AS P1
                 WHERE P1.pr_name = @property
                 AND 3 <= (SELECT COUNT(DISTINCT mo_id)
                           FROM properties_by_molecule AS P2
                           WHERE P2.pr_name = @property
                           AND NOT EXISTS (SELECT *
                                           FROM properties_by_molecule AS P3
                                           WHERE P3.pr_name = @property
                                           AND P3.mo_id = P2.mo_id
                                           AND P3.pv_id = P1.pv_id
                                          )
                          )
                 ORDER BY RAND()
                 LIMIT 1);
                 
SET @good = (SELECT mo_id
             FROM properties_by_molecule
             WHERE pr_name = @property
             AND pv_id = @value
             ORDER BY RAND()
             LIMIT 1);                 
                 
SELECT DISTINCT	(SELECT pv_name
                 FROM property_value
                 WHERE pv_id = @value) AS subject,
                (SELECT mo_dci
                 FROM molecule
                 WHERE mo_id = @good) AS good_answer,
                 mo_dci AS bad_answer
FROM properties_by_molecule AS P1
WHERE P1.pr_name = @property
AND NOT EXISTS (SELECT *
                FROM properties_by_molecule AS P2
                WHERE P2.pr_name = @property
                AND P1.mo_id = P2.mo_id
                AND P2.pv_id = @value) 
ORDER BY RAND()
LIMIT 3;                


