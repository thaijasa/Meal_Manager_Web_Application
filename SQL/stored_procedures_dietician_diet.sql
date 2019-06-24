-- SJSU CMPE 226 Spring 2019 TEAM2

DROP PROCEDURE IF EXISTS d_check_dietician_login_info;

DELIMITER $$
CREATE PROCEDURE d_check_dietician_login_info(
   IN      dietician_email_id   VARCHAR(50),
   IN      in_password          VARCHAR(50),
       OUT id_status            VARCHAR(10),
       OUT v_dietician_id       INT)
BEGIN
   DECLARE v_count   INT DEFAULT 0;

   SELECT count(1)
     INTO v_count
     FROM dietician
    WHERE lower(email_id) = lower(dietician_email_id) AND password = SHA1(in_password);

   SET id_status = v_count;

   SELECT dietician_id
     INTO v_dietician_id
     FROM dietician
    WHERE lower(email_id) = lower(dietician_email_id) AND password = SHA1(in_password);

   SET id_status = v_count;
END;
$$
DELIMITER ;

DROP PROCEDURE IF EXISTS d_add_diet_details;


DELIMITER $$
CREATE PROCEDURE d_add_diet_details(
   IN      v_custid_dietstartdate  VARCHAR(50),
   IN      v_day                               VARCHAR(10),
   IN      v_breakfast_calories                VARCHAR(10),
   IN      v_breakfast_proteins                VARCHAR(10),
   IN      v_breakfast_carbohydrates           VARCHAR(10),
   IN      v_breakfast_fat                     VARCHAR(10),
   IN      v_lunch_calories                    VARCHAR(10),
   IN      v_lunch_proteins                    VARCHAR(10),
   IN      v_lunch_carbohydrates               VARCHAR(10),
   IN      v_lunch_fat                         VARCHAR(10),
   IN      v_dinner_calories                   VARCHAR(10),
   IN      v_dinner_proteins                   VARCHAR(10),
   IN      v_dinner_carbohydrates              VARCHAR(10),
   IN      v_dinner_fat                        VARCHAR(10),
       OUT v_result                            INT)
BEGIN
   DECLARE v_count_breakfast   INT DEFAULT 0;
   DECLARE v_count_lunch       INT DEFAULT 0;
   DECLARE v_count_dinner      INT DEFAULT 0;
declare v_cust_id INT default 0;
declare v_diet_start_date date default now();
declare v_dietician_id int default 0;
declare v_diet_Plan_id int default 0;
    DECLARE `_rollback` BOOL DEFAULT 0;
	DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 
    START TRANSACTION;
    
