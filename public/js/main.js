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

var tripBox = '<div class="pure-u-1-4" >' + 
                '<div class="box {{category}}_color" id="{{id}}_box">'+
                  '<div class="box-content">'+
                    '<div class="title">'+
                      '{{title}}'+
                    '</div>'+
                    '<img class="type_ico" src="img/ico/{{category}}.png"></img>'+
                    '<div class="date">'+
                      '{{departDate}}'+
                    '</div>'+
                    '<div class="date">'+
                      '{{leader}}'+
                    '</div>'+
                  '</div>'+
                '</div>'+
              '</div>';

var leadTrip = '<div class="pure-u-1-4">'+
                        '<div class="box" id="no_trips" style="background-color: rgba(204, 216, 193, 0.54)">'+
                            '<div class="bigtext">'+
                                'No more trips. Lead one today!'+
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
  var tripsURL = 'http://www.tuftsmountainclub.org/api/trips.php?action=list&days=180';
  $.getJSON(tripsURL, function(data){
    trips_ref = data.sort(function(a,b){ return (new Date(a.departDate)) >= (new Date(b.departDate))});
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
    if(!trips[i]){continue;}
    var category = trips[i].category.toLowerCase()
    var tripData = 
      {
        'title': trips[i].destination,
        'leader': trips[i].leaderName,
        'destination' : trips[i].destination,
        'id'   : (trips[i].leaderUsername+"-"+trips[i].departDate.split(" ", 1)).replace(".", "_"),
        'departDate' : new Date(trips[i].departDate).toDateString(),
        'returnDate' : new Date(trips[i].returnDate).toDateString(),
        'category': trips[i].category.toLowerCase()
      };
    var new_tripBox = $(Mustache.to_html(tripBox, tripData));
    // if (tripData.date < new Date()){
    //   new_tripBox.css({opacity: 0.5, cursor: 'default'})
    // }


    $("#trips_grid").append(new_tripBox);
    new_tripBox.show('slow');
    $.each(types, function(i,v){
      if(v.name === category){
        ++v.number;
      }
    })
    // $.post('api/trips/add', tripData, function(d) {if(d != "OK"){console.log('post err');}});
    mapify(new_tripBox, tripData);
  };
  $("#trips_grid").append($('<div/>').html(leadTrip).contents());
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


function addMarker(tripdata) {
  console.log(tripdata);
  infoBox_rendered = Mustache.to_html(infoBox_template, tripdata)
  lat = parseFloat(tripdata.latlng.location.lat);
  lng = parseFloat(tripdata.latlng.location.lng);
  console.log(google.maps.LatLng(lat, lng));
  var marker_tmp = new google.maps.Marker({
    position: new google.maps.LatLng(lat, lng),
    map: map,
    title: tripdata.title,
    icon: 'img/ico/'+tripdata.category+'.png',
    infobox: new InfoBox($.extend(infoBox_options, {content: infoBox_rendered}))
  });
}

function mapify(tripBox, tripData){

  var id = tripBox.find(".box").attr('id').split('_', 1);


  // $.getJSON('api/trips/get?id='+id, function(d){
  //   console.log($.extend(tripData, {latlng: JSON.parse(d.latlng)}))
  //   addMarker($.extend(tripData, JSON.parse(d.latlng)));
  // });

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