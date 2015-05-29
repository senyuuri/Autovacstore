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
// passport configuration
var passport = require('passport');
var flash    = require('connect-flash');
var cookieParser = require('cookie-parser');
var session      = require('express-session');
var database = require('./routes/database');

var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: false
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
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8090;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**  TODO
     *  Populate the cache.
     *

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
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        //self.createRoutes();
        self.app = express();
        //  Set view engine as jade
        self.app.set('views', path.join(__dirname, 'views'));
        self.app.set('styles', express.static(__dirname, 'styles'));
        self.app.set('view engine', 'jade');
        self.app.use('/static', express.static(__dirname + '/static'));
        // Passport initialisation
        self.app.use(cookieParser());
        self.app.use(session({ secret: 'wcmwcmwcmwcmbendan' })); // session secret
        self.app.use(passport.initialize());
        self.app.use(passport.session()); // persistent login sessions
        self.app.use(flash()); // use connect-flash for flash messages stored in session

    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        console.log(">>>>>>>>>> Fn(initialize) start >>>>>>>>>>");
        self.setupVariables();
        //self.populateCache();
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

var visitorLog = function(req, res, next){
    var user = null;
    var method = req.method;
    if (typeof(req.user)!='undefined' ){
        user = req.user.username;
    };
    var ip = req.headers['x-forwarded-for'] || 
        req.connection.remoteAddress || 
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    var user_agent = req.headers['user-agent'];
    var request = req.url;
    console.log("Visitor:",user,method,request);
    //add to databse
    database.addVisitorLog(user,ip,user_agent,request,method,function(err,rows){
        if (err) console.log(err);
        next();
    });   
}   


/* ================================================================  */
/*  main():  Main code.                                              */
/*  ================================================================ */

/**
 *  Start server.
 */
var osapp = new OpenshiftApp();
osapp.initialize();
osapp.start();
osapp.app.use(visitorLog);


var overview = require('./routes/overview');
var login = require('./routes/login');
// var settings = require('./routes/settings');
var addOrder = require('./routes/addOrder');
var undelivered = require('./routes/undelivered');
var delivered = require('./routes/delivered');
var postman = require('./routes/postman');
var tracking = require('./routes/tracking');    
var staff = require('./routes/staff');
// var products = require('./routes/products');



osapp.app.use('/', overview);
osapp.app.use('/auth',login);
//osapp.app.use('/settings',settings);
osapp.app.use('/addOrder', addOrder);
osapp.app.use('/undelivered',undelivered);
osapp.app.use('/delivered',delivered);
osapp.app.use('/postman',postman);
osapp.app.use('/tracking',tracking);
osapp.app.use('/staff',staff);
// osapp.app.use('/products',products);


