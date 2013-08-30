/* jshint: node */
/* client javascript */


var bounds_ll = new google.maps.LatLng(40.797177,-75.06958);
var bounds_ur = new google.maps.LatLng(46.815099,-68.334961);
var geocodeBounds    = new google.maps.LatLngBounds(bounds_ll, bounds_ur);
var geocoder = new google.maps.Geocoder();
var weatherpath = "api/weather/";
var skycons = new Skycons();
var icons = {
  "clear-day": Skycons.CLEAR_DAY,
  "clear-night": Skycons.CLEAR_NIGHT,
  "partly-cloudy-day": Skycons.PARTLY_CLOUDY_DAY,
  "partly-cloudy-night": Skycons.PARTLY_CLOUDY_NIGHT,
  "cloudy": Skycons.CLOUDY,
  "rain": Skycons.RAIN,
  "sleet": Skycons.SLEET,
  "snow": Skycons.SNOW,
  "wind": Skycons.WIND,
  "fog": Skycons.FOG
}



var typeHidden = { 
                   hiking: false,
                   climbing: false,
                   general: false,
                   aqua: false 
                 };


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
                    '<div class="date">'+
                      'Experience: {{level}}'+
                    '</div>'+
                  '</div>'+
                '</div>'+
              '</div>';

var leadTrip = '<div class="pure-u-1-4" id="lead_trips">'+
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


var map_markers = [];

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
        'description' : trips[i].description,
        'id'   : (trips[i].leaderUsername+"-"+trips[i].departDate.split(" ", 1)).replace(".", "_"),
        'departDate' : new Date(trips[i].departDate.replace(/-/g, "/")).toDateString(),
        'returnDate' : new Date(trips[i].returnDate.replace(/-/g, "/")).toDateString(),
        'category': trips[i].category.toLowerCase(),
        'gear': trips[i].gear,
        'leaderEmail' : trips[i].leaderEmail,
        'level' : trips[i].level
      };
    var new_tripBox = $(Mustache.to_html(tripBox, tripData))
    new_tripBox.find('.box').data('data', tripData);
    new_tripBox.on('click', tripClick);
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

function tripClick (){
  $('#welcome-info').hide();
  $('#main-info').removeClass('hidden');
  map.clearOverlays();
  skycons.remove('weathericon');
  tripData = $(this).find('.box').data('data');
  borderColor = $(this).find('.box').css('background-color')

  $(".info-content").css({border: '10px solid '+borderColor});
  $('.info-title').html(tripData.title);
  $('.info-dates').html(tripData.departDate + " - " + tripData.returnDate)
  $('.info-leader').html('<a href="mailto:'+tripData.leaderEmail+'">'+tripData.leader+'</a>');
  $('.info-description').html(tripData.description);
  $('.info-gear').html("<u>You'll Need</u>: "+tripData.gear)
  $('.info-exp').html("<u>Experience</u>: "+tripData.level)
  if(!$(this).find('.box').data('marker')){
    addMarker(tripData);
  }
  else{
    showMarker(tripData);
    wx = $(this).find('.box').data('weather')
    if(wx){
      $('.info-weather').find('.wx-temps').html('high: '+wx.temperatureMax+ '&#176;F, low: '+wx.temperatureMin+'&#176;F');
      $('.info-weather').find('.wx-text').html(wx.summary);
      skycons.add('weathericon', icons[wx.icon]);
      skycons.play();
      $('.info-weather').show();
    }
  }

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

  google.maps.Map.prototype.clearOverlays = function() {
    for (var i = 0; i < map_markers.length; i++ ) {
      map_markers[i].setMap(null);
    }
  }
}



function addMarker(tripdata) {
  console.log(tripdata);
  address = tripdata.title;
  geocoder.geocode( { 'address': address, 'bounds': geocodeBounds}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
        $(".icon-location-warning").hide();
        if(!$(this).find('.box').data('weather')){
          weather(results[0].geometry.location.lat(), results[0].geometry.location.lng(), Math.round(new Date(tripdata.departDate).getTime() / 1000) , function(d, e){

            $("#"+tripdata.id+"_box").data('weather', d.daily.data[0]);
            wx = $("#"+tripdata.id+"_box").data('weather');
            $('.info-weather').find('.wx-temps').html('high: '+wx.temperatureMax+ '&#176;F, low: '+wx.temperatureMin+'&#176;F');
            $('.info-weather').find('.wx-text').html(wx.summary);
            skycons.add('weathericon', icons[wx.icon]);
            skycons.play();
            $('.info-weather').show();
          });
        }
        var marker_tmp = new google.maps.Marker({
          position: results[0].geometry.location,
          id: tripdata.id,
          map: map,
          title: tripdata.title,
          icon: 'img/ico/'+tripdata.category+'.png',
          dom: tripdata.id,
          center: results[0].geometry.location
        })

        if(results[0].geometry.location_type === google.maps.GeocoderLocationType.APPROXIMATE){
          $('.icon-location-warning').find('span').html('  location approximate');
          $('.icon-location-warning').show();
        }
        map_markers.push(marker_tmp);

        map.panTo(marker_tmp.getPosition());

        $("#"+tripdata.id+"_box").data('marker', true)
        $("#"+tripdata.id+"_box").data('position', results[0].geometry.location)
        google.maps.event.addListener(marker_tmp, 'click', function(){ 
          map.panTo(marker_tmp.getPosition());
          tripClick.call($("#"+this.dom+"_box").parent())
        });
        
    } else {
      $('.icon-location-warning').find('span').html('  location not available');
      $('.icon-location-warming').show();
      $('.info-weather').hide();
    }
  });


  
}

function hideExcept(type){
  showAll();
  $('.box').not('#no_trips').not('.'+type+'_color').parent().hide();
  
}

function showAll(){
  $('.box').parent().show();
}

function showMarker(tripdata){
  for (var i = map_markers.length - 1; i >= 0; i--) {
    if (map_markers[i].id == tripdata.id){
      map_markers[i].setMap(map);
      map.panTo(map_markers[i].getPosition());
    }
  };
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
    elem.on('click', function(){
      if(!somethingHidden){
        hideExcept('type');
      }
    })
  };
}

function weather(lat, lng, time, callback){
  $.getJSON(weatherpath+lat+'/'+lng+'/'+time, callback);

}