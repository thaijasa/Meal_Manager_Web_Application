-- “SJSU CMPE 226 Spring 2019 TEAM2”

DROP DATABASE IF EXISTS mealmgr;

CREATE DATABASE mealmgr;

USE mealmgr;

CREATE TABLE customer
(
   cust_id      INT NOT NULL AUTO_INCREMENT,
   cust_name    VARCHAR(50) NOT NULL,
   dob          DATE NOT NULL,
   email_id     VARCHAR(50) NOT NULL,
   password     VARCHAR(50) NOT NULL,
   location     VARCHAR(50) NOT NULL,
   CONSTRAINT customers_pk PRIMARY KEY(cust_id),
   CONSTRAINT customers_uk UNIQUE KEY(email_id)
);


CREATE TABLE Meal_plan
(
   Plan_ID             INT NOT NULL AUTO_INCREMENT,
   Breakfast_Count     INT NOT NULL CHECK(Breakfast_Count >= 0),
   Lunch_Count         INT NOT NULL CHECK(Lunch_Count >= 0),
   Dinner_Count        INT NOT NULL CHECK(Dinner_Count >= 0),
   Dietician_Option    VARCHAR(50)
                         NOT NULL
                         CHECK(Dietician_Option IN ('Y', 'N')),
   price               DECIMAL(10, 3) NOT NULL CHECK(price > 0),
   CONSTRAINT Meal_plan_pk PRIMARY KEY(plan_id),
   CONSTRAINT Meal_plan_uk UNIQUE KEY(Breakfast_Count,
                                      Lunch_Count,
                                      Dinner_Count,
                                      Dietician_Option)
);

