-- SJSU CMPE 226 Spring 2019 TEAM2

DROP TRIGGER IF EXISTS  update_offered_ind_for_insert;

DELIMITER $$
CREATE TRIGGER update_offered_ind_for_insert
AFTER INSERT 
ON restaurant_item_day
FOR EACH ROW
BEGIN 
  DECLARE v_count INT;
select count(*) into v_count from restaurant_item_day where restaurant_id = NEW.restaurant_id AND item_name = NEW.item_name; 
if v_count>0 then
UPDATE Item 
SET Offered_Ind = 'Y'
WHERE restaurant_id = NEW.restaurant_id AND item_name = NEW.item_name;
elseif v_count=0 then
	UPDATE Item 
SET Offered_Ind = 'N'
WHERE restaurant_id = NEW.restaurant_id AND item_name = NEW.item_name;
end if;
END;
$$
DELIMITER ;

drop trigger if exists update_offered_ind_for_delete;

DELIMITER $$
CREATE TRIGGER update_offered_ind_for_delete
after delete 
ON restaurant_item_day
FOR EACH ROW
BEGIN 
  DECLARE v_count INT;
select count(*) into v_count from restaurant_item_day where restaurant_id = OLD.restaurant_id AND item_name = OLD.item_name; 
if v_count>0 then
UPDATE Item 
SET Offered_Ind = 'Y'
WHERE restaurant_id = OLD.restaurant_id AND item_name = OLD.item_name;
elseif v_count=0 then
	UPDATE Item 
SET Offered_Ind = 'N'
WHERE restaurant_id = OLD.restaurant_id AND item_name = OLD.item_name;
end if;
END;
$$
DELIMITER ;
