#!/bin/env node
// TODO 
/* nodetime NOT compatible with node v0.12
var nodetime = require('nodetime').profile({
    accountKey: 'db80fdbd62208b6155d385333d35bcc0aa03686f', 
    appName: 'Node.js Application'
});
*/
var express = require('express');
var fs      = require('fs');
var jade    = require('jade');
var path    = require('path');
var mysql   = require('mysql');
var bodyParser = require('body-parser');
var connection = mysql.createConnection({
  host     : process.env.OPENSHIFT_MYSQL_DB_HOST,
  port     : process.env.OPENSHIFT_MYSQL_DB_PORT,
  user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME,
  password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD
});

/* ================================================================  */
/*  Server initialisation. (DO NOT MODIFY)                           */
/*  ================================================================ */

var OpenshiftApp = function() {

    //  Scope.
    var self = this;

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };

    /**
    *  Create database connection.
    */

    self.connectDB = function() {
        connection.connect(function(err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }

            console.log('connected as id ' + connection.threadId);
        });
       
        connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
            if (err) throw err;
            console.log('The solution is: ', rows[0].solution);
        });
    };
    
    

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        //self.createRoutes();
        self.app = express();
        //  Set view engine as jade
        self.app.set('views', path.join(__dirname, 'views'));
        self.app.set('view engine', 'jade');
        // TEST
        // Using separate js files under "/routes"

        //  Add handlers for the app (from the routes).
        /*
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
        */
        self.connectDB();
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        console.log(">>>>>>>>>> Fn(initialize) start >>>>>>>>>>");
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };
};   



/* ================================================================  */
/*  Database Handlers                                                */
/*  ================================================================ */

var DBHandler = function() {
    //  Scope.
    var self = this;

    self.add_staff = function(username, password){
        next();
    }
};




/* ================================================================  */
/*  main():  Main code.                                              */
/*  ================================================================ */

/**
 *  Start server.
 */
var osapp = new OpenshiftApp();
osapp.initialize();
osapp.start();

var adminPanel = require('./routes/admin_panel');
var addStaff = require('./routes/add_staff')
var delivery_sys = require('./routes/delivery_sys');

osapp.app.use('/', adminPanel);
osapp.app.use('/addstaff', addStaff);
osapp.app.use('/mobile', delivery_sys);


/**
var routes = {};
var router = express.Router();



 *  MAIN APP LOGIC
 */
/**
 *  Create the routing table entries + handlers for the application.
 */
 /*

routes['index'] = function(req, res){
    res.render('index', { title: 'Express' });
};

osapp.app.get('/', routes['index']);




routes['add_staff'] = function(req, res){
    res.render('add_staff', { title: 'Autovacstore'});
};

osapp.app.get('/add_staff', routes['add_staff']);

*/
/*
router.route('/')
.get(function(req, res, next) {
  res.render('index', { title: 'Express' });
});

*/
