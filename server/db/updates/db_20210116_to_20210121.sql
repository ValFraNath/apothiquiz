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


UPDATE `server_informations`
    SET `value` = "2021-01-21" WHERE `key` = "api_version";
    