// �SJSU CMPE 226 Spring 2019 TEAM2�

var lineReader = require('line-reader');
var fs = require('fs');
var mysql = require('mysql');
var sleep = require('sleep');
var log4js = require('log4js');
var log = log4js.getLogger(); 
// Mysql Connection
function createMySqlConnection() {
//change password
	var mysql_connection = mysql.createConnection({
		host : "localhost",
		user : "root",
		password : "mysore_1992", 
		database : 'mealmgr',
		multipleStatements : true

	});
	mysql_connection.connect(function(err) {
		if (err)
			throw err;

	});
	return mysql_connection;
}


// logger
log4js.configure({
  appenders: { app: { type: 'file', filename: 'log/info.txt' } },
  categories: { default: { appenders: ['app'], level: 'ALL' } }
})


// var session = require('client-sessions');
var cookieParser = require('cookie-parser');
// Index Page
module.exports.index = function(req, res, next) {
	sendPage('./public/index.html', res);
};


// Check if user is logged in
function checkIfLoggedIn(request) {
	return request.session.loggedin;
}
// Check if object is empty
function isEmpty(obj) {
	for ( var key in obj) {
		if (obj.hasOwnProperty(key))
			return false;
	}
	return true;
}

/*
 * GET home page.
 */
module.exports.index = function(req, res, next) 
{
    sendPage('./public/index.html', res);
};


/*******************************************************************************
 * *********************** Dietician Module ****************************
 ******************************************************************************/


module.exports.d_get_login = function (request, result) {
  log.info('Received Request to d_get_login for dietician_id = ' + request.session.dietician_id)
  log.info('sending Response dieticianlogin page')

  result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
}

function func_d_check_login_info (request, result) {
  var query_results = ''
  var v_dietician_email_id = request.body.userid
  var v_password = request.body.pwd
  var v_dietician_login_check = 0

  log.info('Calling MySQL DB procedure d_check_dietician_login_info for checking login info ')
  createMySqlConnection().query(
    "SET @v_count = 0,@v_dietician_id=0; CALL d_check_dietician_login_info('" +
      v_dietician_email_id +
      "','" +
      v_password +
      "', @v_count,@v_dietician_id); SELECT @v_count,@v_dietician_id;",
    function (err, query_results, fields) {
      if (err) {
        log.error('DB Error while checking the dietician credentials')
        log.error(err)
        return (
          result.redirect('dieticianlogin'), { message: 'We are facing unexpected issues. Please try again later!' }
        )
      }
      log.info('Got response from MySQL')
      log.info('Got response MySQL DB procedure d_check_dietician_login_info for checking login info ')

      v_dietician_login_check = query_results[2][0]['@v_count']
      v_dietician_id = query_results[2][0]['@v_dietician_id']

      if (v_dietician_login_check == 1) {
        log.info('Response sending as d_home page for dietician_id = ' + request.session.dietician_id)

        request.session.dietician_id = v_dietician_id
        request.session.dietician_email = v_dietician_email_id
        request.session.loggedin = 'Yes'
        result.render('d_home', {
          dietician_id: v_dietician_id,
          dietician_email: v_dietician_email_id
        })
      } else if (v_dietician_login_check == 0) {
        log.info('sending Response dieticianlogin page for invalid credentials')

        result.render('dieticianlogin', { message: 'Invalid Credentials! Please Enter Correct Userid and Password! ' })
      } else {
        log.info('sending Response dieticianlogin page for DB issues')

        result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' })
      }
    }
  )
  createMySqlConnection().end()
}

function func_d_get_home (request, result) {
  log.info(
    'Sending Response d_home for dietician logged in successfully with dietician_id = ' + request.session.dietician_id
  );
  result.render('d_home', {
    dietician_id: request.session.dietician_id,
    dietician_email: request.session.dietician_email
  });

}
module.exports.d_post_home = function (request, result) {
  log.info('Received Request for d_post_home - dietician trying to login with emailid = ' + request.body.userid)
  func_d_check_login_info(request, result)
}

module.exports.d_get_home = function (request, result) {
  log.info('Received Request for dietician home page for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_get_home(request, result)
  } else {
    result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}
function func_d_get_logout (request, result) {
  request.session.destroy(function (err) {
    if (err) {
      return next(err)
    } else {
      return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
    }
  })
}

module.exports.d_get_logout = function (request, result) {
  var dietician_v = request.session.dietician_id
  log.info('Received Request for d_get_logout for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_get_logout(request, result)
    log.info('Dietician logged out succesfully for dietician_id = ' + dietician_v)
  } else {
    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}

// Dietician - view customers
function func_d_get_view_current_customers (request, result) {
  var query_stmnt =
    'SELECT  dietician_id,cust_id,cust_name,diet_start_date, new_diet_plan_request_date FROM d_dietician_customers_view where dietician_id=' +
    request.session.dietician_id +
    ' and curdate()<=DATE_ADD(diet_start_date, INTERVAL 30 DAY)'
  var query_results = ''

  log.info('Calling MySQL to get response to d_dietician_customers_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to d_dietician_customers_view view query  ')

    if (isEmpty(query_results)) {
      // Object is empty (Would return true in this example)
      log.info(
        'Response Sending as d_view_current_customers page without customers for dietician_id = ' +
          request.session.dietician_id
      );
      result.render('d_view_current_customers', {
        customers_present: 'N',
        query_results: 'No_Customers',
        dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email
      });

    } else {
      log.info(
        'Response Sending as d_view_current_customers page with customers for dietician_id = ' +
          request.session.dietician_id
      );
      result.render('d_view_current_customers', {
        customers_present: 'Y',
        query_results: query_results,
        dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email
      })

    }
  })

  createMySqlConnection().end()
}

module.exports.d_get_view_current_customers = function (request, result) {
  log.info('Received Request to d_get_view_current_customers for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_get_view_current_customers(request, result)
  } else {
    log.info('Sending dieticianlogin page as user was not logged in');

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' });
  }
}

function func_d_get_customer_details (request, result) {
  var query_results = ''
  var query_stmnt = 'SELECT cust_id,cust_name,dob,email_id,location FROM customer where cust_id=' + request.body.cust_id
  console.log(query_stmnt)
  log.info('Calling MySQL to get response to customer query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to customer query  ')

    request.session.cust_details = query_results
  })

  createMySqlConnection().end()
}
function func_d_get_customer_diet_plan_list (request, result) {
  request.session.cust_id = request.body.cust_id
  func_d_get_customer_details(request, result)

  var query_results = ''
  var query_stmnt =
    "SELECT concat(cust_id,';',diet_start_date) custid_dietstartdate,dietician_id,cust_id,diet_start_date,new_diet_plan_request_date FROM d_customer_diet_plans_list_view where cust_id=" +
    request.session.cust_id +
    " order by diet_start_date"
  console.log(query_stmnt)
  log.info('Calling MySQL to get response to d_customer_diet_plans_list_view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    else{
    log.info('Got MySQL response to d_customer_diet_plans_list_view query  ')

    if (isEmpty(query_results)) {
      log.info(
        'Response Sending as d_customer_diet_plan_list page with no diet plans list for dietician_id = ' +
          request.session.dietician_id
      );
      result.render('d_customer_diet_plan_list', {
        dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email,
        cust_details: request.session.cust_details,
        cust_id: request.session.cust_id,
        diet_plans_present: 'N',
        query_results: 'No_DietPlans'
      });
      
    } else {
      log.info(
        'Response Sending as d_customer_diet_plan_list page with diet plans list for dietician_id = ' +
          request.session.dietician_id
      );
      result.render('d_customer_diet_plan_list', {
        dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email,
        cust_details: request.session.cust_details,
        cust_id: request.session.cust_id,
        diet_plans_present: 'Y',
        query_results: query_results
      })

    }}
  })

  createMySqlConnection().end()
}

module.exports.d_customer_diet_plan_list = function (request, result) {
  log.info('Received Request to d_customer_diet_plan_list for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_get_customer_diet_plan_list(request, result)
  } else {
    log.info('Sending dieticianlogin page as user was not logged in');

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' });
  }
}

function func_d_customer_diet_plan_progress (request, result) {
  request.session.custid_dietstartdate = request.body.custid_dietstartdate
  var query_results = ''
  var query_stmnt =
    "select concat(cust_id,';',diet_start_date) custid_dietstartdate,diet_start_date,day, calendar_date, meal_type,calories, proteins, carbohydrates, fat,diet_followed,additional_intake from d_customer_dietplan_progress_view where  concat(cust_id,';',diet_start_date)='" +
    request.session.custid_dietstartdate +
    "' order by calendar_date, day, FIELD(meal_type, 'Breakfast', 'Lunch', 'Dinner',null)"
  console.log(query_stmnt)
  log.info('Calling MySQL to get response to d_customer_dietplan_progress_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to d_customer_dietplan_progress_view view query  ')

    if (isEmpty(query_results)) {
      // Object is empty (Would return true in this example)
      log.info(
        'Response Sending as d_customer_diet_plan_progress page with no plan progress for dietician_id = ' +
          request.session.dietician_id
      );
      result.render('d_customer_diet_plan_progress', {
        dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email,
        cust_details: request.session.cust_details,
        diet_start_date: request.session.diet_start_date,
        cust_id: request.session.cust_id,
        custid_dietstartdate: request.session.custid_dietstartdate,
        diet_plan_progress_present: 'N',
        query_results: 'No_Diet_Plan_Progress'
      });
      
    } else {
      log.info(
        'Response Sending as d_customer_diet_plan_progress page with plan progress for dietician_id = ' +
          request.session.dietician_id
      );
      result.render('d_customer_diet_plan_progress', {
        dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email,
        cust_details: request.session.cust_details,
        cust_id: request.session.cust_id,
        diet_start_date: request.session.diet_start_date,
        custid_dietstartdate: request.session.custid_dietstartdate,
        diet_plan_progress_present: 'Y',
        query_results: query_results
      })

    }
  })

  createMySqlConnection().end()
}

module.exports.d_customer_diet_plan_progress = function (request, result) {
  log.info('Received Request to d_customer_diet_plan_progress for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_customer_diet_plan_progress(request, result)
  } else {
    log.info('Sending dieticianlogin page as user was not logged in');

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}

function func_d_new_diet_plan_requests (request, result) {
  var query_results = ''
  var query_stmnt =
    "SELECT   dietician_id,concat(cust_id,';',diet_start_date) custid_dietstartdate,cust_id, cust_name,cust_email_id, diet_start_date, new_diet_plan_request_date,new_diet_plan_ind FROM d_customer_diet_plans_list_view where new_diet_plan_ind='Y' and dietician_id=" +
    request.session.dietician_id +
    ' and diet_start_date>=now() order by diet_start_date'
  log.info('Calling MySQL to get response to d_customer_diet_plans_list_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to d_customer_diet_plans_list_view view query  ');

    if (isEmpty(query_results)) {
      // Object is empty (Would return true in this example)
      log.info(
        'Response Sent as d_new_diet_plan_requests page with no new diet plan requests for dietician_id = ' +
          request.session.dietician_id
      );
      result.render('d_new_diet_plan_requests', {
        dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email,
        cust_details: request.session.cust_details,
        custid_dietstartdate: request.session.custid_dietstartdate,
        new_diet_plan_requests: 'N',
        query_results: 'No_New_Diet_Plan_Requests'
      });
     
    } else {
      log.info(
        'Response Sent as d_new_diet_plan_requests page with diet plan requests for dietician_id = ' +
          request.session.dietician_id
      );
      result.render('d_new_diet_plan_requests', {
        dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email,
        cust_details: request.session.cust_details,
        custid_dietstartdate: request.session.custid_dietstartdate,
        new_diet_plan_requests: 'Y',
        query_results: query_results
      });
      
    }
  })

  createMySqlConnection().end()
}

