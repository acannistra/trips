/* jshint: node */
/* client javascript */


var weekday=new Array(7);
weekday[0]="Sunday";
weekday[1]="Monday";
weekday[2]="Tuesday";
weekday[3]="Wednesday";
weekday[4]="Thursday";
weekday[5]="Friday";
weekday[6]="Saturday";

var typeColors = {};
var typeCounts = {};  
var types      = [{ 
                    name:  'hiking',
                    color: '#BDD09F', 
                    number: 0
                  },
                  {
                    name:  'climbing',
                    color: '#778899',
                    number: 0
                  },
                  {
                    name:  'general',
                    color: '#FF6347',
                    number: 0
                  },
                  {
                    name: 'aqua',
                    color: '#87CEEB',
                    number: 0
                  }];

var trips_ref  = {};
var ref_colors = ['#A6B170', '#7FA292',
                 '#98A148', '#FA9A50',
                 '#FF7256', '#FF6347',
                 '#A9A18C', '#BDD09F'];

var tripBox = '<div class="pure-u-1-4" style="opacity: 0;" >' + 
                '<div class="box" id="{{title}}_box" style="background-color: {{color}}">'+
                  '<div class="box-content">'+
                    '<div class="title">'+
                      '{{title}}'+
                    '</div>'+
                    '<div class="date">'+
                      '{{date}}'+
                    '</div>'+
                  '</div>'+
                '</div>'+
              '</div>';

google.maps.event.addDomListener(window, 'load', map_init);
$(document).ready(function(){
  var tripsURL = 'http://www.tuftsmountainclub.org/api/trips.php?action=list';//"/api/trips/upcoming";
  $.getJSON(tripsURL, function(data){
    trips_ref = data;
    page_init();
   });

});

function page_init(){
  initBreakdown(types);
  loadTrips(trips_ref);
  updateBreakdown(types);

}

function loadTrips(trips){
  for (var i = trips.length - 1; i >= 0; i--) {
    var category = trips[i].category.toLowerCase()
    var tripData = 
      {
        'title': trips[i].destination,
        'date' : trips[i].departDate,
        'color': typeColors[trips[i].category.toLowerCase()]
      };
    var new_tripBox = $(Mustache.to_html(tripBox, tripData));
    $("#trips_grid").prepend(new_tripBox);
    new_tripBox.animate({'opacity': 1}, 'slow');
    $.each(types, function(i,v){
      if(v.name === category){
        ++v.number;
      }
    })
  };
  $("#no_trips").animate({'opacity': 1}, 'slow');
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
  center = new google.maps.LatLng(42.996612,-71.400146);
  var mapOptions = {
    zoom: 7,
    center: center,
    mapTypeId: google.maps.MapTypeId.TERRAIN
  };

  map = new google.maps.Map($('#map_big')[0],
      mapOptions);


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



function updateBreakdown(types){
  var numItems = types.reduce(function(sum, curr){
    return sum + curr.number;
  }, 0);
  for (var i = types.length - 1; i >= 0; i--) {
    var width = (types[i].number/numItems) * 100;
    $("#"+types[i].name+"_bar").animate({"width" : width+"%"}, 'slow');
    console.log(width);

  };
}

function initBreakdown(types){
  var numItems = types.length;
  var breakdown = $("#breakdown")
  for (var i = 0; i < numItems; i++) {
    type = types[i]
    typeColors[type.name] =  type.color;
    typeCounts[type.name] = 0
    var title = $(document.createElement('div')).addClass("bar-elem-title").html(type.name);
    var elem = $(document.createElement('div')).addClass("bar-elem").attr('id', type.name+"_bar").css({'width': ((1/numItems)*100)+'%', 'background-color': type.color}).append(title)
    breakdown.append(elem);
    console.log(elem);
  };
}