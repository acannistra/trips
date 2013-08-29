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


exports.allTrips = function(req, res){

	redisClient.keys('*', function(err, replies){
		var trips = [];

		var count = replies.length;
		function next() {
			if (--count === 0) {
				res.json(trips);
			}
		}

		var addToQuery = function (err, results) {
			var query = results;
			if(query){trips.push(query);}
			next();
		};

		for (var i in replies) {
			if(i != 'asOf'){
				redisClient.hgetall(replies[i], addToQuery);
			}
		}

	});	
};



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