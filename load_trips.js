var redis = require('redis'),
	request = require('request'),
	redisClient = redis.createClient();

var tripsURL = 'http://www.tuftsmountainclub.org/api/trips.php?action=list&days=200';

request(tripsURL, function(err, response, body){
	var asOf = new Date().getTime()
	redisClient.set('asOf', asOf);

	tripsJSON = JSON.parse(body);
	tripsJSON.forEach(function(elem){
		console.log(elem)
		var trip = elem;
		var tripID = trip.leaderUsername+'-'+trip.departDate.split(" ", 1)
		redisClient.exists(tripID, function(err, exists){
			if(!exists){
				console.log('saving '+tripID);
				redisClient.hmset(tripID, {
					'description': trip.description,
					'leaderName' : trip.leaderName,
					'leaderEmail': trip.leaderEmail,
					'leaderPhone': trip.leaderPhone,
					'category'	 : trip.category,
					'destination': trip.destination,
					'departDate' : trip.departDate,
					'returnDate' : trip.returnDate,
					'gear'       : trip.gear,
					'level'	     : trip.level,
				}, redis.print);
			}
			else{
				console.log("skipping "+tripID)
			}
		});
		console.log('still in map')

		
	});
	console.log('done')

});