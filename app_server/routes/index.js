// �SJSU CMPE 226 Spring 2019 TEAM2�

var express = require('express');
var router = express.Router();
var ctrlMain = require("../controllers/main");


router.get('/', ctrlMain.index);


/* ******************************************************************** 
************************ Dietician Module ****************************
***********************************************************************/

router.get('/dieticianlogin', ctrlMain.d_get_login);
router.get('/d_logout', ctrlMain.d_get_logout);
router.get('/d_home', ctrlMain.d_get_home);
router.post('/d_home', ctrlMain.d_post_home);
router.get('/d_view_current_customers', ctrlMain.d_get_view_current_customers);
router.post('/d_customer_diet_plan_list', ctrlMain.d_customer_diet_plan_list);
router.post('/d_customer_diet_plan_progress', ctrlMain.d_customer_diet_plan_progress);
router.get('/d_new_diet_plan_requests', ctrlMain.d_new_diet_plan_requests);
router.post('/d_new_diet_plan_details', ctrlMain.d_new_diet_plan_details);
router.post('/d_add_diet_plan_details', ctrlMain.d_add_diet_plan_details);
router.post('/d_add_diet_plan_details_submit', ctrlMain.d_add_diet_plan_details_submit);
router.get('/d_update_diet_plan_requests', ctrlMain.d_update_diet_plan_requests);
router.post('/d_update_diet_plan_details', ctrlMain.d_update_diet_plan_details);
router.post('/d_update_diet_plan_details_form', ctrlMain.d_update_diet_plan_details_form);
router.post('/d_update_diet_plan_details_submit', ctrlMain.d_update_diet_plan_details_submit);
router.post('/d_finalize_new_diet_plan', ctrlMain.d_finalize_new_diet_plan);
router.post('/d_finalize_update_diet_plan', ctrlMain.d_finalize_update_diet_plan);




/* ******************************************************************** 
************************ Restaurant Module ****************************
***********************************************************************/
router.get('/restaurantlogin', ctrlMain.r_get_login_form);
router.get('/r_logout', ctrlMain.r_get_logout);
router.get('/r_home', ctrlMain.r_get_home);
router.post('/r_home', ctrlMain.r_post_home);
router.get('/r_view_menu', ctrlMain.r_get_view_menu);
router.get('/r_add_menu_items_form', ctrlMain.r_add_menu_items_form);
router.post('/r_add_menu_items', ctrlMain.r_add_menu_items);



router.get('/r_view_todays_orders', ctrlMain.r_view_todays_orders);
router.get('/r_view_tomos_orders', ctrlMain.r_view_tomos_orders);
router.get('/r_update_menu', ctrlMain.r_update_menu);
router.get('/r_view_report', ctrlMain.r_view_report);
router.post('/r_generated_report', ctrlMain.r_generated_report);
router.post('/updatemenupage', ctrlMain.r_post_update_menu_page);
//router.post('/updatemenupagesuccessful', ctrlMain.r_post_update_menupage_successful);
// router.post('/updatemenusuccessful', ctrlMain.r_post_update_menupage_successful);
router.post('/updatemenupagedays',ctrlMain.r_post_updatemenupagedays)

/* ******************************************************************** 
************************ Customer Module ****************************
***********************************************************************/

router.get('/customerlogin', ctrlMain.c_get_customer_login);
router.get('/customerlogout', ctrlMain.c_get_customer_logout);
router.get('/errorpage', ctrlMain.c_get_error_page);
router.get('/customerhome', ctrlMain.c_get_customer_home);
router.post('/customerhome', ctrlMain.c_post_customer_home);
router.post('/startDateLate', ctrlMain.c_post_start_date_page);
router.get('/checkmenu', ctrlMain.c_get_check_menu);
router.post('/orderconfirmation',ctrlMain.c_order_confirmation);
router.get('/vieworderhistory',ctrlMain.c_get_order_history);
router.get('/viewdietplan', ctrlMain.c_get_diet_plan);
router.get('/reqchangedp', ctrlMain.c_request_change_diet_plan);
router.post('/requestconfirmation', ctrlMain.c_post_request_confirmation);
router.get('/viewdietprogress', ctrlMain.c_get_diet_progress);
router.get('/updatedietprogress', ctrlMain.c_update_diet_progress);
router.post('/updateconfirmation', ctrlMain.c_post_update_confirmation);
router.get('/viewdiethistory', ctrlMain.c_get_diet_history);
router.post('/viewdiethistorydetails', ctrlMain.c_get_diet_history_details);
router.get('/itemrating', ctrlMain.c_get_item_rating);
router.post('/itemratingconfirmation', ctrlMain.c_post_item_rating_confirmation);
router.get('/dieticianrating', ctrlMain.c_get_dietician_rating);
router.post('/dieticianratingconfirmation', ctrlMain.c_post_dietician_rating_confirmation);

/********************************* Reg_Customer**************************************/

router.get('/customerregistration', ctrlMain.c_get_customer_registration);
router.post('/customerlogin', ctrlMain.c_post_customer_login);
router.post('/dieticianOption', ctrlMain.c_d_dieticianOption);
router.get('/dieticianyes', ctrlMain.c_d_dieticianYes);
router.get('/dieticianno', ctrlMain.c_d_dieticianNo);
router.post('/yespaymentsuccessful', ctrlMain.d_yes_details);
router.post('/nopaymentsuccessful', ctrlMain.d_no_details);


/* ******************************************************************** 
************************ Admin Module ****************************
***********************************************************************/

//ADMIN
router.get('/adminlogin', ctrlMain.a_get_admin_login);
router.post('/adminhome', ctrlMain.a_post_admin_home);
router.get('/adminhome', ctrlMain.a_get_admin_home);
router.get('/adminlogout', ctrlMain.c_get_admin_logout);

//REGISTER DIETICIAN
router.get('/registerdietician', ctrlMain.d_get_dietician_registration);
router.post('/regdietsuccesful', ctrlMain.d_post_regdietsuccesful);

//REGISTER RESTAURANT
router.get('/registerrestaurant', ctrlMain.r_get_restaurant_registration);
router.post('/regrestsuccesful', ctrlMain.r_post_restaurant_registration);

//ERROR PAGES
router.get('loginfail', ctrlMain.login_fail);
router.get('/errorpage', ctrlMain.error_page);
router.get('/registrationfail', ctrlMain.registration_fail);


router.get('/contactform', ctrlMain.get_contactform);
router.post('/update_contactform', ctrlMain.update_contactform);
router.get('/get_contactform_message_names', ctrlMain.get_contactform_message_names);
router.post('/contactidallmessages', ctrlMain.get_contactidallmessages);


module.exports = router;


