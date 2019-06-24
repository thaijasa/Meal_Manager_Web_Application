-- SJSU CMPE 226 Spring 2019 TEAM2

use mealmgr;

/* ******************************************************************** 
************************ Dietician Module ****************************
***********************************************************************/


#get view to get 30 days with 3 meals every day
create or replace view diet_plan_day_meal_type_view(day,meal_type) as
	(select	1	,'Breakfast' 	union select	1	,'Lunch'	union select	1	,'Dinner'	union 
select	2	,'Breakfast' 	union select	2	,'Lunch'	union select	2	,'Dinner'	union 
select	3	,'Breakfast' 	union select	3	,'Lunch'	union select	3	,'Dinner'	union 
select	4	,'Breakfast' 	union select	4	,'Lunch'	union select	4	,'Dinner'	union 
select	5	,'Breakfast' 	union select	5	,'Lunch'	union select	5	,'Dinner'	union 
select	6	,'Breakfast' 	union select	6	,'Lunch'	union select	6	,'Dinner'	union 
select	7	,'Breakfast' 	union select	7	,'Lunch'	union select	7	,'Dinner'	union 
select	8	,'Breakfast' 	union select	8	,'Lunch'	union select	8	,'Dinner'	union 
select	9	,'Breakfast' 	union select	9	,'Lunch'	union select	9	,'Dinner'	union 
select	10	,'Breakfast' 	union select	10	,'Lunch'	union select	10	,'Dinner'	union 
select	11	,'Breakfast' 	union select	11	,'Lunch'	union select	11	,'Dinner'	union 
select	12	,'Breakfast' 	union select	12	,'Lunch'	union select	12	,'Dinner'	union 
select	13	,'Breakfast' 	union select	13	,'Lunch'	union select	13	,'Dinner'	union 
select	14	,'Breakfast' 	union select	14	,'Lunch'	union select	14	,'Dinner'	union 
select	15	,'Breakfast' 	union select	15	,'Lunch'	union select	15	,'Dinner'	union 
select	16	,'Breakfast' 	union select	16	,'Lunch'	union select	16	,'Dinner'	union 
select	17	,'Breakfast' 	union select	17	,'Lunch'	union select	17	,'Dinner'	union 
select	18	,'Breakfast' 	union select	18	,'Lunch'	union select	18	,'Dinner'	union 
select	19	,'Breakfast' 	union select	19	,'Lunch'	union select	19	,'Dinner'	union 
select	20	,'Breakfast' 	union select	20	,'Lunch'	union select	20	,'Dinner'	union 
select	21	,'Breakfast' 	union select	21	,'Lunch'	union select	21	,'Dinner'	union 
select	22	,'Breakfast' 	union select	22	,'Lunch'	union select	22	,'Dinner'	union 
select	23	,'Breakfast' 	union select	23	,'Lunch'	union select	23	,'Dinner'	union 
select	24	,'Breakfast' 	union select	24	,'Lunch'	union select	24	,'Dinner'	union 
select	25	,'Breakfast' 	union select	25	,'Lunch'	union select	25	,'Dinner'	union 
select	26	,'Breakfast' 	union select	26	,'Lunch'	union select	26	,'Dinner'	union 
select	27	,'Breakfast' 	union select	27	,'Lunch'	union select	27	,'Dinner'	union 
select	28	,'Breakfast' 	union select	28	,'Lunch'	union select	28	,'Dinner'	union 
select	29	,'Breakfast' 	union select	29	,'Lunch'	union select	29	,'Dinner'	union 
select	30	,'Breakfast' 	union select	30	,'Lunch'	union select	30	,'Dinner'	);
		   
# get all cust diet plan ids list
create or replace view d_customers_diet_plan_id_view as
select c.cust_id, 
cust_name,email_id as cust_email_id,cdp.diet_start_date ,
TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age, cdp.height,cdp.weight,
cdp.activity_level,cdp.sleep
from diet_plan cdp join customer c
on cdp.cust_id=c.cust_id;