select cust_id,diet_start_date,dietician_id,diet_Plan_id into v_cust_id,v_diet_start_date,v_dietician_id,v_diet_Plan_id
 from diet_plan where concat(cust_id,';',diet_start_date)=v_custid_dietstartdate;

   SELECT count(1)
     INTO v_count_breakfast
     FROM diet_plan_details
    WHERE     cust_id = v_cust_id
	and dietician_id = v_dietician_id
	and diet_Plan_id = v_diet_Plan_id
          AND day =v_day
          AND meal_type = 'Breakfast';

   IF v_count_breakfast = 0
   THEN
      INSERT INTO diet_plan_details(cust_id,dietician_id,diet_plan_id, 
                                    day,
                                    meal_type,
                                    calories,
                                    proteins,
                                    carbohydrates,
                                    fat)
           VALUES (v_cust_id,v_dietician_id,v_diet_plan_id,
                   v_day,
                   'Breakfast',
                   v_breakfast_calories,
                   v_breakfast_proteins,
                   v_breakfast_carbohydrates,
                   v_breakfast_fat);
   ELSEIF v_count_breakfast > 0
   THEN
      UPDATE diet_plan_details
         SET calories = v_breakfast_calories,
             proteins = v_breakfast_proteins,
             carbohydrates = v_breakfast_carbohydrates,
             fat = v_breakfast_fat
       WHERE       cust_id = v_cust_id
	and dietician_id = v_dietician_id
	and diet_Plan_id = v_diet_Plan_id
          AND day =v_day
          AND meal_type = 'Breakfast';
   END IF;

   SELECT count(1)
     INTO v_count_lunch
     FROM diet_plan_details
    WHERE     cust_id = v_cust_id
	and dietician_id = v_dietician_id
	and diet_Plan_id = v_diet_Plan_id
          AND day =v_day
          AND meal_type = 'Lunch';

   IF v_count_lunch = 0
   THEN
      INSERT INTO diet_plan_details(cust_id,dietician_id,diet_plan_id, 
                                    day,
                                    meal_type,
                                    calories,
                                    proteins,
                                    carbohydrates,
                                    fat)
           VALUES (v_cust_id,v_dietician_id,v_diet_plan_id,
                   v_day,
                   'Lunch',
                   v_lunch_calories,
                   v_lunch_proteins,
                   v_lunch_carbohydrates,
                   v_lunch_fat);
   ELSEIF v_count_lunch > 0
   THEN
      UPDATE diet_plan_details
         SET calories = v_lunch_calories,
             proteins = v_lunch_proteins,
             carbohydrates = v_lunch_carbohydrates,
             fat = v_lunch_fat
       WHERE      cust_id = v_cust_id
	and dietician_id = v_dietician_id
	and diet_Plan_id = v_diet_Plan_id
          AND day =v_day
          AND meal_type = 'Lunch';
   END IF;
   
   
      SELECT count(1)
     INTO v_count_dinner
     FROM diet_plan_details
    WHERE   cust_id = v_cust_id
	and dietician_id = v_dietician_id
	and diet_Plan_id = v_diet_Plan_id
          AND day =v_day
          AND meal_type = 'Dinner';

   IF v_count_dinner = 0
   THEN
      INSERT INTO diet_plan_details(cust_id,dietician_id,diet_plan_id, 
                                    day,
                                    meal_type,
                                    calories,
                                    proteins,
                                    carbohydrates,
                                    fat)
           VALUES (v_cust_id,v_dietician_id,v_diet_plan_id,
                   v_day,
                   'Dinner',
                   v_dinner_calories,
                   v_dinner_proteins,
                   v_dinner_carbohydrates,
                   v_dinner_fat);
   ELSEIF v_count_dinner > 0
   THEN
      UPDATE diet_plan_details
         SET calories = v_dinner_calories,
             proteins = v_dinner_proteins,
             carbohydrates = v_dinner_carbohydrates,
             fat = v_dinner_fat
       WHERE       cust_id = v_cust_id
	and dietician_id = v_dietician_id
	and diet_Plan_id = v_diet_Plan_id
          AND day =v_day
          AND meal_type = 'Dinner';
   END IF;
	IF `_rollback` THEN ROLLBACK;     SET v_result = -1;
	ELSE COMMIT;    SET v_result = 1;
	END IF;
END;
$$
DELIMITER ;


DROP PROCEDURE IF EXISTS d_finalize_new_diet_plan;

DELIMITER $$
CREATE PROCEDURE d_finalize_new_diet_plan(
   IN      v_custid_dietstartdate  VARCHAR(50),
       OUT v_result                            INT)
BEGIN

    DECLARE `_rollback` BOOL DEFAULT 0;
	DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 
    START TRANSACTION;
    update diet_plan set new_diet_plan_ind='N' where concat(cust_id,';',diet_start_date)=v_custid_dietstartdate;
	IF `_rollback` THEN ROLLBACK;     SET v_result = -1;
	ELSE COMMIT;    SET v_result = 1;
	END IF;
END;
$$
DELIMITER ;


DROP PROCEDURE IF EXISTS d_finalize_update_diet_plan;

DELIMITER $$
CREATE PROCEDURE d_finalize_update_diet_plan(
   IN      v_custid_dietstartdate  VARCHAR(50),
       OUT v_result                            INT)
BEGIN

    DECLARE `_rollback` BOOL DEFAULT 0;
	DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 
    START TRANSACTION;
update customer_requests set update_diet_plan_ind='N'
where exists (select * from diet_plan where diet_plan.cust_id=customer_requests.cust_id
and  customer_requests.dietician_id=diet_plan.dietician_id and 
customer_requests.diet_plan_id=diet_plan.diet_plan_id and concat(cust_id,';',diet_start_date)=v_custid_dietstartdate);
	IF `_rollback` THEN 
		ROLLBACK; 
	    SET v_result = -1;
	ELSE 
		COMMIT;  
		  SET v_result = 1;
	END IF;
END;
$$
DELIMITER ;