module.exports.d_new_diet_plan_requests = function (request, result) {
  log.info('Received Request to d_new_diet_plan_requests for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_new_diet_plan_requests(request, result);
  } else {
    log.info('Sent dieticianlogin page as user was not logged in');

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' });
  }
}
function func_d_get_cust_health_details_from_cust_diet_startdate (request, result) {
	var query_results = ''
  var query_stmnt =
    "select concat(cust_id,';',diet_start_date) custid_dietstartdate,dietician_id,cust_id,cust_name,cust_email_id,diet_start_date,new_diet_plan_request_date,cust_age,height,activity_level,sleep,a_d_type,allergy_disease from d_diet_plans_cust_health_details_view where concat(cust_id,';',diet_start_date) ='" +
    request.body.custid_dietstartdate +
    "' order by a_d_type"
  console.log(query_stmnt)
  log.info('Calling MySQL to get response to d_diet_plans_cust_health_details_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while get d_diet_plans_cust_health_details_view details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to d_diet_plans_cust_health_details_view view query  ')

		request.session.cust_health_details = query_results;
		console.log(request.session.cust_health_details);
  })

  createMySqlConnection().end()
}
function func_d_get_cust_details_from_cust_diet_startdate (request, result) {
	func_d_get_cust_health_details_from_cust_diet_startdate (request, result);
	var query_results = ''
  var query_stmnt =
    "select concat(cust_id,';',diet_start_date) custid_dietstartdate,dietician_id,cust_id,cust_name,cust_email_id,diet_start_date,new_diet_plan_request_date,cust_age,height,activity_level,sleep from d_customer_diet_plans_list_view where concat(cust_id,';',diet_start_date) ='" +
    request.body.custid_dietstartdate +
    "'"
  console.log(query_stmnt)
  log.info('Calling MySQL to get response to d_customer_diet_plans_list_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while getting d_customer_diet_plans_list_view details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to d_customer_diet_plans_list_view view query  ')

    request.session.cust_details = query_results
  })

  createMySqlConnection().end()
}
function func_d_new_diet_plan_details (request, result) {
  func_d_get_cust_details_from_cust_diet_startdate(request, result)
  request.session.custid_dietstartdate = request.body.custid_dietstartdate
  request.session.cust_id = request.body.cust_id

  var query_results = ''
  var query_stmnt =
    "select concat(cust_id,';',diet_start_date) custid_dietstartdate, cust_id,dietician_id, diet_start_date, day,  calendar_date, meal_type,new_diet_plan_ind,calories,proteins,carbohydrates,fat  from d_customer_diet_plan_details_view where concat(cust_id,';',diet_start_date)  ='" +
    request.session.custid_dietstartdate +
    "' order by day, FIELD(meal_type, 'Breakfast', 'Lunch', 'Dinner',null)"

  log.info('Calling MySQL to get response to d_customer_diet_plan_details_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to d_customer_diet_plan_details_view view query  ')
    log.info('Response Sent as d_new_diet_plan_details page for dietician_id = ' + request.session.dietician_id)

    result.render('d_new_diet_plan_details', {
      dietician_id: request.session.dietician_id,
      dietician_email: request.session.dietician_email,
			cust_details: request.session.cust_details,
			cust_health_details:request.session.cust_health_details,
      custid_dietstartdate: request.session.custid_dietstartdate,
      query_results: query_results, message:"Diet Plan Details"
    })
  })

  createMySqlConnection().end()
}

module.exports.d_new_diet_plan_details = function (request, result) {
  log.info('Received Request to d_new_diet_plan_details for dietician_id = ' + request.session.dietician_id)

  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_new_diet_plan_details(request, result)
  } else {
    log.info('Sent dieticianlogin page as user was not logged in')

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}

function func_d_add_diet_plan_details (request, result) {
  var query_results = ''
  request.session.diet_day = request.body.diet_day

  var query_stmnt =
    "select concat(cust_id,';',diet_start_date) custid_dietstartdate, cust_id,dietician_id, diet_start_date, day,  calendar_date, meal_type, meal_type,new_diet_plan_ind,calories,proteins,carbohydrates,fat  from d_customer_diet_plan_details_view where concat(cust_id,';',diet_start_date)='" +
    request.session.custid_dietstartdate +
    "' and day= " +
    request.session.diet_day +
    " order by day, FIELD(meal_type, 'Breakfast', 'Lunch', 'Dinner',null)"
  console.log(query_stmnt)
  log.info('Calling MySQL to get response to d_customer_diet_plan_details_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to d_customer_diet_plan_details_view view query  ')
    log.info('Response Sent as d_add_diet_plan_details page for dietician_id = ' + request.session.dietician_id)

    result.render('d_add_diet_plan_details', {
      dietician_id: request.session.dietician_id,
      dietician_email: request.session.dietician_email,
			cust_details: request.session.cust_details,
			cust_health_details: request.session.cust_health_details,

      custid_dietstartdate: request.session.custid_dietstartdate,
      diet_day: request.session.diet_day,
      query_results: query_results,message:"Diet Plan Details"
    })
  })

  createMySqlConnection().end()
}

module.exports.d_add_diet_plan_details = function (request, result) {
  log.info('Received Request to d_add_diet_plan_details for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_add_diet_plan_details(request, result)
  } else {
    log.info('Sent dieticianlogin page as user was not logged in')

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}

function func_d_add_diet_plan_details_to_db (request, result) {
  var query_stmnt =
    'SET @v_result = 0; CALL d_add_diet_details(' +
    "'" +
    request.session.custid_dietstartdate +
    "'" +
    ',' +
    request.session.diet_day +
    ',' +
    request.body.breakfast_calories +
    ',' +
    request.body.breakfast_proteins +
    ',' +
    request.body.breakfast_carbohydrates +
    ',' +
    request.body.breakfast_fat +
    ',' +
    request.body.lunch_calories +
    ',' +
    request.body.lunch_proteins +
    ',' +
    request.body.lunch_carbohydrates +
    ',' +
    request.body.lunch_fat +
    ',' +
    request.body.dinner_calories +
    ',' +
    request.body.dinner_proteins +
    ',' +
    request.body.dinner_carbohydrates +
    ',' +
    request.body.dinner_fat +
    ' , @v_result); SELECT @v_result;'

  console.log(query_stmnt)
  log.info('Calling MySQL procedure d_add_diet_details  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got response to MySQL procedure d_add_diet_details  ')

    v_result = query_results[2][0]['@v_result']

    if (v_result == 1) {
      func_d_add_diet_plan_details_submit(request, result)
    }
  })
  createMySqlConnection().end()
}

function func_d_add_diet_plan_details_submit (request, result) {
  var query_results = ''
  var query_stmnt =
    "select concat(cust_id,';',diet_start_date) custid_dietstartdate, cust_id,dietician_id, diet_start_date, day,  calendar_date, meal_type,new_diet_plan_ind,calories,proteins,carbohydrates,fat  from d_customer_diet_plan_details_view where concat(cust_id,';',diet_start_date)= '" +
    request.session.custid_dietstartdate +
    "' order by day, FIELD(meal_type, 'Breakfast', 'Lunch', 'Dinner',null)"
  console.log(query_stmnt)
  log.info('Calling MySQL to get response to d_customer_diet_plan_details_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to d_customer_diet_plan_details_view view query  ')
    log.info('Response Sent as d_add_diet_plan_details page for dietician_id = ' + request.session.dietician_id)

    result.render('d_new_diet_plan_details', {
      dietician_id: request.session.dietician_id,
      dietician_email: request.session.dietician_email,
			cust_details: request.session.cust_details,
			cust_health_details: request.session.cust_health_details,

      custid_dietstartdate: request.session.custid_dietstartdate,
      query_results: query_results,message:"Diet Plan Details Added Successfully!"
    })
  })

  createMySqlConnection().end()
}

module.exports.d_add_diet_plan_details_submit = function (request, result) {
  log.info('Received Request to d_add_diet_plan_details_submit for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_add_diet_plan_details_to_db(request, result)
  } else {
    log.info('Sent dieticianlogin page as user was not logged in')

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}

function func_d_update_diet_plan_requests (request, result) {
  var query_results = ''
  var query_stmnt =
    "SELECT   dietician_id,concat(cust_id,';',diet_start_date) custid_dietstartdate,cust_id, cust_name,cust_email_id, diet_start_date, diet_plan_update_start_date,request_content FROM d_update_diet_plans_list_view where dietician_id=" +
    request.session.dietician_id +
    ' order by diet_plan_update_start_date'
  console.log(query_stmnt)
  log.info('Calling MySQL to get response to d_update_diet_plans_list_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Calling MySQL response to d_update_diet_plans_list_view view query  ')

    if (isEmpty(query_results)) {
      // Object is empty (Would return true in this
      // example)
      log.info(
        'Response Sent as d_update_diet_plan_requests  page with no new update requests for dietician_id = ' +
          request.session.dietician_id
      )
      result.render('d_update_diet_plan_requests', {
        dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email,
        cust_details: request.session.cust_details,
        update_diet_plan_requests: 'N',
        query_results: 'No_Update_Diet_Plan_Requests'
      })

    } else {
      log.info(
        'Response Sent as d_view_current_customers page with new update requests for dietician_id = ' +
          request.session.dietician_id
      )
      result.render('d_update_diet_plan_requests', {
        dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email,
        cust_details: request.session.cust_details,
        custid_dietstartdate: request.session.custid_dietstartdate,
        update_diet_plan_requests: 'Y',
        query_results: query_results
      })

    }
  })

  createMySqlConnection().end()
}

module.exports.d_update_diet_plan_requests = function (request, result) {
  log.info('Received Request to d_update_diet_plan_requests for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_update_diet_plan_requests(request, result)
  } else {
    log.info('Sent dieticianlogin page as user was not logged in')

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}

function func_d_update_diet_plan_details (request, result) {
  request.session.custid_dietstartdate = request.body.custid_dietstartdate
  func_d_get_cust_details_from_cust_diet_startdate(request, result)
  var query_results = ''
  var query_stmnt =
    "select concat(cust_id,';',diet_start_date) custid_dietstartdate, cust_id,dietician_id, diet_start_date, day,  calendar_date, meal_type,update_diet_plan_ind,calories,proteins,carbohydrates,fat  from d_update_diet_plan_dates_view where calendar_date>=diet_plan_update_start_date and concat(cust_id,';',diet_start_date)='" +
    request.session.custid_dietstartdate +
    "' order by day, FIELD(meal_type, 'Breakfast', 'Lunch', 'Dinner',null)"
  console.log(query_stmnt)
  log.info('Calling MySQL to get response to d_update_diet_plan_dates_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to d_update_diet_plan_dates_view view query  ')
    log.info('Response Sent as d_update_diet_plan_details page for dietician_id = ' + request.session.dietician_id)

    result.render('d_update_diet_plan_details', {
      dietician_id: request.session.dietician_id,
      dietician_email: request.session.dietician_email,
			cust_details: request.session.cust_details,
			cust_health_details: request.session.cust_health_details,

      custid_dietstartdate: request.session.custid_dietstartdate,
      query_results: query_results,message:"Diet Plan Details"
    })
  })

  createMySqlConnection().end()
}

module.exports.d_update_diet_plan_details = function (request, result) {
  log.info('Received Request to d_update_diet_plan_details for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_update_diet_plan_details(request, result)
  } else {
    log.info('Sent dieticianlogin page as user was not logged in')

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}

function func_d_update_diet_plan_details_form (request, result) {
  var query_results = ''
  request.session.diet_day = request.body.diet_day

  var query_stmnt =
    "select concat(cust_id,';',diet_start_date) custid_dietstartdate, cust_id,dietician_id, diet_start_date, day,  calendar_date, meal_type,new_diet_plan_ind,calories,proteins,carbohydrates,fat  from d_customer_diet_plan_details_view where concat(cust_id,';',diet_start_date)='" +
    request.session.custid_dietstartdate +
    "' and day= " +
    request.session.diet_day +
    " order by day, FIELD(meal_type, 'Breakfast', 'Lunch', 'Dinner',null)"
  console.log(query_stmnt)
  log.info('Calling MySQL to get response to d_customer_diet_plan_details_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to d_customer_diet_plan_details_view view query  ')
    log.info('Response Sent as d_update_diet_plan_details_form page for dietician_id = ' + request.session.dietician_id)

    result.render('d_update_diet_plan_details_form', {
      dietician_id: request.session.dietician_id,
      dietician_email: request.session.dietician_email,
			cust_details: request.session.cust_details,
			cust_health_details: request.session.cust_health_details,

      custid_dietstartdate: request.session.custid_dietstartdate,
      diet_day: request.session.diet_day,
      query_results: query_results
    })
  })

  createMySqlConnection().end()
}
module.exports.d_update_diet_plan_details_form = function (request, result) {
  log.info('Received Request to d_update_diet_plan_details_form for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_update_diet_plan_details_form(request, result)
  } else {
    log.info('Sent dieticianlogin page as user was not logged in')

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}

function func_d_update_diet_plan_details_after_update (request, result) {
  var query_results = ''
  var query_stmnt =
    "select concat(cust_id,';',diet_start_date) custid_dietstartdate, cust_id,dietician_id, diet_start_date, day,  calendar_date, meal_type,update_diet_plan_ind,calories,proteins,carbohydrates,fat  from d_update_diet_plan_dates_view where calendar_date>=diet_plan_update_start_date and concat(cust_id,';',diet_start_date)='" +
    request.session.custid_dietstartdate +
    "' order by day, FIELD(meal_type, 'Breakfast', 'Lunch', 'Dinner',null)"
  console.log(query_stmnt)
  log.info('Calling MySQL to get response to d_update_diet_plan_dates_view view query  ')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got MySQL response to d_update_diet_plan_dates_view view query  ')
    log.info('Response Sent as d_update_diet_plan_details page for dietician_id = ' + request.session.dietician_id)

    result.render('d_update_diet_plan_details', {
      dietician_id: request.session.dietician_id,
      dietician_email: request.session.dietician_email,
			cust_details: request.session.cust_details,
			cust_health_details: request.session.cust_health_details,

      custid_dietstartdate: request.session.custid_dietstartdate,
      query_results: query_results,message:"Diet Plan Details Updated Successfully!"
    })
  })

  createMySqlConnection().end()
}