#get customer diet plan details view
create or replace view d_customer_diet_plan_details_view as
select dp.cust_id,dp.dietician_id, dp.diet_start_date, mt.day,
DATE_ADD(dp.diet_start_date, INTERVAL mt.day DAY) as calendar_date,
dp.new_diet_plan_ind,mt.meal_type,dpd.calories,
dpd.proteins,dpd.carbohydrates,dpd.fat  
from  diet_plan dp join diet_plan_day_meal_type_view mt  left join diet_plan_details dpd on dp.cust_id=dpd.cust_id
and dpd.diet_plan_id=dp.diet_plan_id and dpd.dietician_id=dp.dietician_id and mt.day=dpd.day
and mt.meal_type=dpd.meal_type
		;
		
create or replace view d_customer_diet_plans_list_view
 as select cmp.cust_id, c.cust_name, c.email_id cust_email_id, 
TIMESTAMPDIFF(YEAR, c.dob, CURDATE()) AS cust_age,dp.dietician_id, 
dp.height,dp.weight,
dp.activity_level,dp.sleep,dp.diet_plan_id,
dp.diet_start_date , 
cb.pay_date as new_diet_plan_request_date, dp.new_diet_plan_ind 
   from customer_meal_plan cmp
 join customer c on cmp.cust_id=c.cust_id
join diet_plan dp on cmp.cust_id=dp.cust_id and cmp.start_date=dp.diet_start_date
join customer_billing cb on c.cust_id=cb.cust_id and cb.start_date=dp.diet_start_date
 where exists (select * from meal_plan mp where mp.dietician_option='Y'
and cmp.plan_id=mp.plan_id );
		  
# get customer diet progress view	
create or replace view d_customer_dietplan_progress_view as		
		   select cdp.dietician_id,cdp.cust_id,cdp.diet_plan_id,cdp.diet_start_date,
dpt.day, 
ADDDATE(cdp.diet_start_date, INTERVAL dpt.day DAY) calendar_date,
 dpt.meal_type,
dpt.calories,dpt.proteins,dpt.carbohydrates, dpt.fat, 
case when dpt.meal_type='Breakfast' then ifnull(dp.breakfast,'No Data')
when dpt.meal_type='Lunch' then ifnull(dp.lunch,'No Data')
when dpt.meal_type='Dinner' then ifnull(dp.dinner,'No Data')
end diet_followed,dp.additional_intake from diet_plan cdp join diet_plan_details dpt
on cdp.cust_id=dpt.cust_id and cdp.dietician_id=dpt.dietician_id and cdp.diet_plan_id=dpt.diet_plan_id 
left join diet_progress dp on dpt.cust_id=dp.cust_id and dpt.dietician_id=dp.dietician_id
and dpt.diet_plan_id=dp.diet_plan_id and dpt.day=dp.day;

#get customer health details
create or replace view d_diet_plans_cust_health_details_view
 as 
select * from (
select q2.*,'Allergy' a_d_type, ifnull(a.allergy,'No Allergy') allergy_disease from d_customer_diet_plans_list_view q2 left join allergy a on a.cust_id=q2.cust_id and a.dietician_id=q2.dietician_id
and a.diet_plan_id=q2.diet_plan_id
union
select q2.*,'Disease' a_d_type, ifnull(d.disease,'No Disease') allergy_disease from d_customer_diet_plans_list_view q2 left join disease d on d.cust_id=q2.cust_id and d.dietician_id=q2.dietician_id
and d.diet_plan_id=q2.diet_plan_id)q1;

#get all customers for a particular dietician
  CREATE OR REPLACE VIEW d_dietician_customers_view
  AS
