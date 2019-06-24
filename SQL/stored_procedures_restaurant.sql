-- SJSU CMPE 226 Spring 2019 TEAM2

DROP PROCEDURE IF EXISTS r_check_restaurant_login_info;

DELIMITER $$

CREATE PROCEDURE r_check_restaurant_login_info(
   IN      restaurant_email_id   VARCHAR(50),
   IN      in_password           VARCHAR(50),
       OUT id_status             VARCHAR(10),
       OUT v_restaurant_id       INT)
BEGIN
   DECLARE v_count   INT DEFAULT 0;

   SELECT count(1)
     INTO v_count
     FROM restaurant
    WHERE     lower(email_id) = lower(restaurant_email_id)
          AND password = SHA1(in_password);


   SELECT restaurant_id
     INTO v_restaurant_id
     FROM restaurant
    WHERE     lower(email_id) = lower(restaurant_email_id)
          AND password = SHA1(in_password);

   SET id_status = v_count;
END;
$$

DELIMITER ;



DROP PROCEDURE IF EXISTS r_add_menu_item;

DELIMITER $$

CREATE PROCEDURE r_add_menu_item(IN      v_restaurant_id   INT,
                                 IN      v_item_name       VARCHAR(10),
                                 IN      v_meal_type       VARCHAR(10),
                                 IN      v_calories        VARCHAR(10),
                                 IN      v_proteins        VARCHAR(10),
                                 IN      v_carbohydrates   VARCHAR(10),
                                 IN      v_fat             VARCHAR(10),
                                 IN      v_monday          VARCHAR(1),
                                 IN      v_tuesday         VARCHAR(1),
                                 IN      v_wednesday       VARCHAR(1),
                                 IN      v_thursday        VARCHAR(1),
                                 IN      v_friday          VARCHAR(1),
                                 IN      v_saturday        VARCHAR(1),
                                 IN      v_sunday          VARCHAR(1),
                                     OUT v_result          INT)
BEGIN
   DECLARE v_count   INT DEFAULT 0;
   DECLARE v_item    INT DEFAULT 0;
   
   DECLARE `_rollback` BOOL DEFAULT 0;
	DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 
    SET v_result = 0;
	START TRANSACTION;

   SELECT count(*)
     INTO v_item
     FROM item
    WHERE restaurant_id = v_restaurant_id AND item_name = v_item_name;

   IF v_item = 0
   THEN
      INSERT INTO item(restaurant_id,
                       item_name,
                       meal_type,
                       calories,
                       proteins,
                       carbohydrates,
                       fat,
                       offered_ind)
           VALUES (v_restaurant_id,
                   v_item_name,
                   v_meal_type,
                   v_calories,
                   v_proteins,
                   v_carbohydrates,
                   v_fat,
                   'N');


      IF v_monday = 'Y'
      THEN
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
              VALUES (v_restaurant_id, v_item_name, 'Monday');
      END IF;

      IF v_tuesday = 'Y'
      THEN
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
              VALUES (v_restaurant_id, v_item_name, 'Tuesday');
      END IF;

      IF v_wednesday = 'Y'
      THEN
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
                 VALUES (v_restaurant_id, v_item_name,
                         
                         'Wednesday');
      END IF;

      IF v_thursday = 'Y'
      THEN
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
              VALUES (v_restaurant_id, v_item_name, 'Thursday');
      END IF;

      IF v_friday = 'Y'
      THEN
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
              VALUES (v_restaurant_id, v_item_name, 'Friday');
      END IF;

      IF v_saturday = 'Y'
      THEN
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
              VALUES (v_restaurant_id, v_item_name, 'Saturday');
      END IF;

      IF v_sunday = 'Y'
      THEN
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
              VALUES (v_restaurant_id, v_item_name, 'Sunday');
      END IF;
	     COMMIT;
	     SET v_result = 1;
	  
  elseif v_item > 0
   THEN 
  		     SET v_result = 2;
	
   END IF;
	IF `_rollback` THEN ROLLBACK; 
	ELSE COMMIT;
	END IF;
END;
$$

DELIMITER ;


