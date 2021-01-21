CREATE PROCEDURE `getClassesOf`(IN `dci` VARCHAR(256)) NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER 
WITH RECURSIVE classification AS ( 
    SELECT cl_id ,cl_name ,cl_higher ,cl_level 
    FROM class JOIN molecule ON mo_class = cl_id 
    WHERE molecule.mo_dci = dci 

    UNION ALL 

    SELECT C.cl_id ,C.cl_name ,C.cl_higher ,C.cl_level 
    FROM class C JOIN classification child ON C.cl_id = child.cl_higher 
) 
SELECT * 
FROM classification 
ORDER BY cl_level DESC;

CREATE PROCEDURE `getSystemsOf`(IN `dci` VARCHAR(256)) NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER 
WITH RECURSIVE classification AS (
    SELECT sy_id ,sy_name ,sy_higher ,sy_level 
    FROM system JOIN molecule ON mo_system = sy_id 
    WHERE molecule.mo_dci = dci 
    
    UNION ALL 
    
    SELECT S.sy_id ,S.sy_name ,S.sy_higher ,S.sy_level 
    FROM system S JOIN classification child ON S.sy_id = child.sy_higher
) 
SELECT * 
FROM classification 
ORDER BY sy_level DESC;

CREATE PROCEDURE `getPropertyValuesOf`(IN `dci` VARCHAR(256), IN `propertyName` VARCHAR(256)) NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER 
SELECT mo_dci as molecule, pv_name as value 
FROM molecule NATURAL JOIN molecule_property NATURAL JOIN property_value JOIN property ON pv_property = pr_id 
WHERE mo_dci = dci 
AND pr_name = propertyName;


UPDATE `server_informations`
    SET `value` = "2021-01-21" WHERE `key` = "api_version";
    