select c.cust_id, c.cust_name, c.email_id cust_email_id, 
TIMESTAMPDIFF(YEAR, c.dob, CURDATE()) AS cust_age,d.dietician_id, 
d.dietician_name,dp.diet_start_date , 
cb.pay_date as new_diet_plan_request_date,dp.new_diet_plan_ind    from customer_meal_plan cmp
join customer c on c.cust_id=cmp.cust_id 
join diet_plan dp on c.cust_id=dp.cust_id and cmp.start_date=dp.diet_start_date
join dietician d on dp.dietician_id=d.dietician_id
join customer_billing cb on c.cust_id=cb.cust_id and cb.start_date=dp.diet_start_date
 where exists (select * from meal_plan mp where mp.dietician_option='Y'
and cmp.plan_id=mp.plan_id );

create or replace view d_update_diet_plan_dates_view
as select cust_id,
	dietician_id,diet_start_date,diet_plan_id,day,calendar_date,update_diet_plan_ind,
	diet_plan_update_start_date,request_content,meal_type,
	calories,proteins, carbohydrates, fat
	from (
select dp.cust_id,dp.dietician_id,
dp.diet_start_date ,dp.diet_plan_id,dpd.day,ADDDATE(dp.diet_start_date, INTERVAL dpd.day-1 DAY) calendar_date,
 dpd.meal_type, dpd.calories, dpd.proteins,
dpd.carbohydrates,dpd.fat,
cr.update_diet_plan_ind,
cr.request_initiation_date as diet_plan_update_start_date, cr.request_content 
from customer_requests cr 
join diet_plan dp
on cr.cust_id=dp.cust_id and cr.dietician_id=dp.dietician_id
and cr.diet_plan_id=dp.diet_plan_id
join diet_plan_details dpd 
on  dpd.cust_id=dp.cust_id and dpd.dietician_id=dp.dietician_id
and dpd.diet_plan_id=dp.diet_plan_id 
) as update_requests
where calendar_date >=diet_plan_update_start_date and update_diet_plan_ind='Y'
;
	
create or replace view d_update_diet_plans_list_view
as select dp.cust_id,c.cust_name,c.email_id cust_email_id,dp.dietician_id,
dp.diet_start_date ,dp.diet_plan_id,
cr.update_diet_plan_ind,
cr.request_initiation_date as diet_plan_update_start_date, cr.request_content 
from customer_requests cr 
join customer c on cr.cust_id=c.cust_id
join diet_plan dp
on cr.cust_id=dp.cust_id and cr.dietician_id=dp.dietician_id
and cr.diet_plan_id=dp.diet_plan_id
where update_diet_plan_ind='Y' and cr.request_initiation_date>= DATE_ADD(now(), INTERVAL -5 DAY)
;
	



/* ******************************************************************** 
************************ Restaurant Module ****************************
***********************************************************************/
CREATE or replace VIEW r_restaurant_item_details_day_view AS 
  select  r.restaurant_id,i.item_name,i.meal_type, i.calories,
i.proteins, i.carbohydrates, i.fat ,i.offered_ind,rid.day_of_week from restaurant r
  join item i on r.restaurant_id=i.restaurant_id
  left join restaurant_item_day rid
  on i.restaurant_id=rid.restaurant_id and i.item_name=rid.item_name;
  
  

CREATE or replace VIEW r_update_menu_view AS select q1.restaurant_id,q1.item_name,q1.meal_type,q1.day_of_week,q1.offered_ind,case when rid.day_of_week is null then 'N' else 'Y' end item_offered from(
select  r.restaurant_id,i.item_name,i.meal_type, i.offered_ind,w.day_of_week
from restaurant r join item i on r.restaurant_id=i.restaurant_id 
natural join (select 'Monday'  day_of_week union
select 'Tuesday' day_of_week union 
select 'Wednesday' day_of_week union 
select 'Thursday' day_of_week union 
select 'Friday' day_of_week union 
select 'Saturday' day_of_week union 
select 'Sunday' day_of_week   ) w) q1
left join restaurant_item_day rid
on q1.restaurant_id=rid.restaurant_id and q1.item_name=rid.item_name and q1.day_of_week=rid.day_of_week;


/* ******************************************************************** 
************************ Customer Module ****************************
***********************************************************************/

