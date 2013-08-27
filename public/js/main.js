/* jshint: node */
/* client javascript */

var typeColors = {};
var types      = {};
var trips_ref  = {};
var ref_colors = ['#A6B170', '#7FA292',
                 '#98A148', '#FA9A50',
                 '#FF7256', '#FF6347',
                 '#A9A18C', '#BDD09F'];

google.maps.event.addDomListener(window, 'load', map_init);
$(document).ready(function(){
  var tripsURL = "http://www.tuftsmountainclub.org/api/trips.php?action=list";
  $.getJSON(tripsURL, function(data){
    trips_ref = data;


    types = $.unique(data.map(function(a){return a.category.toLowerCase()}));
    page_init();
   });

});

function page_init(){
  assignColors(types);
  initBreakdown(types);
}





function assignColors(types){
  for (var i = types.length - 1; i >= 0; i--) {
    type = types[i];
    typeColors[type] = randomColor(ref_colors);
  };
}

function randomColor(colors){
  return 'rgb(' + (Math.floor((200)*Math.random()) + 90) + ',' + 
                                    (Math.floor((200)*Math.random()) + 90) + ',' + 
                                    (Math.floor((200)*Math.random()) + 90) + ')';

  // return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  // var color_index = Math.floor(Math.random() * colors.length);
  // return colors[color_index];
}

var map;

function map_init() {
  center = new google.maps.LatLng(-34.397, 150.644);
  var mapOptions = {
    zoom: 8,
    center: center,
    mapTypeId: google.maps.MapTypeId.TERRAIN
  };

  map = new google.maps.Map($('#map_big')[0],
      mapOptions);

  codeAddress("white mountain national forest");

  google.maps.event.addDomListener(window, 'resize', function() {
      map.setCenter(center);
  });
}


function codeAddress(address) {
	var geocoder = new google.maps.Geocoder();
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
  }



function initBreakdown(types){
  var numItems = types.length;
  var breakdown = $("#breakdown")
  for (var i = 0; i < numItems; i++) {
    var title = $(document.createElement('div')).addClass("bar-elem-title").html(types[i]);
    var elem = $(document.createElement('div')).addClass("bar-elem").css({'width': ((1/numItems)*100)+'%', 'background-color': typeColors[types[i]]}).append(title)
    breakdown.append(elem);
    console.log(elem);
  };
}