function func_d_update_diet_plan_details_to_db (request, result) {
  var query_stmnt =
    'SET @v_result = 0; CALL d_add_diet_details(' +
    "'" +
    request.session.custid_dietstartdate +
    "'" +
    ',' +
    request.session.diet_day +
    ',' +
    request.body.breakfast_calories +
    ',' +
    request.body.breakfast_proteins +
    ',' +
    request.body.breakfast_carbohydrates +
    ',' +
    request.body.breakfast_fat +
    ',' +
    request.body.lunch_calories +
    ',' +
    request.body.lunch_proteins +
    ',' +
    request.body.lunch_carbohydrates +
    ',' +
    request.body.lunch_fat +
    ',' +
    request.body.dinner_calories +
    ',' +
    request.body.dinner_proteins +
    ',' +
    request.body.dinner_carbohydrates +
    ',' +
    request.body.dinner_fat +
    ' , @v_result); SELECT @v_result;'

  console.log(query_stmnt)
  log.info('Calling MySQL d_add_diet_details')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got response from MySQL d_add_diet_details')

    v_result = query_results[2][0]['@v_result']

    if (v_result == 1) {
      func_d_update_diet_plan_details_after_update(request, result)
    }
  })
  createMySqlConnection().end()
}

module.exports.d_update_diet_plan_details_submit = function (request, result) {
  log.info('Received Request to d_update_diet_plan_details_submit for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_update_diet_plan_details_to_db(request, result)
  } else {
    log.info('Sent dieticianlogin page as user was not logged in')

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}


function func_d_finalize_new_diet_plan (request, result) {
  var query_stmnt =
    'SET @v_result = 0; CALL d_finalize_new_diet_plan(' +
    "'" +
    request.session.custid_dietstartdate +
    "'" +
    ' , @v_result); SELECT @v_result;'

  console.log(query_stmnt)
  log.info('Calling MySQL d_finalize_new_diet_plan')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got response from MySQL d_finalize_new_diet_plan')

    v_result = query_results[2][0]['@v_result']

    if (v_result == -1)  {
      log.error('DB Error while submitting finalize diet details for dietician')
      log.error(err)
      return result.render('dieticianlogin'), { message: 'We are facing unexpected issues. Please try again later!' }
    }
    else{
      log.info('Sending d_dietician_information as Response to d_finalize_new_diet_plan for dietician_id='+ request.session.dietician_id);

      return result.render('d_dietician_information', {      dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email,
        cust_details: request.session.cust_details, message: "Diet plan for the following customer has been finalized!"});

    }
  })
  createMySqlConnection().end()
}


module.exports.d_finalize_new_diet_plan = function (request, result) {
  log.info('Received Request to d_finalize_new_diet_plan for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_finalize_new_diet_plan(request, result)
  } else {    log.info('Sent dieticianlogin page as user was not logged in')

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}



function func_d_finalize_update_diet_plan (request, result) {
  var query_stmnt =
    'SET @v_result = 0; CALL d_finalize_update_diet_plan(' +
    "'" +
    request.session.custid_dietstartdate +
    "'" +
    ' , @v_result); SELECT @v_result;'

  console.log(query_stmnt)
  log.info('Calling MySQL d_finalize_update_diet_plan')

  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician');
      log.error(err);
     result.render('dieticianlogin', { message: 'We are facing unexpected issues. Please try again later!' });
    }
    log.info('Got response from MySQL d_finalize_update_diet_plan')

    v_result = query_results[2][0]['@v_result']

    if (v_result == -1)  {
      log.error('DB Error while submitting finalize diet details for dietician')
      log.error(err)
      return result.render('dieticianlogin'), { message: 'We are facing unexpected issues. Please try again later!' }
    }
    else{
      log.info('Sending d_dietician_information as Response to d_finalize_update_diet_plan for dietician_id='+ request.session.dietician_id);

      return result.render('d_dietician_information', {      dietician_id: request.session.dietician_id,
        dietician_email: request.session.dietician_email,
        cust_details: request.session.cust_details, message: "Diet plan for the following customer has been finalized!"});

    }
  })
  createMySqlConnection().end()
}