drop view if exists diet_ratings_view;
create view diet_ratings_view as
(select d.dietician_id, d.dietician_name,d.email_id,d.experience,d.qualification,ifnull(dr.avg_ratings,'No Ratings') as ratings 
from dietician d left join 
(select dietician_id,avg(rating) as avg_ratings 
from  dietician_ratings 
group by dietician_id) dr
on d.dietician_id=dr.dietician_id);


-- To get the current diet plan details
CREATE or replace VIEW c_diet_plan_details AS
SELECT DISTINCT cdp.cust_id, cdp.dietician_id, cdp.diet_plan_id,dp.day,dp.meal_type,dp.calories,dp.proteins,dp.carbohydrates,dp.fat,cdp.diet_start_date
FROM diet_plan as cdp
JOIN diet_plan_details as dp
ON cdp.cust_id = dp.cust_id AND cdp.dietician_id = dp.dietician_id AND cdp.diet_plan_id = dp.diet_plan_id
WHERE diet_start_date <= ADDDATE(NOW(),INTERVAL 1 DAY) AND diet_start_date > SUBDATE(NOW(),INTERVAL 30 DAY);

SELECT * FROM customer_meal_plan;
SELECT SUBDATE(NOW(),INTERVAL 30 DAY);

-- To view current Diet Progress details for dietician enrolled customers
CREATE or replace VIEW c_diet_progress_details AS 
SELECT DISTINCT cdp.cust_ID,dpr.day,dpr.breakfast,dpr.lunch,dpr.dinner,dpr.additional_intake
FROM c_diet_plan_details as cdp
JOIN diet_progress as dpr
ON cdp.cust_id = dpr.cust_id AND cdp.dietician_id = dpr.dietician_id AND cdp.diet_plan_id = dpr.diet_plan_id AND cdp.day = dpr.day;


-- gives how many meals a customer still has in the current meal plan
CREATE OR REPLACE VIEW c_customer_remaining_meal_count AS
SELECT cm.cust_id,start_date, (mp.breakfast_count-COALESCE(curr_count.Breakfast_Count,0)) as "rem_breakfast_count", (mp.lunch_count- COALESCE(curr_count.Lunch_Count,0)) as "rem_lunch_count", (mp.dinner_count- COALESCE(curr_count.Dinner_Count,0)) as "rem_dinner_count"
FROM customer_meal_plan as cm
LEFT JOIN meal_plan as mp
ON cm.plan_ID = mp.plan_ID
        LEFT JOIN 
        (
			SELECT cust_id,MAX(CASE WHEN meal_type = 'Breakfast' THEN Order_Count --  Gives bf,lunch,din_count for each customer under current plan
						ELSE 0 END )as'Breakfast_Count',
                        MAX(CASE WHEN meal_type = 'Lunch' THEN Order_Count
						ELSE 0 END) as'Lunch_Count',
                        MAX(CASE WHEN meal_type = 'Dinner' THEN Order_Count
						ELSE 0 END) as'Dinner_Count',orders.Current_plan_Start_date
			FROM
				(
					SELECT c.cust_id,meal_type,c.Current_plan_Start_date,COUNT(meal_type) as 'Order_Count'
					FROM
					(
						SELECT cust_id,MAX(start_date) as "Current_plan_Start_date" -- to get current plan date for each customer 
						FROM customer_meal_plan
						WHERE start_date<NOW() AND start_date > SUBDATE(NOW(),INTERVAL 30 DAY)
						GROUP BY cust_id
                    ) as c
					LEFT JOIN orders as o
					ON o.cust_id = c.cust_id AND o.order_date>=c.Current_plan_Start_date
					LEFT JOIN item as i
					ON i.restaurant_Id = o.restaurant_Id AND i.item_name = o.item_name
					GROUP BY c.cust_id,meal_type,c.Current_plan_Start_date
				) as orders
              GROUP BY cust_id
              ) as curr_count
            
        ON curr_count.Current_plan_Start_date = cm.start_date AND curr_count.cust_id = cm.cust_id
        WHERE start_date<= ADDDATE(NOW(),INTERVAL 1 DAY) AND start_date > SUBDATE(NOW(),INTERVAL 30 DAY);
        
