-- SJSU CMPE 226 Spring 2019 TEAM2

-- PROCEDURE TO INSERT CUSTOMER REGISTRATION DETAILS 
drop procedure if exists proc_c_ins_cust_details;
DELIMITER $$
create procedure proc_c_ins_cust_details
(in cust_name varchar(50),
in cust_dob date,
in cust_email_id varchar(50),
in cust_password varchar(50),
in cust_location varchar(50),
out vc int,
out eid varchar(50))
begin
    DECLARE `_rollback` BOOL DEFAULT 0;
	DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 
    START TRANSACTION;
    
	set eid = NULL;
    set vc = 0;
	select email_id into eid from customer where email_id = cust_email_id;
    if (eid is null) then
		insert into customer (cust_name, dob, email_id, password, location) values (cust_name, cust_dob, cust_email_id, SHA1(cust_password), 
        cust_location);
        set vc = 1;
	end if;
    
	IF `_rollback` THEN ROLLBACK; 
	ELSE COMMIT;
	END IF;
end
$$
DELIMITER ;


-- Dietician_YES

drop procedure if exists proc_dietician_yes;
DELIMITER $$
create procedure proc_dietician_yes(
in v_customer_id int,
in stdt date,
in cardtype varchar (10),
in cardnumb bigint(20),
in dieticianid int(11),
in measr_date date,
in activitylevel varchar(10),
in weight decimal(6,2),
in height decimal(5,2),
in sleep int(11),
in disease1 varchar(25),
in disease2 varchar(25),
in disease3 varchar(25),
in disease4 varchar(25),
in disease5 varchar(25),
in allergy1 varchar(30),
in allergy2 varchar(30),
in allergy3 varchar(30),
in allergy4 varchar(30),
in allergy5 varchar(30),
out res int,
out cnt int)
begin
	DECLARE `_rollback` BOOL DEFAULT 0;
	DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 
    START TRANSACTION;
	
	set res = 0;
	set cnt= 0;
    
	insert into customer_meal_plan(cust_id, start_date, plan_id) 
	values (v_customer_id, stdt, '1');
    
    insert into customer_billing (cust_ID, start_date, card_number, card_type, pay_date)
    values(v_customer_id, stdt, cardnumb, cardtype, curdate());
   
    select count(cust_ID) into cnt from diet_plan 
    where cust_ID = v_customer_id;
    set cnt = cnt + 1;
    
    insert into diet_plan 
    values(v_customer_id, dieticianid, cnt, stdt, 'Y', activitylevel, weight, sleep, height);
    
    if (disease1 != 'undefined') then
		insert into disease values(v_customer_id, dieticianid, cnt, disease1);
	end if;
    if (disease2 != 'undefined') then
		insert into disease values(v_customer_id, dieticianid, cnt, disease2);
    end if;
    if (disease3 != 'undefined') then
		insert into disease values(v_customer_id, dieticianid, cnt, disease3);
    end if;
    if (disease4 != 'undefined') then
		insert into disease values(v_customer_id, dieticianid, cnt, disease4);
    end if;
    if (disease5 != 'undefined') then
		insert into disease values(v_customer_id, dieticianid, cnt, disease5);
	end if;
     if (allergy1 != 'undefined') then
		insert into allergy values(v_customer_id, dieticianid, cnt, allergy1);
	end if;
    if (allergy2 != 'undefined') then
		insert into allergy values(v_customer_id, dieticianid, cnt, allergy2);
	end if;
    if (allergy3 != 'undefined') then
		insert into allergy values(v_customer_id, dieticianid, cnt, allergy3);
	end if;
    if (allergy4 != 'undefined') then
		insert into allergy values(v_customer_id, dieticianid, cnt, allergy4);
	end if;
    if (allergy5 != 'undefined') then
		insert into allergy values(v_customer_id, dieticianid, cnt, allergy5);
	end if;
    set res =1;
    
	IF `_rollback` THEN ROLLBACK; 
	ELSE COMMIT;
	END IF;
end
$$
DELIMITER ;