module.exports.d_finalize_update_diet_plan = function (request, result) {
  log.info('Received Request to d_finalize_update_diet_plan for dietician_id = ' + request.session.dietician_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_d_finalize_update_diet_plan(request, result)
  } else {    log.info('Sent dieticianlogin page as user was not logged in')

    return result.render('dieticianlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}



/*******************************************************************************
 * *********************** Restaurant Module ****************************
 ******************************************************************************/


module.exports.r_get_login_form = function (request, result) {
  log.info('Sending Restaurant Login Page')

  result.render('restaurantlogin', { message: 'Please Enter Your Userid and Password! ' })
}

function func_r_get_logout (request, result) {
  log.info('Logout successful for restaurant_id = ' + request.session.restaurant_id)

  request.session.destroy(function (err) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician')
      log.error(err)
      result.render('restaurantlogin', { message: 'We are facing unexpected issues. Please try again later!' })
    } else {
      log.info('Sending Restaurant Login Page')
      result.render('restaurantlogin', { message: 'Please Enter Your Userid and Password! ' })
    }
  })
}

module.exports.r_get_logout = function (request, result) {
  log.info('Received request to To get Logout Page for restaurant_id = ' + request.session.restaurant_id)

  if (checkIfLoggedIn(request) == 'Yes') {
    func_r_get_logout(request, result)
  } else {
    result.render('restaurantlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}

function func_r_check_login_info (request, result) {
  var query_results = ''
  request.session.restaurant_email_id = request.body.userid
  var v_restaurant_login_check = 0
  log.info('Calling MySQL DB to validate the credentials for restaurat_user_id: ' + request.session.restaurant_email_id)
  createMySqlConnection().query(
    "SET @v_count = 0,@v_restaurant_id=0; CALL r_check_restaurant_login_info('" +
      request.session.restaurant_email_id +
      "','" +
      request.body.pwd +
      "', @v_count,@v_restaurant_id); SELECT @v_count,@v_restaurant_id;",
    function (err, query_results, fields) {
      if (err) {
        log.error('DB Error while submitting updated diet details for dietician')
        log.error(err)
        result.render('restaurantlogin', { message: 'We are facing unexpected issues. Please try again later!' })
      } else {
        v_restaurant_login_check = query_results[2][0]['@v_count']
        console.log('Restaurant login success:' + v_restaurant_login_check)

        if (v_restaurant_login_check == 1) {
          log.info(
            'Recieved result from db Confirming the credentials are valid for restaurant_email_id:' +
              request.session.restaurant_email_id
          )

          request.session.restaurant_id = query_results[2][0]['@v_restaurant_id']
          request.session.loggedin = 'Yes'
          log.info('Sent Response For Successful Login of restaurant_id = ' + query_results[2][0]['@v_restaurant_id'])

          result.render('r_home', {
            restaurant_id: query_results[2][0]['@v_restaurant_id'],
            restaurant_email_id: request.session.restaurant_email_id,
            loggedin: request.session.loggedin
          })
        } else {
          log.info(
            'Recieved result from db Confirming the credentials are NOT valid for User_Id:' +
              request.session.restaurant_email_id
          )
          log.info(
            'Sent Response For Wrong Credentials for Login of restaurant_email_id = ' +
              request.session.restaurant_email_id
          )
		  result.render('restaurantlogin', { message: 'Invalid Credentials! Please Enter Correct Userid and Password!' })

        }
      }
    }
  )
  createMySqlConnection().end()
}

module.exports.r_post_home = function (request, result) {
  log.info('Received request to func_r_check_login_info')
  func_r_check_login_info(request, result)
}

function func_r_get_home (request, result) {
  console.log('Begin func_r_get_home')
  log.info('Sent Restaurant Home Page r_home for restaurant_id = ' + request.session.restaurant_id)

  result.render('r_home', {
    restaurant_id: request.session.restaurant_id,
    restaurant_email_id: request.session.restaurant_email_id
  })

  console.log('End func_r_get_home')
}

module.exports.r_get_home = function (request, result) {
  log.info('Received request to r_get_home to get Restaurant Home Page for restaurant_id = ' + request.session.restaurant_id)
  if (checkIfLoggedIn(request) == 'Yes') {
    func_r_get_home(request, result)
  } else {
    log.info('Sending Restaurant Login Page - Customer is logged out')

    result.render('restaurantlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}
function func_r_get_menu_page (request, result) {
  console.log('Begin func_r_get_menu_page')
  var query_results = ''
  var query_stmnt =
    'SELECT restaurant_id,item_name,meal_type,calories,proteins,carbohydrates,fat,day_of_week,offered_ind,day_of_week  FROM r_restaurant_item_details_day_view where restaurant_id=' +
    request.session.restaurant_id +
    " ORDER BY ISNULL(day_of_week), FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',null), FIELD(meal_type, 'Breakfast', 'Lunch', 'Dinner')"
  log.info('Calling MySQL DB to get menu  for restaurant_id: ' + request.session.restaurant_id)
  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician')
      log.error(err)
      result.render('restaurantlogin', { message: 'We are facing unexpected issues. Please try again later!' })
    } else {
      log.info('View menu information received from DB for restaurant_id = ' + request.session.restaurant_id)

      if (isEmpty(query_results)) {
        // Object is empty (Would return true in this example)
		log.info('Sent Restaurant Menu Page no items for restaurant_id = ' + request.session.restaurant_id)

		result.render('r_view_menu', {
          restaurant_id: request.session.restaurant_id,
          restaurant_email_id: request.session.restaurant_email_id,
          query_results: 'No_Items',

          items_present: 'N'
        })
      } else {
        log.info('View menu information received from DB for restaurant_id = ' + request.session.restaurant_id)
        log.info('Sent Restaurant Menu Page with items for restaurant_id = ' + request.session.restaurant_id)

        result.render('r_view_menu', {
          restaurant_id: request.session.restaurant_id,
          restaurant_email_id: request.session.restaurant_email_id,
          query_results: query_results,

          items_present: 'Y'
        })
      }
    }
  })
  createMySqlConnection().end()
  console.log('End func_r_get_menu_page')
}

module.exports.r_get_view_menu = function (request, result) {
  if (checkIfLoggedIn(request) == 'Yes') {
    log.info('Received request to To get Restaurant Menu Page for restaurant_id = ' + request.session.restaurant_id)

    func_r_get_menu_page(request, result)
  } else {
	log.info('Sending Restaurant Login Page - Customer is logged out')

    return result.render('restaurantlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}

// Restaurant - Add items to menu - send add form
module.exports.r_add_menu_items_form = function (request, result) {
  log.info(
    'Received request to To get Restaurant Add Menu Items Form for restaurant_id = ' + request.session.restaurant_id
  )

  if (checkIfLoggedIn(request) == 'Yes') {
	log.info('Sent Restaurant Add Menu Item For for restaurant_id = ' + request.session.restaurant_id)

    return result.render('r_add_menu_items_form', {
      restaurant_id: request.session.restaurant_id,
      restaurant_email_id: request.session.restaurant_email_id,
      message: 'nothing'
    })
  } else {
	log.info('Sending Restaurant Login Page - Customer is logged out')

    return result.render('restaurantlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}

function func_r_add_menu_items (request, result) {
  var i
  var v_monday = (v_tuesday = v_wednesday = v_thursday = v_friday = v_saturday = v_sunday = 'N')
  if (typeof request.body.days_of_week === 'object') {
    for (i = 0; i < request.body.days_of_week.length; i++) {
      console.log(request.body.days_of_week[i])
      console.log(typeof request.body.days_of_week)

      if (request.body.days_of_week[i] == 'Monday') {
        v_monday = 'Y'
      } else if (request.body.days_of_week[i] == 'Tuesday') {
        v_tuesday = 'Y'
      } else if (request.body.days_of_week[i] == 'Wednesday') {
        v_wednesday = 'Y'
      } else if (request.body.days_of_week[i] == 'Thursday') {
        v_thursday = 'Y'
      } else if (request.body.days_of_week[i] == 'Friday') {
        v_friday = 'Y'
      } else if (request.body.days_of_week[i] == 'Saturday') {
        v_saturday = 'Y'
      } else if (request.body.days_of_week[i] == 'Sunday') {
        v_sunday = 'Y'
      }
    }
  } else if (typeof request.body.days_of_week === 'string') {
    if (request.body.days_of_week == 'Monday') {
      v_monday = 'Y'
    } else if (request.body.days_of_week == 'Tuesday') {
      v_tuesday = 'Y'
    } else if (request.body.days_of_week == 'Wednesday') {
      v_wednesday = 'Y'
    } else if (request.body.days_of_week == 'Thursday') {
      v_thursday = 'Y'
    } else if (request.body.days_of_week == 'Friday') {
      v_friday = 'Y'
    } else if (request.body.days_of_week == 'Saturday') {
      v_saturday = 'Y'
    } else if (request.body.days_of_week == 'Sunday') {
      v_sunday = 'Y'
    }
  }
  var query_results = ''
  var query_stmnt =
    'SET @v_result = 0; CALL r_add_menu_item(' +
    request.session.restaurant_id +
    ",'" +
    request.body.item_name +
    "','" +
    request.body.mealtype +
    "'," +
    request.body.calories +
    ',' +
    request.body.proteins +
    ',' +
    request.body.carbohydrates +
    ',' +
    request.body.fat +
    ",'" +
    v_monday +
    "','" +
    v_tuesday +
    "','" +
    v_wednesday +
    "','" +
    v_thursday +
    "','" +
    v_friday +
    "','" +
    v_saturday +
    "','" +
    v_sunday +
    "' , @v_result); SELECT @v_result;"

  log.info('Calling MySQL DB to add menu item for for restaurant_id: ' + request.session.restaurant_id)
  createMySqlConnection().query(query_stmnt, function (err, query_results, fields) {
    if (err) {
      log.error('DB Error while submitting updated diet details for dietician')
      log.error(err)
      result.render('restaurantlogin', { message: 'We are facing unexpected issues. Please try again later!' })
    } else {
      log.info('Added item to menu information received from DB for restaurant_id = ' + request.session.restaurant_id)

      v_result = query_results[2][0]['@v_result']

      if (v_result == 1) {
		log.info('Sending r_information for item added successfully for restaurant_id = ' + request.session.restaurant_id)

        return result.render('r_information', {
          restaurant_id: request.session.restaurant_id,
          restaurant_email_id: request.session.restaurant_email_id,
          message: 'Item ' + request.body.item_name + ' has been added successfully!'
        })
      } else if (v_result == 2) {
		log.info('Sending r_information for item already present restaurant_id = ' + request.session.restaurant_id)

        return result.render('r_information', {
          restaurant_id: request.session.restaurant_id,
          restaurant_email_id: request.session.restaurant_email_id,
          message: 'Item ' + request.body.item_name + ' is an existing item. So, the item was not added!'
        })
      }
    }

    createMySqlConnection().end()
  })
}

module.exports.r_add_menu_items = function (request, result) {
  log.info('Received request to To Add Menu Items r_add_menu_items for restaurant_id = ' + request.session.restaurant_id)

  if (checkIfLoggedIn(request) == 'Yes') {
    func_r_add_menu_items(request, result)
  } else {
	log.info('Sending Restaurant Login Page - Customer is logged out')

    result.render('restaurantlogin', { message: 'Please Enter Your Userid and Password! ' })
  }
}



// ***************************************************  RESTAURANT - VIEW TODAYS ORDERS  ***********************************************

module.exports.r_view_todays_orders = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_restaurant_id=request.session.restaurant_id;
		v_restaurant_email_id = request.session.restaurant_email_id;
		log.info("Received request to r_view_todays_orders for RESTAURNT ID: " + v_restaurant_id);
		func_r_view_todays_orders(v_restaurant_id, request,result);

	}
	else
	{
		 result.render('restuarantlogin');
	}
	
};

//VIEW TODAYS ORDER
function func_r_view_todays_orders(v_restaurant_id, request,result){
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	log.info("Calling MySQL DB to retrive todays order details");

	// sql = "set @res=0; call proc_r_view_todays_orders('" + v_restaurant_id + "', @res, @r_id, @i_name, @o_date);select @res, @r_ID, @i_name, @o_date;"
	sql = "SELECT Restaurant_ID, Item_Name, order_date FROM c_order_history_view where Restaurant_ID = '" + v_restaurant_id + "' and order_date = SUBDATE(curdate(), INTERVAL 1 DAY);"
	mysql_connection.query(sql, function (err, query_results, fields) {
				if (err) {
					log.error('DB Error while selecting todays orders for restaurant ID: ' + v_restaurant_id);
					log.error(err);
					result.render('errorpage');
				}
			
				// console.log("Successfully selected todays orders");
				log.info("Successfully selected todays orders for restaurant ID: " + v_restaurant_id);
				console.log(query_results);
				result.render('r_view_todays_orders',{
					query_results:query_results});
				
			});
	
	mysql_connection.end();

}



// ***************************************************  RESTAURANT - VIEW TOMOS ORDERS   ***************************************************

module.exports.r_view_tomos_orders = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_restaurant_id=request.session.restaurant_id;
		log.info("Received request to r_view_tomos_orders for RESTAURNT ID: " + v_restaurant_id);
		func_r_view_tomos_orders(v_restaurant_id, request,result);
	}
	else
	{
		 result.render('restuarantlogin');
	}
	
};

function func_r_view_tomos_orders(v_restaurant_id, request,result){
	
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	// console.log("inside func_r_view_tomos_orders ");
	
	// msql = "set @res=0; call proc_r_view_tomos_orders('" + v_restaurant_id + "', @res, @r_id, @i_name, @o_date);select @res, @r_id, @i_name, @o_date;"
	sql = "SELECT Restaurant_ID, Item_Name, order_date FROM c_order_history_view where Restaurant_ID = '" + v_restaurant_id + "' and order_date = curdate();"
	mysql_connection.query(sql, function (err, query_results, fields) {
				if (err) {
					log.error('DB Error while selecting next days orders for restaurant ID: ' + v_restaurant_id);
					log.error(err);
					result.render('errorpage');
				}
				
				log.info("Successfully selected next days orders for restaurant ID: " + v_restaurant_id);
				result.render('r_view_tomos_orders',
				{
					query_results:query_results
				});
				
			});
	
	mysql_connection.end();

}
// ***************************************************    REPORT   *************************************************************   

//VIEW REPORT PAGE
module.exports.r_view_report = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_restaurant_id=request.session.restaurant_id;
		log.info("Received request to r_view_report for RESTAURANT_ID: " + v_restaurant_id);
		result.render('r_view_report');	
	}
	else
	{
		 result.render('restuarantlogin');
	}
	
};

// GENERATE REPORT
module.exports.r_generated_report = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_restaurant_id=request.session.restaurant_id;
		log.info("Received request to r_generated_report for RESTAURANT_ID: " + v_restaurant_id);
		func_generated_report(v_restaurant_id, request, result);
	}
	else
	{
		result.render('/restuarantlogin');
	}
};

function func_generated_report(v_restaurant_id, request, result)
{
	
	var query_results="";
	var mysql_connection=createMySqlConnection();
	var frmdte = request.body.frmdte;
	var todte = request.body.todte;
	// console.log("frmdte: ", frmdte);
	// console.log("todte: ", todte);
	
	// mysql_connection.query("SELECT * FROM r_generate_report where Restaurant_ID = '" + v_restaurant_id +"' and order_date > '" + frmdte + "' and order_date < '" + todte + "'", function (err, query_results, fields) {
	sql = "call proc_r_generate_report('" + v_restaurant_id + "', '" +frmdte + "', '" + todte +"');"	
	mysql_connection.query(sql, function (err, query_results)
	{
				if (err) {
					log.error('DB Error while generating report for restaurant ID: ' + v_restaurant_id);
					log.error(err);
					result.render('errorpage');
				}
				console.log(query_results);
				if (isEmpty(query_results[0]))
				{
					// console.log("No order placed between these dates");
					log.info("Selected dates for report generation had no orders for restauant ID: " + v_restaurant_id);
					result.render('r_generated_report', 
					{
						query_results : 'No order placed between these dates',
						items_present : 'N'
					});
				} 
				else
				 {
					// console.log("inside yes r_generated_report");
					// console.log("query_results");
					// console.log(query_results[0]);
					log.info("Generation of report for selected dates for restauant ID: "+ v_restaurant_id) ;
					result.render('r_generated_report', 
					{
						query_results : query_results[0],
						items_present : 'Y'
					});
				}
	});
	mysql_connection.end();
}

//****************************************************   UPDATE MENU    ****************************************************





//P1
module.exports.r_update_menu = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		console.log("r_update_menu");
		v_restaurant_id=request.session.restaurant_id;
		func_r_update_menu(v_restaurant_id, request,result);
	}
	else
	{
		console.log("inside redirect of r_update_menu");
		result.render('restuarantlogin');
	}
	
};

function func_r_update_menu(v_restaurant_id, request, result) {
	var query_results = "";
	var sql= "SELECT restaurant_id,item_name  FROM r_update_menu_view where restaurant_id="
		+ v_restaurant_id
		+" GROUP BY item_name, restaurant_id";
	
	log.info('Calling MySQL DB to get menu  for restaurant_id: '+ v_restaurant_id );
	
	createMySqlConnection().query(
		sql,
			function(err, query_results, fields) {
			if (err)
			{
				log.error('DB Error while fetching data for update menu request for restaurant_ID: ' + v_restaurant_id);
				log.error(err);
				result.render('errorpage');
			}
				
				if (isEmpty(query_results))
				{
					log.info('Sent Restaurant Menu Page no items for restaurant_id = '+v_restaurant_id);

					result.render('r_update_menu', {
						restaurant_id : v_restaurant_id,
						restaurant_email_id : request.session.restaurant_email_id,
						query_results : 'No_Items',
						items_present : 'N'
					});
				}
				else
				 {
					log.info('Update menu information received from DB for restaurant_id = '+v_restaurant_id);
					result.render('r_update_menu', 
					{
						items_present : 'Y',
						query_results : query_results

					});
					log.info('Sent Restaurant Menu Page with items for restaurant_id = '+request.session.restaurant_id );

				}
			});
	createMySqlConnection().end();
}


//P2
module.exports.r_post_update_menu_page = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_restaurant_id=request.session.restaurant_id;
		func_r_post_update_menu_page(v_restaurant_id, request,result);
	}
	else
	{
		result.render('restuarantlogin');
	}
	
};

function func_r_post_update_menu_page(v_restaurant_id, request, result){
	var query_results = "";
	var itemToBeUpdated = request.body.itemname;
request.session.item_name=request.body.itemname;
	console.log("itemToBeUpdated: " + request.session.item_name); 

	var sql= "SELECT item_name, meal_type, day_of_week, offered_ind,item_offered  FROM r_update_menu_view where restaurant_id=' "
		+ v_restaurant_id  + "' and item_name = '" + request.session.item_name + "' ";
	
	log.info('Calling MySQL DB to get menu  for restaurant_id: '+ v_restaurant_id );
	
	createMySqlConnection().query( sql, function(err, query_results, fields) {
			if (err)
			{
				log.error('DB Error while fetching data for update menu request');
				log.error(err);
				result.render('errorpage');
			}
				
				if (isEmpty(query_results))
				{
					log.info('Sent Restaurant Menu Page no items for restaurant_id = '+v_restaurant_id);
					console.log("Empty items");
					result.render('updatemenupage', {
						restaurant_id : v_restaurant_id,
						restaurant_email_id : request.session.restaurant_email_id,
						item_name:request.session.item_name,
						query_results : 'No_Items',
						items_present : 'N'
					});
				}
				else
				 {
					log.info('Update menu information received from DB for restaurant_id = '+v_restaurant_id);
					console.log("query_results");
					result.render('updatemenupage', 
					{
						restaurant_id : v_restaurant_id,
						restaurant_email_id : request.session.restaurant_email_id,
						items_present : 'Y',
						query_results : query_results,
						item_name:request.session.item_name

					});
					log.info('Sent Restaurant Menu Page with items for restaurant_id = '+request.session.restaurant_id );

				}
			});
	createMySqlConnection().end();
	console.log("End r_post_update_menu_page");
}




