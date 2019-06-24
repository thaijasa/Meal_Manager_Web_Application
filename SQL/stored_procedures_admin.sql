-- SJSU CMPE 226 Spring 2019 TEAM2

-- PROCEDURE TO CHECK IF ADMIN LOGIN INFORMATION IS CORRECT
drop procedure if exists a_check_admin_login_info;
DELIMITER $$
CREATE PROCEDURE a_check_admin_login_info
(IN v_admin_email_id varchar(50), 
IN v_password varchar(50), 
OUT v_count varchar(10),
OUT v_admin_id varchar(20))
BEGIN
	select count(1) into v_count from adminn where admin_email = v_admin_email_id and password=SHA1(v_password);
	select admin_email into v_admin_id from adminn where admin_email = v_admin_email_id and password= SHA1(v_password);
END;
$$
DELIMITER ;


-- PROCEDURE TO INSERT DIETICIAN REGISTRATION DETAILS 

drop procedure if exists proc_d_ins_dietn_regn_details;
DELIMITER $$
create procedure proc_d_ins_dietn_regn_details
(in dietn_name varchar(50),
in dietn_email varchar(50),
in dietn_pwd varchar(50),
in dietn_exp decimal(5,2),
in dietn_qua varchar(50),
out vc int,
out eid varchar(50))
begin
	DECLARE `_rollback` BOOL DEFAULT 0;
	DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 

	START TRANSACTION;
	set eid = NULL;
	set vc = 0;
    select email_id into eid from dietician where email_id = dietn_email;
    if (eid is NULL) then
		insert into dietician (dietician_name, email_id, password, experience, qualification) values (dietn_name, dietn_email, SHA1(dietn_pwd), dietn_exp, dietn_qua);
		set vc = 1;
	end if;
    
    IF `_rollback` THEN ROLLBACK; 
	ELSE COMMIT;
	END IF;
end
$$
DELIMITER ;

-- PROCEDURE TO INSERT RESTAURANT REGISTRATION DETAILS 

drop procedure if exists proc_r_ins_rest_details;
DELIMITER $$
create procedure proc_r_ins_rest_details
(in rest_name varchar(50),
in rest_email varchar(50),
in rest_pwd varchar(50),
in rest_location varchar(30),
out vc int,
out eid varchar(50))
begin
	DECLARE `_rollback` BOOL DEFAULT 0;
	DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 
    START TRANSACTION;
   
	set eid = NULL;
    set vc = 0;
    select email_id into eid from restaurant where email_id = rest_email;
    if (eid is NULL) then
		insert into restaurant (name, email_id, password, location) values (rest_name, rest_email, SHA1(rest_pwd), rest_location);
		set vc = 1;
	end if;
    
    IF `_rollback` THEN ROLLBACK; 
	ELSE COMMIT;
	END IF;
end
$$
DELIMITER ;