-- Dietician_NO
drop procedure if exists proc_dietician_no;
DELIMITER $$
create procedure proc_dietician_no(
in v_customer_id int,
in stdt DATE,
in mealtypeid int(11),
in cardtype varchar(10),
in cardnumb bigint(20),
out res int
)
begin
	DECLARE `_rollback` BOOL DEFAULT 0;
	DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 
    START TRANSACTION;
    
	set res = 0;
	insert into customer_meal_plan
	values (v_customer_id, stdt, mealtypeid);
    insert into customer_billing
    values(v_customer_id, stdt,cardnumb,cardtype, curdate());
    set res = 1;
    
    IF `_rollback` THEN ROLLBACK; 
	ELSE COMMIT;
	END IF;
end
$$
DELIMITER ;



-- To validate the Customer login info 
DROP PROCEDURE IF EXISTS c_check_customer_login_info;

DELIMITER $$
CREATE PROCEDURE c_check_customer_login_info
(IN customer_email_id varchar(50), IN in_password varchar(50),OUT v_count varchar(10),
OUT v_customer_id int, OUT cust_type varchar(15))
BEGIN

DECLARE cust_diet_chk int DEFAULT 0;
DECLARE cust_meal_chk int DEFAULT 0;
DECLARE start_date_chk int DEFAULT 0;

SELECT count(1) into v_count FROM customer WHERE LOWER(email_id)=LOWER(customer_email_id) AND password=SHA1(in_password);
SELECT cust_id into v_customer_id FROM customer WHERE LOWER(email_id)=LOWER(customer_email_id) AND password=SHA1(in_password);

-- To check if he is regular meal plan person 
SELECT COUNT(*) into cust_meal_chk 
FROM customer as c
JOIN customer_meal_plan as cm
ON c.cust_id = cm.cust_id
JOIN meal_plan as mp
ON mp.plan_ID = cm.plan_ID
WHERE LOWER(email_id)=LOWER(customer_email_id) AND password=SHA1(in_password)
AND start_date<= ADDDATE(NOW(),INTERVAL 1 DAY) AND start_date > SUBDATE(NOW(),INTERVAL 30 DAY)
AND mp.dietician_option ='N';

-- To check if he is Dietician enrolled person  
SELECT COUNT(*) into cust_diet_chk 
FROM customer as c
JOIN customer_meal_plan as cm
ON c.cust_id = cm.cust_id
JOIN meal_plan as mp
ON mp.plan_ID = cm.plan_ID
WHERE LOWER(email_id)=LOWER(customer_email_id) AND password=SHA1(in_password)
AND start_date<= ADDDATE(NOW(),INTERVAL 1 DAY) AND start_date > SUBDATE(NOW(),INTERVAL 30 DAY)
AND mp.dietician_option ='Y';


-- To check if he is enrolled in one of the plans but start date is after tomorow 
SELECT COUNT(*) into start_date_chk 
FROM customer as c
JOIN customer_meal_plan as cm
ON c.cust_id = cm.cust_id
JOIN meal_plan as mp
ON mp.plan_ID = cm.plan_ID
WHERE LOWER(email_id)=LOWER(customer_email_id) AND password=SHA1(in_password)
AND start_date > ADDDATE(NOW(),INTERVAL 1 DAY);

IF start_date_chk =1 THEN 
	SET cust_type = 'Start_Date_Late';

ELSEIF cust_diet_chk = 1 OR cust_meal_chk = 1 THEN 
	SET cust_type = 'Diet_Regular';
    
ELSEIF cust_diet_chk = 0 AND cust_meal_chk = 0 THEN
	SET cust_type = 'None';
    
END IF;
END;
$$
DELIMITER ;


--  To insert the orders from customer
DROP PROCEDURE IF EXISTS  c_place_order;