//P3
module.exports.r_post_update_menupage_successful = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_restaurant_id=request.session.restaurant_id;
		log.info("received request for r_post_update_menupage_successful for rest ID: " + v_restaurant_id);
		result.render('updatemenusuccessful');
	}
	else
	{
		result.render('restuarantlogin');
	}
	
};


function func_r_post_update_menu_page2(v_restaurant_id, request, result){

	var i;
	var v_monday = v_tuesday = v_wednesday = v_thursday = v_friday = v_saturday = v_sunday = 'N';
	console.log('***************');
	console.log(request.body);
	console.log(request.session.item_name);


	if (!(isEmpty(request.body)))
{

	for (i = 0; i < request.body.day_of_week.length; i++) {
			console.log(request.body.day_of_week[i]);
			console.log(typeof request.body.day_of_week);
			if ((typeof request.body.day_of_week) == 'object') {

			if (request.body.day_of_week[i] == 'Monday') {
				v_monday = 'Y';
			} else if (request.body.day_of_week[i] == 'Tuesday') {
				v_tuesday = 'Y';
			} else if (request.body.day_of_week[i] == 'Wednesday') {
				v_wednesday = 'Y';
			} else if (request.body.day_of_week[i] == 'Thursday') {
				v_thursday = 'Y';
			} else if (request.body.day_of_week[i] == 'Friday') {
				v_friday = 'Y';
			} else if (request.body.day_of_week[i] == 'Saturday') {
				v_saturday = 'Y';
			} else if (request.body.day_of_week[i] == 'Sunday') {
				v_sunday = 'Y';
			}
		
	} else if ((typeof request.body.day_of_week) == 'string') {
		if (request.body.day_of_week == 'Monday') {
			v_monday = 'Y';
		} else if (request.body.day_of_week == 'Tuesday') {
			v_tuesday = 'Y';
		} else if (request.body.day_of_week == 'Wednesday') {
			v_wednesday = 'Y';
		} else if (request.body.day_of_week == 'Thursday') {
			v_thursday = 'Y';
		} else if (request.body.day_of_week == 'Friday') {
			v_friday = 'Y';
		} else if (request.body.day_of_week == 'Saturday') {
			v_saturday = 'Y';
		} else if (request.body.day_of_week == 'Sunday') {
			v_sunday = 'Y';
		}
	}}
}
	var query_results = "";
	var query_stmnt = "SET @v_result = 0; CALL proc_update_menu("
			+ request.session.restaurant_id + ",'" + request.session.item_name
			+ "','" + v_monday + "','" + v_tuesday
			+ "','" + v_wednesday + "','" + v_thursday + "','" + v_friday
			+ "','" + v_saturday + "','" + v_sunday
			+ "' , @v_result); SELECT @v_result;"

			console.log(query_stmnt);
			var itemToBeUpdated = request.body.itemname;

	console.log("itemToBeUpdated: " + request.session.item_name); 


	log.info('Calling MySQL DB to get menu  for restaurant_id: '+ v_restaurant_id );
	
	createMySqlConnection().query( query_stmnt, function(err, query_results, fields) {
			if (err)
			{
				log.error('DB Error while fetching data for update menu request');
				log.error(err);
				result.render('errorpage');
			}
				
				if (isEmpty(query_results))
				{
					log.info('Sent Restaurant Menu Page no items for restaurant_id = '+v_restaurant_id);
					console.log("Empty items");
					result.render('updatemenupagedays', {
						restaurant_id : v_restaurant_id,
						restaurant_email_id : request.session.restaurant_email_id,
						query_results : 'No_Items',
						items_present : 'N'
					});
				}
				else
				 {
					log.info('Update menu information received from DB for restaurant_id = '+v_restaurant_id);
					console.log("query_results12345678");
					result.render('updatemenupagedays', 
					{
						items_present : 'Y',
						query_results : query_results

					});
					log.info('Sent Restaurant Menu Page with items for restaurant_id = '+request.session.restaurant_id );

				}
			});
	createMySqlConnection().end();
	console.log("End r_post_update_menu_page");
}



module.exports.r_post_updatemenupagedays = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_restaurant_id=request.session.restaurant_id;
		func_r_post_update_menu_page2(v_restaurant_id, request,result);
	}
	else
	{
		result.render('restuarantlogin');
	}
	
};



/*******************************************************************************
 * *********************** Customer Module ****************************
 ******************************************************************************/
 
//**************************************     CUSTOMER REGISTRATION + SUBMIT       **************************************************** 


module.exports.c_get_customer_registration = function(request, result)
{
	log.info("Recieved request to c_get_customer_registration");
	result.render('customerregistration');
};


module.exports.c_post_customer_login = function(request, result)
{
	log.info("Recieved request to c_post_customer_login");
	func_c_ins_cust_details(request, result);
};

//INSERT VALUES FROM CUSTOMER REGISTRATION PAGE TO DB
function func_c_ins_cust_details(request, result){
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	var cust_name = request.body.customername;
	var cust_dob = request.body.customerdob;
	var cust_email=request.body.customeremail;
	var cust_pwd = request.body.customerpwd;
	var cust_location = request.body.customerlocation;

	log.info("Calling DB to insert customer details");
	sql = "set @vc=0; CALL proc_c_ins_cust_details('" + cust_name + "','" + cust_dob + "','" + cust_email + "', '" + cust_pwd + "','" + cust_location + "', @vc, @eid); select @vc;"

	mysql_connection.query(sql, function (err, query_results) {
				if (err)
				{
					log.error('DB Error while inserting customer registration details');
					log.error(err);
					result.render('errorpage');
				}
				check_ins = query_results[2][0]['@vc'];
				if (check_ins==1)
				{
					log.info("Inserted to DB customer registration details for customeremail: " + cust_email);
					result.render('customerlogin')
				}
			   else
				{
					log.error('EmailID already exists'+ cust_email);
			    result.render('registrationfail');
				}
			});
	mysql_connection.end();
}


//********************************************    CUSTOMER LOGIN + SUBMIT   **********************************************************  

module.exports.c_d_dieticianOption = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		func_c_check_customer_login(v_customer_id, request,result);
		log.info("Request received for c_d_dieticianOption for customer_ID: " + v_customer_id);
	}
	else
	{
		result.render('customerlogin');
	}
   

};

//*************************************   PAGE TO DISPLAY WHEN DIETICIAN NO IS CLICKED  **************************************************

module.exports.c_d_dieticianNo = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		func_d_sel_mealplan_lst(v_customer_id, request,result);
		log.info("Request received for c_d_dieticianNo for customer_ID: " + v_customer_id);

	}
	else
	{
		result.render('customerlogin');
	}
   
};

function func_d_sel_mealplan_lst(v_customer_id, request, result){

	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	log.info("Calling MySQL DB to list available mealplans for customer ID: " + v_customer_id);
	mysql_connection.query("SELECT plan_id, Breakfast_Count, lunch_Count, dinner_Count, price FROM meal_plan ", function (err, query_results, fields) {
				if (err)  {
					log.error('DB Error while listing available mealplans for customer ID: ' + v_customer_id);
					log.error(err);
					result.render('errorpage');
					}
				log.info("Successfully listed list of mealplans for customer ID: " + v_customer_id);
				result.render('dieticianNo',
				{
					query_results:query_results
				});
			});
	
	mysql_connection.end();
	}

//*************************************   PAGE TO DISPLAY WHEN DIETICIAN YES IS CLICKED  **************************************************
module.exports.c_d_dieticianYes = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		func_d_sel_dietician_lst(v_customer_id, request,result);
		log.info("Request received for c_d_dieticianYes for customer_ID: " + v_customer_id);
	}
	else
	{
		return result.redirect('/customerlogin');
	}
	
};

function func_d_sel_dietician_lst(v_customer_id, request, result){

	var query_results="";
	var mysql_connection=createMySqlConnection();
	log.info("Calling MySQL DB to list all the dieticians enrolled  for customer ID: " + v_customer_id);
	mysql_connection.query("SELECT * FROM diet_ratings_view", function (err, query_results, fields) {
				if (err) {
					log.error('DB Error while selecting the list of enrolled dieticians for customer ID: ' + v_customer_id);
					log.error(err);
					result.render('errorpage');
					}

				log.info("Successfully listed list of enrolled dieticians for customer ID: " + v_customer_id);
				result.render('dieticianYes',
				{
					query_results:query_results
				});
			});
	
	
	mysql_connection.end();
	}

	
// *******************************************************    DIETICIAN YES DETAILS + SUBMIT     *******************************************

module.exports.d_yes_details = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{	
		v_customer_id=request.session.customer_id;
		log.info("Received request to d_yes_details for CUSTOMER ID: " + v_customer_id);
		func_proc_dietician_yes(v_customer_id, request,result);
	}
	else
	{
		result.render('customerlogin');
	}	
};

// INSERT FORM DETAILS FROM DIETICIAN YES PAGE TO DB
function func_proc_dietician_yes(v_customer_id, request, result){
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	var stdt = request.body.startdate;
	var cardtype = request.body.cardtype;
	var cardnumb = request.body.cardnumb;
	var dietician_id = request.body.dietician_id;

	var msmtdate=request.body.msmtdate;
	var actlvl = request.body.actlvl;
	var weight = request.body.weight;
	var height = request.body.height;
	var sleep = request.body.sleep;
	
	var disease1 = request.body.disease1;
	var disease2 = request.body.disease2;
	var disease3 = request.body.disease3;
	var disease4 = request.body.disease4;
	var disease5 = request.body.disease5;

	var allergy1 = request.body.allergy1;
	var allergy2 = request.body.allergy2;
	var allergy3 = request.body.allergy3;
	var allergy4 = request.body.allergy4;
	var allergy5 = request.body.allergy5;

	log.info("Calling MySQL DB to insert additional details of customer enrolled with a dietician for customer ID: " + v_customer_id);
	sql = "set @res=0, @cnt = 0; CALL proc_dietician_yes('" + v_customer_id + "','" + stdt + "','" + cardtype + "','" + cardnumb + "', '" + dietician_id + "','" + msmtdate + "','" + actlvl + "','" + weight + "','" + height + "','" + sleep + "','" + disease1 + "','" + disease2 + "','" + disease3 + "','" + disease4 + "','" + disease5 + "','" + allergy1 + "','" + allergy2 + "','" + allergy3 + "','" + allergy4 + "','" + allergy5 + "', @res, @cnt); select @res;"
	mysql_connection.query(sql, function (err, query_results) {
				if (err) 
				{
					log.error('DB Error while inserting additional details of customers enrolled with a dietician for customer ID: ' + v_customer_id);
					log.error(err);
					result.render('errorpage');
				}
				check_ins = query_results[2][0]['@res'];
				if (check_ins==1)
				{
					log.info("Successfully inserted customer enrolled dietician details to DB for customer ID: " + v_customer_id);
					result.render('yespaymentsuccessful');
				}
			});
	mysql_connection.end();
}

//******************************************************   DIETICIAN NO DETAILS + SUBMIT   *******************************************************
 
module.exports.d_no_details = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info("Received request to d_yes_details for CUSTOMER ID: " + v_customer_id);
		func_proc_dietician_no(v_customer_id, request,result);
	}
	else
	{
		result.render('customerlogin');
	}
	
};


// INSERT FORM DETAILS FROM DIETICIAN NO PAGE TO DB
function func_proc_dietician_no(v_customer_id, request,result){
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	var stdt = request.body.startdate;
	var mealtypeid = request.body.meal_plan_id;
	var cardtype = request.body.cardtype;
	var cardnumb = request.body.cardnumb;

	log.info("Calling MySQL DB to insert details of customers not enrolled with any dieticians for customer ID: " + v_customer_id);
	sql = "set @res=0; CALL proc_dietician_no('" + v_customer_id + "','" + stdt + "','" + mealtypeid + "','" + cardtype + "', '" + cardnumb + "', @res); select @res;"	
	mysql_connection.query(sql, function (err, query_results) {

				if (err) 
					{
						log.error('DB Error while inserting  details of customers not enrolled with any dieticians for customer ID: ' + v_customer_id);
						log.error(err);
						result.render('errorpage');
					}
				
					check_ins = query_results[2][0]['@res'];
					if (check_ins==1)
					{
						log.info("Successfully inserted customer not enrolled dietician details to DB for customer ID: " + v_customer_id);
						result.render('nopaymentsuccessful');
					}
					
			});
	mysql_connection.end();
}

