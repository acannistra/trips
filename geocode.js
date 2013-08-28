var redis = require('redis'),
	gmaps = require('googlemaps'),
	request = require('request'),
	events = require('events'),
	redisClient = redis.createClient();

gmaps.geoBounds = '40.797177,-75.06958|46.815099,-68.334961'


var eventEmitter = new events.EventEmitter();
// var delay = 500;

var calls = []

function start(array){
	function next(){
		array[0]();
		array.shift();
	}
	eventEmitter.on('geo_finish', next);
	next();
}

redisClient.keys('*', function(err, replies){
	var numReplies = replies.length;
	replies.forEach(function(reply){
		console.log('on '+reply)
		redisClient.hget(reply, 'destination', function(err, data){
			calls.push(function(){geocode(data, reply)});
			if(calls.length == numReplies){
				start(calls);
			}
		});
	});
});


function geocode(location, tripID){
	gmaps.geocode(location, function(err, data){
		if(err){
			console.log('geoerr: '+location);
		}
		else{
			console.log('  coding '+location)
			location = JSON.stringify(data.results[0].geometry);
			redisClient.hset(tripID, 'latlng', location, function(err, reply){eventEmitter.emit('geo_finish');console.log("GEO: "+reply)});		}
	})
}

// function series(callbacks, last) {
//   var results = [];
//   function next() {
//     var callback = callbacks.shift();
//     if(callback) {
//       callback(function() {
//         results.push(Array.prototype.slice.call(arguments));
//         next();
//       });
//     } else {
//       last(results);
//     }
//   }
//   next();
// }
// // Example task
// function async(arg, callback) {
//   var delay = Math.floor(Math.random() * 5 + 1) * 100; // random ms
//   setTimeout(function() { geocode(); }, delay);
// }
// function final(results) { console.log('Done', results); }

// series([
//   function(next) { geocode(1, next); },
//   function(next) { geocode(2, next); },
//   function(next) { async(3, next); },
//   function(next) { async(4, next); },
//   function(next) { async(5, next); },
//   function(next) { async(6, next); }
// ], final);