DELIMITER $$
CREATE PROCEDURE c_place_order
(IN p_cust_id int, IN restaurant_name_bf varchar(30),  IN item_name_bf varchar(30), IN restaurant_name_ln varchar(30), 
IN item_name_ln varchar(30), IN restaurant_name_din varchar(30),  IN item_name_din varchar(30),
IN p_bf_time time,IN p_ln_time time, IN p_din_time time, OUT bf_chk int,OUT ln_chk int, OUT din_chk int )

BEGIN

DECLARE restaurant_id_bf int DEFAULT 0;
DECLARE restaurant_id_ln int DEFAULT 0;
DECLARE restaurant_id_din int DEFAULT 0;
DECLARE `_rollback` BOOL DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 

START TRANSACTION;

SELECT COUNT(o.cust_id) into bf_chk
FROM orders as o
JOIN item as i
ON i.restaurant_id = o.restaurant_id AND i.item_name = o.item_name
WHERE cust_id = p_cust_id AND order_date = DATE(NOW()) AND meal_type = 'breakfast' AND  restaurant_name_bf!= ' ';

SELECT COUNT(o.cust_id) into ln_chk
FROM orders as o
JOIN item as i
ON i.restaurant_id = o.restaurant_id AND i.item_name = o.item_name
WHERE cust_id = p_cust_id AND order_date = DATE(NOW()) AND meal_type = 'lunch' AND restaurant_name_ln!= ' ' ;

SELECT COUNT(o.cust_id) into din_chk
FROM orders as o
JOIN item as i
ON i.restaurant_id = o.restaurant_id AND i.item_name = o.item_name
WHERE cust_id = p_cust_id AND order_date = DATE(NOW()) AND meal_type = 'dinner' AND restaurant_name_din!= ' ';


SELECT restaurant_id into restaurant_id_bf
FROM restaurant
WHERE name = restaurant_name_bf;

SELECT restaurant_id into restaurant_id_ln
FROM restaurant
WHERE name = restaurant_name_ln;

SELECT restaurant_id into restaurant_id_din
FROM restaurant
WHERE name = restaurant_name_din;


IF restaurant_id_bf != 0  AND bf_chk = 0 THEN
	INSERT INTO orders values(p_cust_id,restaurant_id_bf,item_name_bf,NOW(),p_bf_time); 
END IF;

IF restaurant_id_ln != 0 AND ln_chk = 0 THEN
	INSERT INTO orders values(p_cust_id,restaurant_id_ln,item_name_ln,NOW(),p_ln_time); 
END IF;

IF restaurant_id_din != 0 AND din_chk = 0 THEN
	INSERT INTO orders values(p_cust_id,restaurant_id_din,item_name_din,NOW(),p_din_time); 
END IF;

IF `_rollback` THEN ROLLBACK; 
ELSE COMMIT;
END IF;

END; 
$$
DELIMITER ;



--  To insert the new request for change in diet plan
DROP PROCEDURE IF EXISTS  c_request_diet_plan_change;

DELIMITER $$
CREATE PROCEDURE c_request_diet_plan_change
(IN p_cust_id int, IN input_date date, IN p_request varchar(50),OUT v_check int)

BEGIN

DECLARE v_cust_id int;
DECLARE v_dietician_id int;
DECLARE v_diet_plan_id int;
DECLARE `_rollback` BOOL DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 

START TRANSACTION;

SELECT DISTINCT cust_id, dietician_id, diet_plan_id into v_cust_id,v_dietician_id,v_diet_plan_id
FROM c_diet_plan_details
WHERE cust_id = p_cust_id;

-- To check if there is an existing request change 
SELECT COUNT(*) into v_check
FROM customer_requests
WHERE cust_id= v_cust_id AND dietician_id = v_dietician_id AND diet_plan_id = v_diet_plan_id;

If v_check != 1 THEN

	INSERT INTO customer_requests values(v_cust_id,v_dietician_id,v_diet_plan_id,input_date,p_request,'Y');

ELSE 

UPDATE customer_requests
SET request_initiation_date = input_date,request_content = p_request,update_diet_plan_ind='Y'
WHERE cust_id= v_cust_id AND dietician_id = v_dietician_id AND diet_plan_id = v_diet_plan_id;
    
END IF;