//******************************************************                                         ******************************************* 

// F1 To check if login information is correct and give the respective home page. 
function func_c_check_customer_login(request, result){
	
	//Variable for Query results
	var query_results="";

	//Create Mysql Connection
	var mysql_connection=createMySqlConnection();
	var v_cust_email_id=request.body.userid;
	var v_password=request.body.pwd;
	var v_cust_login_check=0;
	console.log(request.body.userid);
	console.log(request.body.pwd);

	log.info('Calling MySQL DB to validate the credentials');

	sql = "SET @v_count = 0,@v_customer_id=0,@v_cust_type = ''; CALL c_check_customer_login_info('" + v_cust_email_id + "','" + v_password + "', @v_count,@v_customer_id,@v_cust_type); SELECT @v_count,@v_customer_id,@v_cust_type;"	
	
	mysql_connection.query(sql,function (err, query_results, fields) {
				if (err) {
					log.error('DB Error while validating the credentials');
					log.error(err);
					result.render('errorpage');
					}

				// console.log(query_results);

				v_cust_login_check=query_results[2][0]['@v_count'];
				v_customer_id=query_results[2][0]['@v_customer_id'];
				v_customer_type=query_results[2][0]['@v_cust_type'];

			  console.log('Login Check: '+v_cust_login_check);
				console.log('Customer ID: '+v_customer_id);
				console.log('Customer Type: '+v_customer_type);

			    if (v_cust_login_check==1){
					console.log("Logging in "+v_cust_email_id);
			    request.session.customer_id = v_customer_id;
					request.session.customer_email = v_cust_email_id;
					
					log.info('Recieved result from db Confirming the credentials are valid for User_Id:'+v_cust_email_id);

					request.session.loggedin='Yes';
					console.log("logged in value",request.session.loggedin)

					if (v_customer_type == 'None'){
						result.render('dieticianOption',{customer_id:v_customer_id,customer_email:v_cust_email_id});
					}
					
					else if(v_customer_type == 'Start_Date_Late') {
						result.render('startDateLate',{customer_id:v_customer_id,customer_email:v_cust_email_id});

					}
					else{
						result.render('customerhome',{customer_id:v_customer_id,customer_email:v_cust_email_id});
					}
					
				}
				
				else{
						log.error('Invalid Credentials entered for User_Id:'+v_cust_email_id);
			    	result.render('loginfail');
			    }

			});

	//End MySQL Connection
	mysql_connection.end();
}

// F2 Logout 
function func_c_get_customer_logout(request, result){

	request.session.destroy(function(err) {
		if(err) {
			return next(err);
		} else {
			console.log(request.session);
			log.info('Customer Logged Out Succesfully');
			result.render('customerlogin');
		}
		});
	console.log("Logged out");
};

// F3  to get the personalized menu for the logged in customer
function func_c_get_menu(v_customer_id,request, result){
		
		console.log("Inside Function to get personalized customer menu");
	
		var query_results="";
		var mysql_connection=createMySqlConnection();

		log.info('Calling DB to to get personalized customer menu for User_Id:'+ v_customer_id );
		mysql_connection.query("SELECT name,email_id,item_name,meal_type,calories,proteins,carbohydrates,fat,Avg_ratings FROM c_menu_view WHERE cust_id="+v_customer_id, function (err, query_results, fields) {
			
			if (err) {
			log.error('DB Error while extracting the menu');
			log.error(err);
			result.render('errorpage');
			}

			if(isEmpty(query_results)) 
			{
				log.info('Recieved result from db and sending response to checkmenu for User_Id:'+ v_customer_id );
			result.render('checkmenu',{items_present:'N',query_results:'No_Items'});
			} 
			else{
				log.info('Recieved result from db and sending response to checkmenu for User_Id:'+ v_customer_id );
			result.render('checkmenu',{items_present:'Y',query_results:query_results});
			}
		});

	mysql_connection.end();
}



// F4  to place the order in db
function func_c_order_confirmation(v_customer_id,request, result){
	

	//Create Mysql Connection
	var mysql_connection=createMySqlConnection();

	var v_restaurant_item_id_bf=request.body.breakfast;
	var v_restaurant_item_id_ln=request.body.lunch;
	var v_restaurant_item_id_din=request.body.dinner;
	
	 if (v_restaurant_item_id_bf == undefined){
			var v_restaurant_name_bf = ' ';
			var v_item_name_bf = ' ';
		 	var v_bf_time = 0;
		}
		else{
			var bf_arr = v_restaurant_item_id_bf.split(",");
			var v_restaurant_name_bf = bf_arr[0];
			var v_item_name_bf = bf_arr[1];
			var v_bf_time=request.body.breakfasttime;
		}

	 if (v_restaurant_item_id_ln == undefined){
			var v_restaurant_name_ln = ' ';
			var v_item_name_ln = ' ';
		 	var v_ln_time = 0;
		}
		else{
			var ln_arr = v_restaurant_item_id_ln.split(",");
			var v_restaurant_name_ln = ln_arr[0];
			var v_item_name_ln = ln_arr[1];
			var v_ln_time=request.body.lunchtime;
		}

	 if (v_restaurant_item_id_din == undefined){
			var v_restaurant_name_din = ' ';
			var v_item_name_din = ' ';
		 var v_din_time = 0;
		}
		else{
			var din_arr = v_restaurant_item_id_din.split(",");
			var v_restaurant_name_din = din_arr[0];
			var v_item_name_din = din_arr[1];
			var v_din_time=request.body.dinnertime;
		}

		console.log(v_restaurant_name_bf+','+ v_item_name_bf,v_bf_time);
		console.log(v_restaurant_name_ln+','+ v_item_name_ln,v_ln_time);
		console.log(v_restaurant_name_din+','+ v_item_name_din,v_din_time);

		log.info('Calling DB to insert the selected order for User_Id:'+ v_customer_id );
	  sql = "SET @v_bf_chk = 0,@v_ln_chk=0,@v_din_chk = 0; CALL c_place_order(" + v_customer_id + ",'" +v_restaurant_name_bf+"','" + v_item_name_bf+"','"+v_restaurant_name_ln+"','" + v_item_name_ln+"','"+v_restaurant_name_din+"','" + v_item_name_din+"','"+v_bf_time+"','"+v_ln_time+"','"+v_din_time+"',@v_bf_chk,@v_ln_chk,@v_din_chk); SELECT @v_bf_chk,@v_ln_chk,@v_din_chk;"	
	
		mysql_connection.query(sql,function (err, query_results, fields) {
			
		if (err) {
			log.error('DB Error while placing the order');
			log.error(err);
			result.render('errorpage');
			}

		console.log(query_results[2][0]);

		var v_bf_chk = query_results[2][0]['@v_bf_chk'];
		var v_ln_chk = query_results[2][0]['@v_ln_chk'];
		var v_din_chk = query_results[2][0]['@v_din_chk'];
		
		log.info('Recieved result from db and sending response to orderconfirmation for User_Id:'+ v_customer_id );
		
		if(v_bf_chk == 1){
			log.info('Already placed a breakfast order for User_Id:'+ v_customer_id );
			result.render('orderconfirmation',{bf_chk:1,ln_chk:0,din_chk:0});
		}

		else if(v_ln_chk == 1){
			log.info('Already placed a lunch order for User_Id:'+ v_customer_id );
			result.render('orderconfirmation',{bf_chk:0,ln_chk:1,din_chk:0});
		} 

		else if(v_din_chk == 1){
			log.info('Already placed a dinner order for User_Id:'+ v_customer_id );
			result.render('orderconfirmation',{bf_chk:0,ln_chk:0,din_chk:1});
		} 

		else{
			log.info('Order Succesfully placed for User_Id:'+ v_customer_id );
			result.render('orderconfirmation',{bf_chk:0,ln_chk:0,din_chk:0});
		}
		});

	//End MySQL Connection
	mysql_connection.end();

}

// F5 To view Order History for the customer
function func_c_order_history(v_customer_id,request, result){
		
	console.log("Inside Function to get order history");
	var query_results="";
	var mysql_connection=createMySqlConnection();

	log.info('Calling DB to get the order history for User_Id:'+ v_customer_id );
	
	mysql_connection.query("SELECT name, item_name, meal_type, day_of_week, order_date,pickup_time FROM c_order_history_view where cust_id="+v_customer_id, function (err, query_results, fields) {
		if (err) {
			log.error('DB Error while getting the order history');
			log.error(err);
			result.render('errorpage');
			}

		if(isEmpty(query_results)) {
		log.info('Recieved result from db and sending response to vieworderhistory for User_Id:'+ v_customer_id );
		result.render('vieworderhistory',{items_present:'N',query_results:'No_Items'});

		} 
		else{
	  log.info('Recieved result from db and sending response to vieworderhistory for User_Id:'+ v_customer_id );
		result.render('vieworderhistory',{items_present:'Y',query_results:query_results});
		}
	});

mysql_connection.end();
}


// F6 To view the diet plan details
function func_c_get_diet_plan(v_customer_id,request, result){
		
	console.log("Inside Function to get personalized diet plan");
	var query_results="";
	var mysql_connection=createMySqlConnection();
	

	log.info('Calling DB to get the current diet plan for User_Id:'+ v_customer_id );

	mysql_connection.query("SELECT day,meal_type,calories,proteins,carbohydrates,fat FROM c_diet_plan_details where cust_id="+v_customer_id, function (err, query_results, fields) {
		if (err) {
			log.error('DB Error getting current diet plan');
			log.error(err);
			result.render('errorpage');
			}
		
		if(isEmpty(query_results)) {
		log.info('Recieved result from db and sending response to viewdietplan for User_Id:'+ v_customer_id );
		result.render('viewdietplan',{items_present:'N',query_results:'No_Items'});

		} 
		else{
		log.info('Recieved result from db and sending response to viewdietplan for User_Id:'+ v_customer_id );
		result.render('viewdietplan',{items_present:'Y',query_results:query_results});
		}
	});

mysql_connection.end();
}


// F7 To get start_date for the current diet plan a customer is raising a request
function func_c_request_change_diet_plan(v_customer_id,request, result){
		
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	log.info('Calling DB to get start_date for the current diet plan for User_Id:'+ v_customer_id );

	mysql_connection.query("SELECT cust_id,diet_start_date FROM c_diet_plan_details where cust_id="+v_customer_id+" group by cust_id,diet_start_date", function (err, query_results, fields) {
		
		if (err) {
			log.error('DB Error while getting the start date for current diet plan');
			log.error(err);
			result.render('errorpage');
			}

		var v_start_date = query_results[0]['diet_start_date'];
		
		v_start_date = new Date(v_start_date).toISOString().split('T')[0];
		// console.log("Start_date:",v_start_date);

		var v_end_date = new Date(query_results[0]['diet_start_date']);
		var numberOfDaysToAdd = 30;
        v_end_date.setDate(v_end_date.getDate() + numberOfDaysToAdd); 
        v_end_date = v_end_date.toISOString().split('T')[0];
		// console.log("End_date:",v_end_date);

		if(isEmpty(query_results)) {
		log.info('Recieved result from db and sending response to reqchangedp for User_Id:'+ v_customer_id );
		result.render('reqchangedp',{items_present:'N',query_results:'No_Items',start_date:v_start_date,end_date:v_end_date});

		} 
		else{
			log.info('Recieved result from db and sending response to reqchangedp for User_Id:'+ v_customer_id );
		result.render('reqchangedp',{items_present:'Y',query_results:query_results,start_date:v_start_date,end_date:v_end_date});
		}
	});

mysql_connection.end();
}


// F8 To request change in diet plan
function func_c_request_confirmation(v_customer_id,request, result){
	
	//Variable for Query results
	console.log("Inside Function to request for change in diet plan");

	//Create Mysql Connection
	var mysql_connection=createMySqlConnection();

	var v_request=request.body.desc;
	var v_input_date=request.body.input_date;

	console.log(v_request,v_input_date);

	log.info('Calling DB to request change in current diet plan for User_Id:'+ v_customer_id );

	sql = "SET @v_check = 0;CALL c_request_diet_plan_change(" + v_customer_id + ",'" +v_input_date+"','" + v_request + "',@v_check); SELECT @v_check;"
	
	mysql_connection.query(sql,function (err, query_results, fields) {
			
		if (err) {
			log.error('DB Error while requesting change in current diet plan');	
			log.error(err);
			result.render('errorpage');
			}

	  log.info('Recieved result from  db and sending response to requestconfirmation for User_Id:'+ v_customer_id );  
		result.render('requestconfirmation');	

		});

	//End MySQL Connection
	mysql_connection.end();

}

