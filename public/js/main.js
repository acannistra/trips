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
                '<div class="box {{category}}_color" id="{{id}}_box">'+
                  '<div class="box-content">'+
                    '<div class="title">'+
                      '{{title}}'+
                    '</div>'+
                    '<img class="type_ico" src="img/ico/{{category}}.png"></img>'+
                    '<div class="date">'+
                      '{{date}}'+
                    '</div>'+
                  '</div>'+
                '</div>'+
              '</div>';

var infoBox_template = '<div class="infobox">' +
                        '<div class="ib-container">'+
                          '<div class="ib-title">'+
                            '{{title}}'+
                       '</div>'+
                       '<div class="ib-descrip">'+
                          '{{description}}'+
                       '</div>'+
                        '<div class="buttons">'+
                          'TBD'+
                        '</div>'+
                    '</div>'+
                  '</div>';

var infoBox_options = {
  disableAutoPan: false
  ,maxWidth: 0
  ,pixelOffset: new google.maps.Size(-140, 0)
  ,zIndex: null
  ,closeBoxMargin: "10px 2px 2px 2px"
  ,closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif"
  ,infoBoxClearance: new google.maps.Size(1, 1)
  ,isHidden: false
  ,pane: "floatPane"
  ,enableEventPropagation: false
};


var trip_markers = [];

google.maps.event.addDomListener(window, 'load', map_init);
$(document).ready(function(){
  var tripsURL = 'http://www.tuftsmountainclub.org/api/trips.php?action=list&days=0';//"/api/trips/upcoming";
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
        'id'   : trips[i].leaderUsername+"-"+trips[i].departDate,
        'date' : trips[i].departDate,
        'category': trips[i].category.toLowerCase()
      };
    var new_tripBox = $(Mustache.to_html(tripBox, tripData));
    $("#trips_grid").prepend(new_tripBox);
    new_tripBox.animate({'opacity': 1}, 'slow');
    $.each(types, function(i,v){
      if(v.name === category){
        ++v.number;
      }
    })
    mapify(new_tripBox, tripData);
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


function addMarker(tripdata, accurate_callback) {
  var bounds_ll = new google.maps.LatLng(40.797177,-75.06958);
  var bounds_ur = new google.maps.LatLng(46.815099,-68.334961);
  var bounds    = new google.maps.LatLngBounds(bounds_ll, bounds_ur);

	var geocoder = new google.maps.Geocoder();
    geocoder.geocode( { 'address': tripdata.title, 'bounds' : bounds},
     function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        infoBox_rendered = Mustache.to_html(infoBox_template, tripdata)

        var marker_tmp = new google.maps.Marker({
          position: results[0].geometry.location,
          map: map,
          title: tripdata.title,
          icon: 'img/ico/'+tripdata.category+'.png',
          infobox: new InfoBox($.extend(infoBox_options, {content: infoBox_rendered}))
        });
        accurate_callback(results[0].geometry.location_type);
        trip_markers.push(marker_tmp);
        google.maps.event.addListener(marker_tmp, "click", function(e){
          this.infobox.open(map, this);
        })
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
  }

function mapify(tripBox, tripData){

  var geo_string = tripBox.find(".title").html();

  console.log(geo_string);  
  var inaccurate = function(accuracy_type){
    if(accuracy_type === google.maps.GeocoderLocationType.APPROXIMATE){
      tripBox.find(".box-content").append("<div class='location'>location approximate.</div>");
    }
  };
  addMarker(tripData, inaccurate);


}

function updateBreakdown(types){
  var numItems = types.reduce(function(sum, curr){
    return sum + curr.number;
  }, 0);
  for (var i = types.length - 1; i >= 0; i--) {
    var width = (types[i].number/numItems) * 100;
    if (width === 0){
      $("#"+types[i].name+"_bar").hide('slow');
    }
    else{
      $("#"+types[i].name+"_bar .bar-elem-title").append(" ("+types[i].number+")");
      $("#"+types[i].name+"_bar").animate({"width" : width+"%"}, 'slow');
    };
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
    var elem = $(document.createElement('div')).addClass("bar-elem").attr('id', type.name+"_bar").css({'width': ((1/numItems)*100)+'%'}).addClass(type.name+"_color").append(title)
    breakdown.append(elem);
    console.log(elem);
  };
}