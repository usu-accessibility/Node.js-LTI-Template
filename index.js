require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const sql = require('./src/services/sql-service');
const elastiCache = require('./src/services/elasti-cache-service');
const session = require('express-session');
const cookieParser = require("cookie-parser");
const path = require('path');
const querystring = require('querystring');

const app = express();
const port = process.env.PORT || 3003;
const oneDay = 1000 * 60 * 60 * 24;

app.use(session({secret:"nevergiveupinlife", cookie: { maxAge: oneDay }, saveUninitialized: true, resave: false}));
app.use(cookieParser());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.use(express.static(__dirname + "/build"));
app.use(bodyParser.json()); //Handles JSON requests
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

require('./src/routes/action-get')(app, session);
require('./src/routes/action-post')(app, session);

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname,  "/build/app.html"));
});

app.post('/health', function (req, res) {
    // app.use(session({...req.body, secret:"nevergiveupinlife", cookie: { maxAge: 1200000 }, saveUninitialized: false, resave: true}));
    session.canvas_data = {};

    // Assuming you have access to the session and cookies in your JavaScript environment
    session.canvas_data.canvasDomain = req.body.custom_canvas_api_domain;
    session.canvas_data.canvasUserID = req.body.custom_canvas_user_id;
    session.canvas_data.oauthConsumerKey = req.body.oauth_consumer_key;
    
    session.canvas_data.fullName = req.body.lis_person_name_full;
    session.canvas_data.domain = req.body.custom_canvas_api_domain;
    session.canvas_data.userID = req.body.custom_canvas_user_id;
    session.canvas_data.login_id = req.body.custom_canvas_user_login_id;
    session.canvas_data.email_primary = req.body.lis_person_contact_email_primary;
    session.canvas_data.name_given = req.body.lis_person_name_given;
    session.canvas_data.user_image = req.body.user_image;
    session.canvas_data.canvasURL = 'https://' + req.body.custom_canvas_api_domain;
    session.canvas_data.courseName = req.body.context_title;
    session.canvas_data.role = req.body.roles;
    session.canvas_data.roleName = req.body.lis_person_name_full;
    session.skippedImages = []

    if (session.canvas_data.role && session.canvas_data.role.includes('Instructor')) {
        session.at_admin = true;
    } else {
        session.at_admin = false;
    }

    res.sendFile(path.join(__dirname,  "/build/app.html"));
});
  
sql.connectToDatabase();
elastiCache.connectToRedis();

app.listen(port, () => {
    console.log("server running on port 3001");
});