// F9 To view diet progress details
function func_c_get_diet_progress(v_customer_id,request, result){
		
	console.log("Inside Function to View Diet Progress");
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	log.info('Calling DB to get diet progress details in current diet plan for User_Id:'+ v_customer_id );
	mysql_connection.query("SELECT day,breakfast,lunch,dinner,additional_intake FROM c_diet_progress_details where cust_id="+v_customer_id, function (err, query_results, fields) {
		if (err) {
			log.error('DB Error while getting the updated diet progress');
			log.error(err);
			result.render('errorpage');
			}

		if(isEmpty(query_results)) {
		log.info('Recieved result from  db and sending response to viewdietprogress for User_Id:'+ v_customer_id );  
		result.render('viewdietprogress',{items_present:'N',query_results:'No_Items'});

		} 
		else{
		log.info('Recieved result from  db and sending response to viewdietprogress for User_Id:'+ v_customer_id );  
		result.render('viewdietprogress',{items_present:'Y',query_results:query_results});
		}
	});

mysql_connection.end();
}

// F10 To update diet progress daily
function func_c_update_confirmation(v_customer_id,request, result){
	
	//Variable for Query results
	var query_results="";

	//Create Mysql Connection
	var mysql_connection=createMySqlConnection();

	var v_breakfast=request.body.breakfast;
	var v_lunch=request.body.lunch;
	var v_dinner=request.body.dinner;
	var v_inputdate = request.body.input_date;
	var v_additional_intake=request.body.additional_intake;
	var v_data_check = 0;

	console.log(v_breakfast,v_lunch,v_dinner,v_additional_intake);
	log.info('Calling DB to update diet progress in current diet plan for User_Id:'+ v_customer_id );
	sql = "SET @v_count = 0; CALL c_update_diet_progress(" + v_customer_id + ",'"+ v_inputdate +"','" + v_breakfast + "','" +v_lunch+"','"+v_dinner+"','"+v_additional_intake+"',@v_count); SELECT @v_count;"	
	
	mysql_connection.query(sql,function (err, query_results, fields) {
			
		if (err) {
			log.error('DB Error while getting the update confirmation for diet progress');
			log.error(err);
			result.render('errorpage');
			}

		console.log(query_results[2][0])

		v_data_check=query_results[2][0]['@v_count'];
		if (v_data_check == 0){
			log.info('Recieved result from  db and sending response to updateconfirmation for User_Id:'+ v_customer_id );  
			result.render('updateconfirmation');
		}
		else{
			log.info('Overwrited the existing data for the input date for User_Id:'+v_cust_email_id);
			result.render('updateoverwrite');
		}

		});

	//End MySQL Connection
	mysql_connection.end();

}

//F11  To view diet history 
function func_c_get_diet_history(v_customer_id,request, result){
		
	console.log("Inside Function to View Diet History");
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	log.info('Calling DB to view diet history for User_Id:'+ v_customer_id );
	mysql_connection.query("SELECT * FROM c_diet_plan_list_view where cust_id="+v_customer_id, function (err, query_results, fields) {
		if (err) {
			log.error('DB Error while getting diet history');
			log.error(err);
			result.render('errorpage');
			}
		
		if(isEmpty(query_results)) {
		log.info('Recieved result from db and sending response to viewdiethistory for User_Id:'+ v_customer_id );
		result.render('viewdiethistory',{items_present:'N',query_results:'No_Items'});

		} 
		else{
		log.info('Recieved result from db and sending response to viewdiethistory for User_Id:'+ v_customer_id );
		result.render('viewdiethistory',{items_present:'Y',query_results:query_results});
		}
	});

mysql_connection.end();
}

//F12 To view diet history details
function func_c_get_diet_history_details(v_customer_id,request, result){
		
	console.log("Inside Function to View Diet History Details");
	var query_results="";
	var mysql_connection=createMySqlConnection();
	var v_dietician_dietplan_ID = request.body.customer_dietician_startdate_ID;
	var diet_arr = v_dietician_dietplan_ID.split(',');
	var v_dietician_id = diet_arr[0];
	var v_diet_plan_id = diet_arr[1];
	console.log(v_dietician_id,v_diet_plan_id);
	
	log.info('Calling DB to view diet history details for selected diet plan for User_Id:'+ v_customer_id );
	mysql_connection.query("SELECT day,meal_type,calories,proteins,carbohydrates,fat,followed,additional_intake FROM c_diet_history_view where cust_id="+v_customer_id+" and dietician_ID="+v_dietician_id+" and diet_plan_ID="+v_diet_plan_id, function (err, query_results, fields) {
		if (err) {
			log.error('DB Error while getting details of selected diet plan');
			log.error(err);
			result.render('errorpage');
			}
		
		if(isEmpty(query_results)) {
		log.info('Recieved result from db and sending response to viewdiethistorydetails for User_Id:'+ v_customer_id );
		result.render('viewdiethistorydetails',{items_present:'N',query_results:'No_Items'});

		} 
		else{
		log.info('Recieved result from db and sending response to viewdiethistorydetails for User_Id:'+ v_customer_id );
		result.render('viewdiethistorydetails',{items_present:'Y',query_results:query_results});
		}
	});

mysql_connection.end();
}

// F13 To display previous orders for customer to provide rating
function func_c_item_rating(v_customer_id,request, result){
		
	
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	log.info('Calling DB to to display previous orders for User_Id:'+ v_customer_id );
	mysql_connection.query("SELECT name,restaurant_id, item_name, meal_type, day_of_week, order_date, pickup_time FROM c_order_history_view where cust_id="+v_customer_id, function (err, query_results, fields) {
		if (err) {
			log.error('DB Error while rating an item');
			log.error(err);
			result.render('errorpage');
			}

		if(isEmpty(query_results)) {
			log.info('Recieved result from db and sending response to itemrating for User_Id:'+ v_customer_id );
		result.render('itemrating',{items_present:'N',query_results:'No_Items'});

		} 
		else{
		log.info('Recieved result from db and sending response to itemrating for User_Id:'+ v_customer_id );
		result.render('itemrating',{items_present:'Y',query_results:query_results});
		}
	});

mysql_connection.end();
}

// F14 Confirmation for item rating
function func_c_item_rating_confirmation(v_customer_id,request, result){
	
	//Variable for Query results
	var query_results="";

	//Create Mysql Connection
	var mysql_connection=createMySqlConnection();

	var v_restaurant_item_ID = request.body.restaurant_item_id;
	var v_arr = v_restaurant_item_ID.split(",");
	var v_restaurant_id = v_arr[0];
	var v_item_name = v_arr[1];
	var v_rating=request.body.rating;

	console.log("Selected :",v_arr);
	console.log("Selected Rating:",v_rating);
	
	log.info('Calling DB to insert the item rating for User_Id:'+ v_customer_id );

	sql = "SET @v_count = 0; CALL c_update_item_rating(" + v_customer_id + ","+ v_restaurant_id +",'" +v_item_name+"',"+ v_rating + ",@v_count); SELECT @v_count;"	
	

	mysql_connection.query(sql,function (err, query_results, fields) {
			
		if (err) {
			log.error('DB Error while  getting item rating confirmation');
			log.error(err);
			result.render('errorpage');
			}
	
		console.log(query_results[2][0]);

		var v_check = query_results[2][0]['@v_count'];

		if(v_check == 1){
			log.info('Already provided rating for this item with same User Id. So overwriting it with User_Id:'+ v_customer_id );
		}

			log.info('Recieved result from db and sending response to itemratingconfirmation for User_Id:'+ v_customer_id );
			result.render('itemratingconfirmation');
			

		});

	mysql_connection.end();

}

// F15 To display enrolled dieticians list for customer to provide rating
function func_get_dietician_rating(v_customer_id,request, result){
		
	console.log("Inside Function to get dietician list for rating purpose");
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	log.info('Calling DB to get dietician list for User_Id:'+ v_customer_id );
	mysql_connection.query("SELECT dietician_id, dietician_name,experience,qualification,diet_start_date FROM c_dietician_list_view where cust_id="+v_customer_id, function (err, query_results, fields) {
		if (err) {
			log.error('DB Error while rating the dietician');
			log.error(err);
			result.render('errorpage');
			}

		if(isEmpty(query_results)) {
		
		log.info('Recieved result from db and sending response to dieticianrating for User_Id:'+ v_customer_id );
		result.render('dieticianrating',{items_present:'N',query_results:'No_Items'});

		} 
		else{
			log.info('Recieved result from db and sending response to dieticianrating for User_Id:'+ v_customer_id );
		result.render('dieticianrating',{items_present:'Y',query_results:query_results});
		}
	});

mysql_connection.end();
}

// F16 Confirmation for dietician rating
function func_c_dietician_rating_confirmation(v_customer_id,request, result){
	
	//Variable for Query results
	var query_results="";

	//Create Mysql Connection
	var mysql_connection=createMySqlConnection();

	var v_dietician_id = request.body.dietician_id;
	var v_rating=request.body.rating;

	console.log("Selected dietician_Id :",v_dietician_id);
	console.log("Selected Rating:",v_rating);
	
	log.info('Calling DB to insert the dietician rating for User_Id:'+ v_customer_id );
	
	sql = "SET @v_count = 0; CALL c_update_dietician_rating(" + v_customer_id + ","+ v_dietician_id +"," + v_rating + ",@v_count); SELECT @v_count;"	
	
	mysql_connection.query(sql,function (err, query_results, fields) {
			
		if (err) {
			log.error('DB Error while getting dietician rating confirmation');
			log.error(err);
			result.render('errorpage');
			}
			
		console.log(query_results[2][0]);

		var v_check = query_results[2][0]['@v_count'];

		if(v_check == 1){
			log.info('Already provided rating for this dietician with same User Id. So overwriting it with User_Id:'+ v_customer_id );
		}

		log.info('Recieved result from db and sending response to dieticianratingconfirmation for User_Id:'+ v_customer_id );
		result.render('dieticianratingconfirmation');

		});

	//End MySQL Connection
	mysql_connection.end();

}

// C1
module.exports.c_get_customer_login = function(request, result)
{
	log.info('Recieved request to c_get_customer_login' );
	result.render('customerlogin');
	
};


// C2
module.exports.c_get_customer_logout =  function(request, result)
{
if (checkIfLoggedIn(request)=='Yes') 
{
	v_customer_id=request.session.customer_id;
	log.info('Recieved request to c_get_customer_logout for User_Id:'+ v_customer_id );
	func_c_get_customer_logout(request, result);
	}
else 
{
		result.render('customerlogin');
	  }
};


// C3
module.exports.c_post_customer_home = function(request, result)
{
	
	log.info('Recieved request to c_post_customer_home ');
	func_c_check_customer_login(request,result);
	
};

// C3.4
module.exports.c_post_start_date_page = function(request, result)
{
	
	log.info('Recieved request to c_post_start_date_page ');
	func_c_check_customer_login(request,result);
	
};



// C4
module.exports.c_get_customer_home = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_get_customer_home for User_Id:'+ v_customer_id );
		result.render('customerhome',{customer_id:request.session.customer_id,customer_email:request.session.customer_email});
	}

	else
	{
		result.render('customerlogin');
	}
	
	
};

// C5
module.exports.c_get_check_menu = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_get_check_menu for User_Id:'+ v_customer_id );
		func_c_get_menu(v_customer_id,request, result)
	}

	else
	{

		result.render('customerlogin');
	}
	
};



// C6
module.exports.c_order_confirmation = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_order_confirmation for User_Id:'+ v_customer_id );
		func_c_order_confirmation(v_customer_id,request, result)
	}

	else
	{

		result.render('customerlogin');
	}
	
};

// C7
module.exports.c_get_order_history = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_get_order_history for User_Id:'+ v_customer_id );
		func_c_order_history(v_customer_id,request, result)
	}

	else
	{

		result.render('customerlogin');
	}
	
};


// C8
module.exports.c_get_diet_plan = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_get_diet_plan for User_Id:'+ v_customer_id );
		func_c_get_diet_plan(v_customer_id,request, result)
	}

	else
	{

		result.render('customerlogin');
	}
	
};

// C9
module.exports.c_request_change_diet_plan = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_request_change_diet_plan for User_Id:'+ v_customer_id );
		func_c_request_change_diet_plan(v_customer_id,request, result)
	}

	else
	{

		result.render('customerlogin');
	}
	
};

// C10
module.exports.c_post_request_confirmation = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_post_request_confirmation for User_Id:'+ v_customer_id );
		func_c_request_confirmation(v_customer_id,request,result);
	}

	else
	{
		result.render('customerlogin');
	}
		
};