-- To extract the menu for customers depending on the diet, day and location
CREATE OR REPLACE VIEW c_menu_view AS
SELECT cust_id,name,email_id,cust_meal_plan.item_name,meal_type,calories,proteins,carbohydrates,fat,ifnull(avg_ratings,'No Ratings') Avg_ratings FROM (
SELECT c.cust_id,r.name,r.email_id,i.item_name,i.meal_type,i.calories,i.proteins,i.carbohydrates,i.fat
FROM customer AS c
       JOIN restaurant AS r ON c.location = r.location
       JOIN item AS i ON r.restaurant_id = i.restaurant_id
       JOIN restaurant_item_day AS rid
          ON     rid.restaurant_id = i.restaurant_id
             AND rid.item_name = i.item_name
       JOIN customer_meal_plan AS cmp ON cmp.cust_id = c.cust_id
       JOIN diet_plan AS cdp
          ON     cmp.cust_id = cdp.cust_id
             AND cmp.start_date = cdp.diet_start_date
       JOIN diet_plan_details AS dp
          ON     dp.cust_id = cdp.cust_id
             AND dp.dietician_id = cdp.dietician_id
             AND dp.diet_plan_id = cdp.diet_plan_id
       JOIN c_customer_remaining_meal_count AS crm1
          ON c.cust_id = crm1.cust_id AND rem_breakfast_count != 0
 WHERE     rid.day_of_week = DAYNAME(ADDDATE(NOW(), INTERVAL 1 DAY))
       AND i.meal_type = 'Breakfast'
       AND dp.day = DATEDIFF(NOW(), cdp.diet_start_date) + 2
       AND dp.meal_type = i.meal_type
       AND i.calories BETWEEN dp.calories - 30 AND dp.calories + 30
       AND i.carbohydrates BETWEEN dp.carbohydrates - 30
                               AND dp.carbohydrates + 30
       AND i.proteins BETWEEN dp.proteins - 30 AND dp.proteins + 30
       AND i.fat BETWEEN dp.fat - 30 AND dp.fat + 30
UNION ALL
SELECT c.cust_id,r.name,r.email_id,i.item_name,i.meal_type,i.calories,i.proteins,i.carbohydrates,i.fat
  FROM customer AS c
       JOIN restaurant AS r ON c.location = r.location
       JOIN item AS i ON r.restaurant_id = i.restaurant_id
       JOIN restaurant_item_day AS rid
          ON     rid.restaurant_id = i.restaurant_id
             AND rid.item_name = i.item_name
       JOIN customer_meal_plan AS cmp ON cmp.cust_id = c.cust_id
       JOIN diet_plan AS cdp
          ON     cmp.cust_id = cdp.cust_id
             AND cmp.start_date = cdp.diet_start_date
       JOIN diet_plan_details AS dp
          ON     dp.cust_id = cdp.cust_id
             AND dp.dietician_id = cdp.dietician_id
             AND dp.diet_plan_id = cdp.diet_plan_id
       JOIN c_customer_remaining_meal_count AS crm1
          ON c.cust_id = crm1.cust_id AND rem_lunch_count != 0
 WHERE     rid.day_of_week = DAYNAME(ADDDATE(NOW(), INTERVAL 1 DAY))
       AND i.meal_type = 'Lunch'
       AND dp.day = DATEDIFF(NOW(), cdp.diet_start_date) + 2
       AND dp.meal_type = i.meal_type
       AND i.calories BETWEEN dp.calories - 30 AND dp.calories + 30
       AND i.carbohydrates BETWEEN dp.carbohydrates - 30
                               AND dp.carbohydrates + 30
       AND i.proteins BETWEEN dp.proteins - 30 AND dp.proteins + 30
       AND i.fat BETWEEN dp.fat - 30 AND dp.fat + 30
UNION ALL
SELECT c.cust_id,r.name,r.email_id,i.item_name,i.meal_type,i.calories,i.proteins,i.carbohydrates,i.fat
  FROM customer AS c
       JOIN restaurant AS r ON c.location = r.location
       JOIN item AS i ON r.restaurant_id = i.restaurant_id
       JOIN restaurant_item_day AS rid
          ON     rid.restaurant_id = i.restaurant_id
             AND rid.item_name = i.item_name
       JOIN customer_meal_plan AS cmp ON cmp.cust_id = c.cust_id
       JOIN diet_plan AS cdp
          ON     cmp.cust_id = cdp.cust_id
             AND cmp.start_date = cdp.diet_start_date
       JOIN diet_plan_details AS dp
          ON     dp.cust_id = cdp.cust_id
             AND dp.dietician_id = cdp.dietician_id
             AND dp.diet_plan_id = cdp.diet_plan_id
       JOIN c_customer_remaining_meal_count AS crm1
          ON c.cust_id = crm1.cust_id AND rem_dinner_count != 0
 WHERE     rid.day_of_week = DAYNAME(ADDDATE(NOW(), INTERVAL 1 DAY))
       AND i.meal_type = 'Dinner'
       AND dp.day = DATEDIFF(NOW(), cdp.diet_start_date) + 2
       AND dp.meal_type = i.meal_type
       AND i.calories BETWEEN dp.calories - 30 AND dp.calories + 30
       AND i.carbohydrates BETWEEN dp.carbohydrates - 30
                               AND dp.carbohydrates + 30
       AND i.proteins BETWEEN dp.proteins - 30 AND dp.proteins + 30
       AND i.fat BETWEEN dp.fat - 30 AND dp.fat + 30
UNION ALL
SELECT c.cust_id,r.name,r.email_id,i.item_name,i.meal_type,i.calories,i.proteins,i.carbohydrates,i.fat
  FROM customer AS c
       JOIN restaurant AS r ON c.location = r.location
       JOIN item AS i ON i.restaurant_id = r.restaurant_id
       JOIN restaurant_item_day AS rid
          ON     i.restaurant_id = rid.restaurant_id
             AND i.item_name = rid.item_name
       JOIN c_customer_remaining_meal_count AS crm1
          ON c.cust_id = crm1.cust_id AND rem_breakfast_count != 0
 WHERE     rid.day_of_week = DAYNAME(ADDDATE(NOW(), INTERVAL 1 DAY))
       AND i.meal_type = 'Breakfast'
       AND c.cust_id NOT IN (SELECT DISTINCT (cust_id)
                               FROM c_diet_plan_details)
UNION ALL
SELECT c.cust_id,r.name,r.email_id,i.item_name,i.meal_type,i.calories,i.proteins,i.carbohydrates,i.fat
  FROM customer AS c
       JOIN restaurant AS r ON c.location = r.location
       JOIN item AS i ON i.restaurant_id = r.restaurant_id
       JOIN restaurant_item_day AS rid
          ON     i.restaurant_id = rid.restaurant_id
             AND i.item_name = rid.item_name
       JOIN c_customer_remaining_meal_count AS crm1
          ON c.cust_id = crm1.cust_id AND rem_lunch_count != 0
 WHERE     rid.day_of_week = DAYNAME(ADDDATE(NOW(), INTERVAL 1 DAY))
       AND i.meal_type = 'Lunch'
       AND c.cust_id NOT IN (SELECT DISTINCT (cust_id)
                               FROM c_diet_plan_details)
UNION ALL
SELECT c.cust_id,r.name,r.email_id,i.item_name,i.meal_type,i.calories,i.proteins,i.carbohydrates,i.fat
  FROM customer AS c
       JOIN restaurant AS r ON c.location = r.location
       JOIN item AS i ON i.restaurant_id = r.restaurant_id
       JOIN restaurant_item_day AS rid
          ON     i.restaurant_id = rid.restaurant_id
             AND i.item_name = rid.item_name
       JOIN c_customer_remaining_meal_count AS crm1
          ON c.cust_id = crm1.cust_id AND rem_dinner_count != 0
 WHERE     rid.day_of_week = DAYNAME(ADDDATE(NOW(), INTERVAL 1 DAY))
       AND i.meal_type = 'Dinner'
       AND c.cust_id NOT IN (SELECT DISTINCT (cust_id)
                               FROM c_diet_plan_details)) as cust_meal_plan
							left   join (select item_name,avg(rating) avg_ratings from item_ratings group by item_name ) ir
							on cust_meal_plan.item_name=ir.item_name
