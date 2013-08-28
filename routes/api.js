var http    = require("http"), 
	request = require("request"),
	redis = require('redis'),
	redisClient = redis.createClient(),
	gm = require('googlemaps');


//init redis
redisClient.on("error", function (err) {
	console.log(err);
});

//init gmaps
gm.geoBounds = '40.797177,-75.06958|46.815099,-68.334961';

/* TRIPS TRIPS TRIPS */

var tripsURL = 'http://www.tuftsmountainclub.org/api/trips.php?action=list';


exports.upcomingTrips = function(req, res){
	var today = new Date("2013/01/01");
	request(tripsURL, function(err, resp, body) {
		all_trips =  JSON.parse(body);
		sendme = all_trips.filter(function(elem){
			departDate = new Date(elem.departDate.replace(/-/g, "/"))
			return  departDate >= today
		})
		res.json(sendme);
		console.log(sendme)})
};

exports.allTrips = function(req, res){
	request(tripsURL, function(err, resp, body) {
		all_trips =  JSON.parse(body);
		res.json(all_trips);
	});
}

exports.pushTrip = function(req, res){
	tripID = req.body.id;
	tripDestination = req.body.destination;
	console.log(tripID);
	console.log(tripDestination);

	redisClient.hset(tripID, "destination", tripDestination, function (err, reply){
		redisClient.hexists(tripID, 'latlng', function(err, exists){
			if(!exists){
				geocode(tripDestination, function(err, data){
					if(err){
						console.log("geocode: "+err);
					}
					else{	
						console.log("geocode: success ("+tripDestination+")")

						location = JSON.stringify(data.results[0].geometry);
						console.log("STORED: "+location)
						redisClient.hset(tripID, 'latlng', location, function(err, reply){console.log("GEO: "+reply)});
					}
				})
			}
		});
	});
	redisClient.hget(tripID, "destination");

	res.send("OK");

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

exports.getTrip = function(req, res){
	tripID = req.query.id;
	console.log(tripID)
	redisClient.hgetall(tripID, function (err, replies) {
		res.json(200, replies);
	})
}