// C11
module.exports.c_get_diet_progress = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_get_diet_progress for User_Id:'+ v_customer_id );
		func_c_get_diet_progress(v_customer_id,request, result)
	}

	else
	{

		result.render('customerlogin');
	}
	
};

// C12
module.exports.c_update_diet_progress = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{	log.info('Recieved request to c_update_diet_progress for User_Id:'+ v_customer_id );
		result.render('updatedietprogress');
	}

	else
	{

		result.render('customerlogin');
	}
	
};

// C13
module.exports.c_post_update_confirmation = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{

		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_post_update_confirmation for User_Id:'+ v_customer_id );
		func_c_update_confirmation(v_customer_id,request,result);
	}

	else
	{
		result.render('customerlogin');
	}
	
	
};

// C14
module.exports.c_get_diet_history = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_get_diet_history for User_Id:'+ v_customer_id );
		func_c_get_diet_history(v_customer_id,request, result)
	}

	else
	{

		result.render('customerlogin');
	}
	
};

// C15
module.exports.c_get_diet_history_details = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_get_diet_history_details for User_Id:'+ v_customer_id );
		func_c_get_diet_history_details(v_customer_id,request, result)
	}

	else
	{

		result.render('customerlogin');
	}
	
};


// C16
module.exports.c_get_item_rating = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_get_item_rating for User_Id:'+ v_customer_id );
		func_c_item_rating(v_customer_id,request,result);
		
	}

	else
	{

		result.render('customerlogin');
	}
	
};

// C17
module.exports.c_post_item_rating_confirmation = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{

		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_post_item_rating_confirmation for User_Id:'+ v_customer_id );
		func_c_item_rating_confirmation(v_customer_id,request,result);
	}

	else
	{
		result.render('customerlogin');
	}
	
	
};


// C18
module.exports.c_get_dietician_rating = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_get_dietician_rating for User_Id:'+ v_customer_id );
		func_get_dietician_rating(v_customer_id,request,result);
		
	}

	else
	{

		result.render('customerlogin');
	}
	
};

// C19
module.exports.c_post_dietician_rating_confirmation = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{

		v_customer_id=request.session.customer_id;
		log.info('Recieved request to c_post_dietician_rating_confirmation for User_Id:'+ v_customer_id );
		func_c_dietician_rating_confirmation(v_customer_id,request,result);
	}

	else
	{
		result.render('customerlogin');
	}
	
	
};

// C20
module.exports.c_get_error_page = function(request, result)
{
	log.error('***************** 404 Error....Please restart the application ****************' );
	result.render('errorpage');
	
};



/*******************************************************************************
 * *********************** Admin Module ****************************
 ******************************************************************************/


//************************************************************   ADMIN   **************************************************************/

module.exports.a_get_admin_login = function(request, result)
{
    log.info('Recieved request to a_get_admin_login ');
    result.render('adminlogin');
};


module.exports.a_post_admin_home = function(request, result)
{
	log.info('Recieved request to a_post_admin_home' );
	func_a_check_admin_login(request,result);
	
};


module.exports.a_get_admin_home = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_admin_id=request.session.admin_id;
		log.info('Recieved request to a_get_admin_home for ADMIN ID :'+ v_admin_id );
		result.render('adminhome')
	}
	else
	{
		result.render('adminlogin');
	}
};

//CHECK IF ADMIN LOGIN INFORMATION IS CORRECT.
function func_a_check_admin_login(request, result){
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	var v_admin_email_id=request.body.userid;
	var v_password=request.body.pwd;
	var v_admin_login_check=0;

	log.info("Calling DB to validate admin credentials for admin ID: " + v_admin_email_id);
	sql = "SET @v_count = 0,@v_admin_id=0; CALL a_check_admin_login_info('" + v_admin_email_id + "','" + v_password + "', @v_count,@v_admin_id); SELECT @v_count,@v_admin_id;"
	mysql_connection.query(sql, function (err, query_results) {
				if (err) 
				{
					log.error('DB Error while validating the credentials for admin ID: ' + v_admin_id);
					log.error(err);
					result.render('/errorpage');
				}
				
				v_admin_login_check=query_results[2][0]['@v_count'];
			  v_admin_id=query_results[2][0]['@v_admin_id'];

			    if (v_admin_login_check==1)
			    {

					request.session.admin_id = v_admin_email_id;
					log.info('Recieved result from DB confirming the credentials are valid for ADMIN ID :'+  v_admin_id);
					request.session.loggedin='Yes';

					result.render('adminhome')
				}
			   else
				{
					log.error('Invalid Credentials entered for ADMIN ID :' + v_admin_id);
					result.render('loginfail');
				}
			});
	mysql_connection.end();
		}



//*********************************************************REGISTER DIETICIAN*************************************************************//

module.exports.d_get_dietician_registration = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_admin_id=request.session.admin_id;
		log.info('Recieved request to d_get_dietician_registration for ADMIN ID :'+ v_admin_id );
		result.render('registerdietician')
	}
	else
	{
		result.render('adminlogin');
	}
};


module.exports.d_post_regdietsuccesful = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_admin_id=request.session.admin_id;
		log.info('Recieved request to d_post_regdietsuccesful for admin ID: ' + v_admin_id);
		func_d_ins_dietician_registration_details(v_admin_id, request,result);
	}
	else
	{
		result.render('adminlogin');
	}
};

//INSERT VALUES FROM REGISTER DIETICIAN PAGE TO DB
function func_d_ins_dietician_registration_details(v_admin_id, request, result){
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	var dieticianname=request.body.dieticianname;
	var emailid=request.body.emailid;
	var pwd = request.body.pwd;
	var experience = request.body.experience;
	var qualification = request.body.qualification;

	var v_dietn_regdetails_check=0;
	
	log.info("Calling DB to insert dietician details for admin ID: " + v_admin_id);
	sql = "set @vc = 0, @eid=0; CALL proc_d_ins_dietn_regn_details('" + dieticianname + "','" + emailid + "','" + pwd + "','" + experience + "','" + qualification + "', @vc, @eid); select @vc;"

	mysql_connection.query(sql, function (err, query_results) {
				if (err) {
					log.error('DB Error while inserting dietician registration details for admin ID:' + v_admin_id);
					log.error(err);
					result.render('errorpage');
				}

				check_ins = query_results[2][0]['@vc'];
			    if (check_ins==1)
			    {
					log.info("Inserted to DB dietician details for admin ID and dietician: " + v_admin_id + " " + emailid);
					result.render('regdietsuccesful')
				}
			   else
				{
					log.error('EmailID already exists'+ emailid);
			    	result.render('registrationfail');
				}
			});
	mysql_connection.end();
		}


//***************************************************     REGISTER RESTAURANT   ************************************************************//

module.exports.r_get_restaurant_registration = function(request, result)
{
	if(checkIfLoggedIn(request)=='Yes')
	{
		v_admin_id=request.session.admin_id;
		log.info('Recieved request to r_get_restaurant_registration for ADMIN ID :'+ v_admin_id );
		result.render('registerrestaurant')
	}
	else
	{
		return result.redirect('/adminlogin');
	}
};


module.exports.r_post_restaurant_registration = function(request, result)
{
	  log.info("Recieved request to r_post_restaurant_registration for admin ID: "+ v_admin_id);
    func_r_ins_restaurant_registration_details(v_admin_id, request,result);
};


//INSERT VALUES FROM REGISTER RESTAURANT PAGE TO DB
function func_r_ins_restaurant_registration_details(v_admin_id, request, result){
	var query_results="";
	var mysql_connection=createMySqlConnection();
	
	var rest_name = request.body.restname;
	var rest_email=request.body.emailid;
	var rest_pwd = request.body.pwd;
	var rest_location = request.body.restlocation;

	log.info("Calling DB to insert restaurant details for admin ID: " + v_admin_id);
	sql = "set @vc = 0, @eid=0; CALL proc_r_ins_rest_details('" + rest_name + "','" + rest_email + "','" + rest_pwd + "','" + rest_location + "', @vc, @eid); select @vc;"	
	mysql_connection.query(sql, function (err, query_results) {

				if(err) {
					log.error('DB Error while inserting restaurant registration details for admin ID: '+ v_admin_id);
					log.error(err);
					result.render('errorpage');
				}
				check_ins = query_results[2][0]['@vc'];
			    if (check_ins==1)
			    {
					log.info("Inserted to DB restaurant details for ADMIN_ID and RESTAURANT : " + v_admin_id + " " + rest_email);
					result.render('regrestsuccesful')
				}
			   else
				{
					log.error('EmailID already exists'+ rest_email);
			    	result.render('registrationfail');
				}
			});
	mysql_connection.end();
}

// ******************************** ADMIN LOGOUT ****************************
function func_c_get_admin_logout(request, result){

	request.session.destroy(function(err) {
		if(err) {
			return next(err);
		} else {
			log.info('Admin Logged Out Succesfully');
			 result.render('adminlogin');
		}
		});
};


module.exports.c_get_admin_logout =  function(request, result)
{
	if (checkIfLoggedIn(request)=='Yes') 
	{
		v_admin_id=request.session.admin_id;
		log.info('Recieved request to c_get_admin_logout for User_Id:'+ v_admin_id );
		func_c_get_admin_logout(request, result);
		}
	else 
	{
			result.render('adminlogin');
		}
};


// ******************************** LOGIN FAIL ****************************
module.exports.login_fail = function(request, result)
{
    result.render('loginfail');
};

// ********************************  REGISTRATION FAIL  ****************************
module.exports.registration_fail =  function(request, result)
{
	result.render('registrationfail');
};

// ********************************  ERROR  PAGE  ****************************
module.exports.error_page =  function(request, result)
{
	result.render('errorpage');
};




module.exports.get_contactform = function(request, result)
{
	log.info('Recieved request to get contact form');
	result.render('contactform',{cust_message:"Please enter your message and contact details! We will get back to you soon!"});

};


function func_updatecontactform(request,result)
{
    var contact_email_id = request.body.email_id;
    var contact_message  = request.body.contact_message;
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://localhost:27017/";
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("mealmanager");
	  var contact_message_time=new Date().toLocaleString();
		console.log(contact_message_time);
		dbo.collection("contactform").updateOne({name:contact_email_id},	
	{	 $addToSet: {message:[ contact_message,contact_message_time]}   , $set: { update_timestamp: contact_message_time} },
		{ upsert: true }, function(err, res) {
	    if (err) {
				throw err;}
				else{
					log.info('Sending success message for contact form');

					result.render('contactform',{cust_message:"Your message has been conveyed. You can add more messages with the same contact id."});

				}
	    //console.log("Number of documents inserted: " + res.insertedCount);
      });

    });


	}


	
module.exports.update_contactform = function(request, result)
{
	log.info('Recieved request to update contact form');
	func_updatecontactform(request,result);
	console.log(request.body);

};


function func_get_contactform_message_names(request,result)
{
	var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mealmanager");
    var crimeDetails = "";
    dbo.collection("contactform").find().sort( { update_timestamp: -1 } ).toArray(function(err, res) {
    if (err) throw err;
console.log("her");
log.info('Sending contactid list for contact form');

if(isEmpty(res)) {
	result.render('contactformmessages_list',{infomessage:"No messages", msg:'N'});

}
else{

result.render('contactformmessages_list',{infomessage:res, msg:'Y'});
console.log("in here");

}
    }); });

	}



	function func_contactidallmessages(request,result)
	{
		var MongoClient = require('mongodb').MongoClient;
			var url = "mongodb://localhost:27017/";
	
			MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
			if (err) throw err;
			var dbo = db.db("mealmanager");
			dbo.collection("contactform").find({"name":request.body.contactid}).toArray(function(err, res) {
			if (err) throw err;
	console.log("get_contactidallmessages");
	log.info('Sending messages for selected contact id');

	if(isEmpty(res)) {
		console.log("nodetails ****");

		result.render('contactidallmessages',{infomessage:"No messages", msg:'N'});
	
	}
	else{

	//result.render('contactformmessages_list',{message:"Please enter your message and contact details! We will get back to you soon!"});
	result.render('contactidallmessages',{infomessage:res, msg:'Y'});

	}
			}); });
	
		}

module.exports.get_contactform_message_names = function(request, result)
{
	console.log("get_contactform_message_names");
	func_get_contactform_message_names(request,result);
	console.log(request.body);

};




module.exports.get_contactidallmessages = function(request, result)
{
	console.log("get_contactidallmessages");
	func_contactidallmessages(request,result);
	console.log(request.body);

};