ORDER BY cust_id, meal_type;

 -- To get Customer Order History
CREATE OR REPLACE VIEW c_order_history_view AS 
SELECT o.cust_id,r.name,r.restaurant_id, o.item_name, meal_type, day_of_week, order_date,pickup_time
FROM orders as o
JOIN item as i
ON i.restaurant_id = o.restaurant_id AND i.item_name = o.item_name
JOIN restaurant_item_day as rid
ON rid.restaurant_id = i.restaurant_id AND rid.item_name = i.item_name AND rid.day_of_week = DAYNAME(ADDDATE(o.order_date,INTERVAL 1 DAY))
JOIN restaurant as r
ON r.restaurant_id = o.restaurant_id 
ORDER BY order_date DESC, pickup_time DESC;


-- To get list of previous diet plans
CREATE OR REPLACE VIEW c_diet_plan_list_view AS 
SELECT cdp.cust_id,d.dietician_name,cdp.dietician_id,diet_plan_id,d.qualification,cdp.diet_start_date
FROM diet_plan as cdp 
JOIN dietician as d
ON d.dietician_ID = cdp.dietician_ID
WHERE (cust_id,cdp.dietician_id,cdp.diet_plan_id) NOT IN
(SELECT DISTINCT cust_id,dietician_id,diet_plan_id
FROM c_diet_plan_details);

