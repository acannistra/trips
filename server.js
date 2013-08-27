/* jshint node: true */
/**
 * Module dependencies.
 */

//  Configure express
var express = require('express'),
    http = require('http'),
    routes = require('./routes'),
    api = require('./routes/api')
    path = require('path');
//  Configure DUST
var dust = require('consolidate').dust;

var app = express();

// Configure environments
app.engine('dust' , dust);
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'dust');
app.use(express.favicon('public/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, '/public')));


app.get('/', routes.index);
app.get('/api/trips/upcoming', api.upcomingTrips);
app.get('/api/trips/all', api.allTrips);

//  Create the server, start listening
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