CREATE TABLE customer_meal_plan
(
   cust_id       INT NOT NULL,
   start_date    DATE NOT NULL,
   plan_id       INT NOT NULL,
   CONSTRAINT customer_meal_plan_pk PRIMARY KEY(cust_id, plan_id, start_date),
   CONSTRAINT customer_meal_plan_fk1 FOREIGN KEY(cust_id)
      REFERENCES customer (cust_ID) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT customer_meal_plan_fk2 FOREIGN KEY(plan_id)
      REFERENCES meal_plan (plan_id) ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE INDEX customer_meal_plan_idx1 ON customer_meal_plan (cust_ID, start_date);

CREATE TABLE Customer_Billing
(
   Cust_ID        INT NOT NULL,
   Start_Date     DATE NOT NULL,
   Card_number    BIGINT NOT NULL,
   card_type      VARCHAR(10) NOT NULL,
   pay_date       DATE NOT NULL,
   CONSTRAINT Customer_Billing_pk PRIMARY KEY(cust_id, start_date),
   CONSTRAINT Customer_Billing_fk FOREIGN KEY(Cust_ID,Start_Date)
      REFERENCES customer_meal_plan (cust_id,Start_Date) 
      ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE restaurant
(
   restaurant_id    INT NOT NULL AUTO_INCREMENT,
   name             VARCHAR(50) NOT NULL,
   email_id         VARCHAR(50) NOT NULL,
   password         VARCHAR(50) NOT NULL,
   location         VARCHAR(50) NOT NULL,
   CONSTRAINT restaurant_pk PRIMARY KEY(restaurant_id),
   CONSTRAINT restaurant_uk UNIQUE KEY(email_id)
);



CREATE TABLE Item
(
   Restaurant_ID    INT NOT NULL,
   Item_Name        VARCHAR(50) NOT NULL,
   Meal_Type        VARCHAR(10)
                      NOT NULL
                      CHECK(Meal_type IN ('Breakfast', 'Dinner', 'Lunch')),
   Calories         DECIMAL(6, 2) NOT NULL,
   Proteins         DECIMAL(5, 2) NOT NULL,
   Carbohydrates    DECIMAL(5, 2) NOT NULL,
   Fat              DECIMAL(5, 2) NOT NULL,
   offered_ind      VARCHAR(1)
                      NOT NULL
                      DEFAULT 'Y'
                      CHECK(offered_ind IN ('Y', 'N')),
   CONSTRAINT item_pk PRIMARY KEY(Restaurant_ID, Item_Name),
   CONSTRAINT item_restaurant_id_fk FOREIGN KEY(Restaurant_ID)
      REFERENCES restaurant (Restaurant_ID)
      ON UPDATE RESTRICT ON DELETE RESTRICT
);


CREATE TABLE dietician
(
   dietician_id      INT NOT NULL AUTO_INCREMENT,
   dietician_name    VARCHAR(50) NOT NULL,
   email_id          VARCHAR(50) NOT NULL,
   password          VARCHAR(50) NOT NULL,
   experience        DECIMAL(5, 2) NOT NULL,
   qualification     VARCHAR(50) NOT NULL,
   CONSTRAINT dietician_pk PRIMARY KEY(dietician_id),
   CONSTRAINT dietician_uk UNIQUE KEY(email_id)
);



CREATE TABLE restaurant_item_day
(
   Restaurant_ID    INT NOT NULL,
   Item_Name        VARCHAR(50) NOT NULL,
   day_of_week      VARCHAR(10)
                      NOT NULL
                      CHECK
                         (day_of_week in ('Monday',
                                      'Tuesday',
                                      'Wednesday',
                                      'Thursday',
                                      'Friday',
                                      'Saturday',
                                      'Sunday')),
   CONSTRAINT restaurant_item_day_pk PRIMARY KEY
      (Restaurant_ID, Item_Name, day_of_week),
   CONSTRAINT restaurant_item_day_fk FOREIGN KEY(restaurant_id, Item_Name)
      REFERENCES item (restaurant_id, Item_Name)
      ON UPDATE CASCADE ON DELETE CASCADE
);



CREATE TABLE diet_plan
(
   cust_ID              INT NOT NULL,
   dietician_ID         INT NOT NULL,
   diet_plan_id         INT NOT NULL,
   diet_start_date        DATE NOT NULL,
   new_diet_plan_ind    VARCHAR(1)
                          NOT NULL
                          DEFAULT 'Y'
                          CHECK(new_diet_plan_ind IN ('Y', 'N')),
   activity_level       VARCHAR(10),
   weight               DECIMAL(6, 2) CHECK(weight > 0),
   sleep                INT CHECK(sleep >= 0),
   height               DECIMAL(5, 2) CHECK(height > 0),
   CONSTRAINT diet_plan_pk PRIMARY KEY(cust_ID, dietician_ID, diet_plan_id),
   CONSTRAINT diet_plan_fk1 FOREIGN KEY(cust_ID,diet_start_date)
      REFERENCES customer_meal_plan (cust_ID,start_date)
      ON UPDATE CASCADE ON DELETE CASCADE,
   CONSTRAINT diet_plan_fk2 FOREIGN KEY(dietician_ID)
      REFERENCES dietician (dietician_ID)
      ON UPDATE CASCADE ON DELETE CASCADE
);



CREATE TABLE diet_plan_details
(
   cust_ID          INT NOT NULL,
   dietician_ID     INT NOT NULL,
   diet_plan_id     INT NOT NULL,
   day              INT NOT NULL,
   meal_type        VARCHAR(10)
                      NOT NULL
                      CHECK(Meal_type IN ('Breakfast', 'Dinner', 'Lunch')),
   calories         DECIMAL(6, 2) NOT NULL,
   proteins         DECIMAL(5, 2) NOT NULL,
   carbohydrates    DECIMAL(5, 2) NOT NULL,
   fat              DECIMAL(5, 2) NOT NULL,
   CONSTRAINT diet_plan_details_pk PRIMARY KEY(cust_ID,
                                               dietician_ID,
                                               diet_plan_id,
                                               day,
                                               meal_type),
   CONSTRAINT diet_plan_details_fk FOREIGN KEY
      (cust_ID, dietician_ID, diet_plan_id)
      REFERENCES diet_plan (cust_ID, dietician_ID, diet_plan_id)
      ON UPDATE CASCADE ON DELETE CASCADE
);



CREATE TABLE allergy
(
   cust_ID         INT NOT NULL,
   dietician_ID    INT NOT NULL,
   diet_plan_id    INT NOT NULL,
   allergy         VARCHAR(30),
   CONSTRAINT allergy_pk PRIMARY KEY(cust_ID,
                                     dietician_ID,
                                     diet_plan_id,
                                     allergy),
   CONSTRAINT allergy_fk FOREIGN KEY(cust_ID, dietician_ID, diet_plan_id)
      REFERENCES diet_plan (cust_ID, dietician_ID, diet_plan_id)
      ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE disease
(
   cust_ID         INT NOT NULL,
   dietician_ID    INT NOT NULL,
   diet_plan_id    INT NOT NULL,
   disease         VARCHAR(30),
   CONSTRAINT disese_pk PRIMARY KEY(cust_ID,
                                    dietician_ID,
                                    diet_plan_id,
                                    disease),
   CONSTRAINT disease_fk FOREIGN KEY(cust_ID, dietician_ID, diet_plan_id)
      REFERENCES diet_plan (cust_ID, dietician_ID, diet_plan_id)
      ON UPDATE CASCADE ON DELETE CASCADE
);



CREATE TABLE diet_progress
(
   cust_ID              INT NOT NULL,
   dietician_ID         INT NOT NULL,
   diet_plan_id         INT NOT NULL,
   day                  INT NOT NULL,
   breakfast            VARCHAR(1) NOT NULL CHECK(breakfast IN ('Y', 'N')),
   lunch                VARCHAR(1) NOT NULL CHECK(lunch IN ('Y', 'N')),
   dinner               VARCHAR(1) NOT NULL CHECK(dinner IN ('Y', 'N')),
   additional_intake    VARCHAR(20),
   CONSTRAINT diet_progress_pk PRIMARY KEY(cust_ID,
                                           dietician_ID,
                                           diet_plan_id,
                                           day),
   CONSTRAINT diet_progress_fk FOREIGN KEY
      (cust_ID, dietician_ID, diet_plan_id)
      REFERENCES diet_plan (cust_ID, dietician_ID, diet_plan_id)
      ON UPDATE CASCADE ON DELETE CASCADE
);



CREATE TABLE customer_requests
(
   cust_ID                    INT NOT NULL,
   dietician_ID               INT NOT NULL,
   diet_plan_id               INT NOT NULL,
   request_initiation_date    DATE NOT NULL,
   request_content            VARCHAR(50) NOT NULL,
   update_diet_plan_ind       VARCHAR(1)
                                NOT NULL
                                DEFAULT 'Y'
                                CHECK(update_diet_plan_ind IN ('Y', 'N')),
   CONSTRAINT customer_requests_pk PRIMARY KEY
      (cust_ID, dietician_ID, diet_plan_id),
   CONSTRAINT customer_requests_fk FOREIGN KEY
      (cust_ID, dietician_ID, diet_plan_id)
      REFERENCES diet_plan (cust_ID, dietician_ID, diet_plan_id)
      ON UPDATE CASCADE ON DELETE CASCADE
);



CREATE TABLE orders
(
   cust_ID          INT,
   Restaurant_ID    INT NOT NULL,
   Item_Name        VARCHAR(50) NOT NULL,
   order_date       DATE,
   pickup_time      TIME NOT NULL,
   CONSTRAINT order_pk PRIMARY KEY(cust_ID,
                                   Restaurant_ID,
                                   Item_Name,
                                   order_date),
   CONSTRAINT orders_fk FOREIGN KEY(cust_ID) REFERENCES customer (cust_ID),
   CONSTRAINT orders_fk2 FOREIGN KEY(Restaurant_ID, Item_Name)
      REFERENCES item (Restaurant_ID, Item_Name)
      ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE item_ratings
(
   cust_ID          INT,
   Restaurant_ID    INT NOT NULL,
   Item_Name        VARCHAR(50) NOT NULL,
   rating           INT CHECK(rating BETWEEN 0 AND 5),
   CONSTRAINT item_ratings_pk PRIMARY KEY(cust_ID, Restaurant_ID, Item_Name),
   CONSTRAINT item_ratings_fk FOREIGN KEY(cust_ID)
      REFERENCES customer (cust_ID)
      ON UPDATE CASCADE ON DELETE CASCADE,
   CONSTRAINT item_ratings_fk1 FOREIGN KEY(Restaurant_ID, Item_Name)
      REFERENCES item (Restaurant_ID, Item_Name)
      ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE dietician_ratings
(
   cust_ID         INT,
   dietician_ID    INT,
   rating          INT CHECK(rating BETWEEN 0 AND 5),
   CONSTRAINT dietician_ratings_pk PRIMARY KEY(cust_ID, dietician_ID),
   CONSTRAINT dietician_ratings_fk1 FOREIGN KEY(cust_ID)
      REFERENCES customer (cust_ID)
      ON UPDATE CASCADE ON DELETE CASCADE,
   CONSTRAINT dietician_ratings_fk2 FOREIGN KEY(dietician_ID)
      REFERENCES dietician (dietician_ID)
      ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE adminn (
    admin_email VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL,
    CONSTRAINT admin_pk PRIMARY KEY (admin_email)
);


ALTER TABLE customer AUTO_INCREMENT = 50000;
ALTER TABLE dietician AUTO_INCREMENT = 10000;
ALTER TABLE restaurant AUTO_INCREMENT = 1000;
ALTER TABLE  Meal_plan  AUTO_INCREMENT = 1;