var http    = require("http"), 
	request = require("request"),
	Forecast = require('forecast.io'),
	gm = require('googlemaps');

var forecastOptions = 
	{ 
		APIKey: '7516bbf0f9e3cf4343c3744256fd183d',
	};
var forecast = new Forecast(forecastOptions);

//init gmaps
gm.geoBounds = '40.797177,-75.06958|46.815099,-68.334961';

/* TRIPS TRIPS TRIPS */

var tripsURL = 'http://www.tuftsmountainclub.org/api/trips.php?action=list';

exports.pushTrip = function(req, res){
	tripID = req.body.id;
	tripDestination = req.body.destination;
	console.log(tripID);
	console.log(tripDestination);
}

function geocode (location, callback){
	var ms = new Date().getTime();
	while(true){
		if(ms % 500 == 0){
			gm.geocode(location, callback, true, gm.geoBounds);
			break;
		}
		else{
			ms = new Date().getTime();
		}
	}
}

exports.weather = function (req, res){
	lat  = req.params.lat;
	lng  = req.params.lng
	time = req.params.at;

	forecast.getAtTime(lat, lng, time, {exclude: 'currently,minutely,hourly'}, function(err, resp, data){
		if(err) console.log(err);
		res.json(data);
	})



}

exports.getTrip = function(req, res){
	tripID = req.query.id;
	console.log(tripID)
}
