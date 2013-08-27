var http    = require("http"), 
	request = require("request");


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