-- To get diet history details and progress

CREATE OR REPLACE VIEW c_diet_history_view AS 
SELECT cdp.cust_id,cdp.dietician_id,cdp.diet_plan_id, dp.day,dp.meal_type,dp.calories,dp.proteins,dp.carbohydrates,dp.fat,dpr.followed, dpr.additional_intake as'additional_intake'
FROM diet_plan as cdp 
JOIN diet_plan_details as dp
ON cdp.cust_id = dp.cust_id AND cdp.dietician_id = dp.dietician_id AND cdp.diet_plan_id = dp.diet_plan_id
LEFT JOIN (SELECT cust_id,dietician_id,diet_plan_id,day,breakfast as "Followed", 'Breakfast' as "Meal_Type",additional_intake
FROM diet_progress
UNION ALL 
SELECT cust_id,dietician_id,diet_plan_id,day,lunch, 'Lunch' as "Meal_Type",additional_intake
FROM diet_progress
UNION ALL 
SELECT cust_id,dietician_id,diet_plan_id,day,dinner, 'Dinner' as "Meal_Type",additional_intake
FROM diet_progress) as dpr
ON dpr.cust_id = dp.cust_id AND dpr.dietician_id = dp.dietician_id AND dpr.diet_plan_id = dp.diet_plan_id AND dpr.day = dp.day AND dpr.Meal_type = dp.Meal_Type
WHERE (cdp.cust_id,cdp.dietician_id, cdp.diet_plan_id) NOT IN
(SELECT  DISTINCT cust_id,dietician_id,diet_plan_id
FROM c_diet_plan_details);

-- To get Customer's enrolled dieticians list
CREATE OR REPLACE VIEW c_dietician_list_view AS 
SELECT cust_id, d.dietician_id,diet_start_date, dietician_name,experience,qualification
FROM diet_plan as c
JOIN dietician as d
ON c.dietician_id = d.dietician_id
ORDER BY diet_start_date DESC;




/* ******************************************************************** 
************************ Admin Module ****************************
***********************************************************************/