IF `_rollback` THEN ROLLBACK; 
ELSE COMMIT;
END IF;

END; 
$$
DELIMITER ;



-- To Update The Diet Progress Information
DROP PROCEDURE IF EXISTS c_update_diet_progress;

DELIMITER $$
CREATE PROCEDURE c_update_diet_progress
(IN p_cust_id int,IN log_date date, IN breakfast varchar(10), IN lunch varchar(10), IN dinner varchar(10),
IN additional_intake varchar(50),OUT v_cnt int)

BEGIN
DECLARE v_day int;
DECLARE v_cust_id int;
DECLARE v_dietician_id int;
DECLARE v_diet_plan_id int;
DECLARE v_start_date date;
DECLARE `_rollback` BOOL DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 

START TRANSACTION;

SELECT DISTINCT cust_id, dietician_id, diet_plan_id,diet_start_date into v_cust_id,v_dietician_id,v_diet_plan_id,v_start_date
FROM c_diet_plan_details
WHERE cust_id = p_cust_id;

SELECT DATEDIFF(log_date,v_start_date)+1 into v_day;

-- To check if the progress is already logged for tht day 
SELECT COUNT(*) into v_cnt
FROM diet_progress
WHERE cust_id= v_cust_id AND dietician_id = v_dietician_id AND diet_plan_id = v_diet_plan_id AND day = v_day;

If v_cnt != 1 THEN

	INSERT INTO diet_progress values(v_cust_id,v_dietician_id,v_diet_plan_id,v_day,breakfast,lunch,dinner,additional_intake);

ELSE 

UPDATE diet_progress
SET breakfast = breakfast,lunch = lunch,dinner=dinner,additional_intake=additional_intake
WHERE cust_id= v_cust_id AND dietician_id = v_dietician_id AND diet_plan_id = v_diet_plan_id AND day = v_day;
    
END IF;

IF `_rollback` THEN ROLLBACK; 
ELSE COMMIT;
END IF;

END; 
$$
DELIMITER ;



-- To Update The Item Rating
DROP PROCEDURE IF EXISTS  c_update_item_rating;

DELIMITER $$
CREATE PROCEDURE c_update_item_rating
(IN p_cust_id int,IN p_restaurant_id int, IN p_item_name varchar(30), IN p_rating int, OUT v_chck int )

BEGIN

DECLARE `_rollback` BOOL DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 

START TRANSACTION;

SELECT COUNT(*) into v_chck
FROM item_ratings
WHERE cust_id = p_cust_id AND restaurant_id = p_restaurant_id AND item_name= p_item_name;


If v_chck != 1 THEN
	
    INSERT INTO item_ratings values(p_cust_id,p_restaurant_id,p_item_name,p_rating);

ELSE 

UPDATE item_ratings
SET rating = p_rating
WHERE cust_id = p_cust_id AND restaurant_id = p_restaurant_id AND item_name= p_item_name;
    
END IF;

IF `_rollback` THEN ROLLBACK; 
ELSE COMMIT;
END IF;

END; 
$$
DELIMITER ;



-- To Update The Dietician Rating
DROP PROCEDURE IF EXISTS c_update_dietician_rating;

DELIMITER $$
CREATE PROCEDURE c_update_dietician_rating
(IN p_cust_id int,IN p_dietician_id int, IN p_rating int, OUT v_chck int)

BEGIN

DECLARE `_rollback` BOOL DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 

START TRANSACTION;

SELECT COUNT(*) into v_chck
FROM dietician_ratings
WHERE cust_id = p_cust_id AND dietician_id = p_dietician_id;

If v_chck != 1 THEN
	
    INSERT INTO dietician_ratings values(p_cust_id,p_dietician_id,p_rating);

ELSE 

UPDATE dietician_ratings
SET rating = p_rating
WHERE cust_id = p_cust_id AND dietician_id = p_dietician_id;
    
END IF;

IF `_rollback` THEN ROLLBACK; 
ELSE COMMIT;
END IF;

END; 
$$
DELIMITER ;