drop procedure if exists proc_r_generate_report;
DELIMITER $$
CREATE PROCEDURE proc_r_generate_report(
IN v_restaurant_id int,
IN frmdte date,
IN todte date
)
begin
    SELECT Item_Name,Number_of_Times_Ordered,COALESCE(Average_Rating,'No Rating') as Average_Rating
    FROM
    (SELECT i.restaurant_id, i.Item_Name, count(O.Item_Name) as Number_of_Times_Ordered, avg(ir.rating) as Average_Rating from item i 
    left join orders O on i.restaurant_id=o.restaurant_id and i.Item_Name=o.Item_Name and o.order_date BETWEEN frmdte and todte
    LEFT JOIN item_ratings AS ir
	on i.restaurant_ID = ir.Restaurant_ID and i.Item_Name = ir.Item_Name where i.restaurant_id = v_restaurant_id
    group by i.Restaurant_ID,i.Item_Name)a;
   
end
$$
DELIMITER ;


-- Procedure to update Menu
drop procedure if exists proc_update_menu;
DELIMITER $$
create procedure proc_update_menu(
IN      v_restaurant_id   INT,
                                 IN      v_item_name       VARCHAR(50),
                                 IN      v_monday          VARCHAR(1),
                                 IN      v_tuesday         VARCHAR(1),
                                 IN      v_wednesday       VARCHAR(1),
                                 IN      v_thursday        VARCHAR(1),
                                 IN      v_friday          VARCHAR(1),
                                 IN      v_saturday        VARCHAR(1),
                                 IN      v_sunday          VARCHAR(1),
                                     OUT v_result          INT)
BEGIN

	
    
   DECLARE v_count   INT DEFAULT 0;
   DECLARE v_item    INT DEFAULT 0;
   DECLARE `_rollback` BOOL DEFAULT 0;
	DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1; 
    SET v_result = 0;
	START TRANSACTION;

   SELECT count(*)
     INTO v_item
     FROM restaurant_item_day
    WHERE restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Monday';
	if v_monday='Y' and v_item=0 then 
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
		VALUES (v_restaurant_id, v_item_name, 'Monday');
	elseif v_monday='N' and v_item=1 then 
		delete from restaurant_item_day where restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Monday';
	end if;
    
    SELECT count(*)
     INTO v_item
     FROM restaurant_item_day
    WHERE restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Tuesday';
	if v_tuesday='Y' and v_item=0 then 
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
		VALUES (v_restaurant_id, v_item_name, 'Tuesday');
	elseif v_tuesday='N' and v_item=1 then 
		delete from restaurant_item_day where restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Tuesday';
	end if;
    
	SELECT count(*)
	INTO v_item
	FROM restaurant_item_day
    WHERE restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Wednesday';
	if v_wednesday='Y' and v_item=0 then 
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
		VALUES (v_restaurant_id, v_item_name, 'Wednesday');
	elseif v_wednesday='N' and v_item=1 then 
		delete from restaurant_item_day where restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Wednesday';
	end if;
    
       
	SELECT count(*)
	INTO v_item
	FROM restaurant_item_day
    WHERE restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Thursday';
	if v_thursday='Y' and v_item=0 then 
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
		VALUES (v_restaurant_id, v_item_name, 'Thursday');
	elseif v_thursday='N' and v_item=1 then 
		delete from restaurant_item_day where restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Thursday';
	end if;
    
	SELECT count(*)
	INTO v_item
	FROM restaurant_item_day
    WHERE restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Friday';
	if v_friday='Y' and v_item=0 then 
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
		VALUES (v_restaurant_id, v_item_name, 'Friday');
	elseif v_friday='N' and v_item=1 then 
		delete from restaurant_item_day where restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Friday';
	end if;
	
	SELECT count(*)
	INTO v_item
	FROM restaurant_item_day
    WHERE restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Saturday';
	if v_saturday='Y' and v_item=0 then 
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
		VALUES (v_restaurant_id, v_item_name, 'Saturday');
	elseif v_saturday='N' and v_item=1 then 
		delete from restaurant_item_day where restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Saturday';
	end if;
    
	SELECT count(*)
	INTO v_item
	FROM restaurant_item_day
    WHERE restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Sunday';
	if v_sunday='Y' and v_item=0 then 
         INSERT INTO restaurant_item_day(restaurant_id,
                                         item_name,
                                         day_of_week)
		VALUES (v_restaurant_id, v_item_name, 'Sunday');
	elseif v_sunday='N' and v_item=1 then 
		delete from restaurant_item_day where restaurant_id = v_restaurant_id AND item_name = v_item_name and day_of_week='Sunday';
	end if;
    commit;
    
	IF `_rollback` THEN ROLLBACK; 
	ELSE COMMIT;
	END IF;
    
    
END;
$$

DELIMITER ;
