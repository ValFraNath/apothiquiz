-- ****************************************************************
--      TYPE 6 : Quelle {propriété} a la molécule // DCI //
-- ****************************************************************



SET @good = (	SELECT pv_id
                FROM molecule_property NATURAL JOIN property_value 
             	JOIN property ON pr_id = pv_property 
                WHERE pr_name = @property 
                ORDER BY RAND()
                LIMIT 1);

SET @molecule = (	SELECT mo_id
					FROM molecule_property
                 	WHERE pv_id = @good
                 	ORDER BY RAND()
                 	LIMIT 1 );

SELECT DISTINCT	(SELECT mo_dci
                 FROM molecule
                 WHERE mo_id = @molecule) AS subject,
                (SELECT pv_name
                 FROM property_value
                 WHERE pv_id = @good) AS good_answer,
                 pv_name AS bad_answer
FROM property_value JOIN property ON pv_property = pr_id
WHERE pr_name = @property
AND NOT EXISTS (SELECT *
                FROM molecule_property
                WHERE molecule_property.pv_id = property_value.pv_id
                AND molecule_property.mo_id = @molecule)
ORDER BY RAND()
LIMIT 3;
                 