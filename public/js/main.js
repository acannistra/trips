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

var MIN_WIDTH = 480;
var mobile = false;
var TuftsUniversity = new google.maps.LatLng(42.406157,-71.120381);
var typeClicked = new String("");

var clickEvent = 'click'; /* 'touchstart for mobile' */

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


function slideAway(){
  $('#slideup-info').slideUp();
}

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

/* for iPhone scrollbar */


$(document).ready(function(){
  window.scrollTo(0,0);
  var tripsURL = 'http://www.tuftsmountainclub.org/api/trips.php?action=list&days=180';
  $.getJSON(tripsURL, function(data){
    trips_ref = data;
    page_init();
   });
});

$(window).on('resize', function(){
  width = $(window).width();
  if(window.width <= MIN_WIDTH){
    renderMobile();
  }
  else{
    renderDesktop();
    if(!map){
      map_init();
    }
  }
});

function page_init(){
  initBreakdown(types);
  loadTrips(trips_ref);
  updateBreakdown(types);
  if($(window).width() <= MIN_WIDTH){

    renderMobile();
  }
  else{
    map_init();
    mobile = false;
  }
}

function renderMobile(){
  mobile = true;
  $('.pure-u-1-4').removeClass('pure-u-1-4').addClass('pure-u-1-2')
  $('.bar-elem').each(function(){
    type = $(this).attr('id').split('_', 1)
    $(this).find('.bar-elem-title').html('<img src="img/ico/'+type+'.png"></img>')
  });


}
function renderDesktop(){
  mobile = false;
  $('.pure-u-1-2').removeClass('pure-u-1-2').addClass('pure-u-1-4')
  $('.bar-elem').each(function(){
    type = $(this).attr('id').split('_', 1)
    num = $(this).find('.bar-elem-title').data('number');

    if(num){
      $(this).find('.bar-elem-title').html(type+'('+num+')');
    }
  })
}


function loadTrips(trips){

  trips.forEach(function(trip) {
    if(!trip){return;}
    var category = trip.category.toLowerCase()
    var tripData = 
      {
        'title': trip.destination,
        'leader': trip.leaderName,
        'destination' : trip.destination,
        'description' : trip.description,
        'id'   : (trip.leaderUsername+"-"+trip.departDate.split(" ", 1)).replace(".", "_"),
        'departDate' : new Date(trip.departDate.replace(/-/g, "/")).toDateString(),
        'departDateObj': new Date(trip.departDate.replace(/-/g, "/")),
        'returnDate' : new Date(trip.returnDate.replace(/-/g, "/")).toDateString(),
        'returnDateObj': new Date(trip.returnDate.replace(/-/g, "/")),
        'category': trip.category.toLowerCase(),
        'gear': trip.gear,
        'leaderEmail' : trip.leaderEmail,
        'level' : trip.level
      };
    var new_tripBox = $(Mustache.to_html(tripBox, tripData))
    new_tripBox.find('.box').data('data', tripData);
    new_tripBox.on(clickEvent, tripClick);
    // if (new Date(tripData.departDate) < new Date()){
    //   new_tripBox.css({opacity: 0.5, cursor: 'default'})
    // }


    $("#trips_grid").prepend(new_tripBox);
    new_tripBox.show('slow');
    $.each(types, function(i,v){
      if(v.name === category){
        ++v.number;
      }
    })
    // $.post('api/trips/add', tripData, function(d) {if(d != "OK"){console.log('post err');}});
    mapify(new_tripBox, tripData);
  });
  $("#trips_grid").append($('<div/>').html(leadTrip).contents());
}

function tripClick (){
  $('#welcome-info').hide();
  $('#main-info').removeClass('hidden');
  if(map) map.clearOverlays();
  skycons.remove('weathericon');
  tripData = $(this).find('.box').data('data');
  borderColor = $(this).find('.box').css('background-color')

  $(".info-content").css({border: '10px solid '+borderColor});
  $('.info-title').html(tripData.title);
  $('.info-dates').html(tripData.departDate + " - " + tripData.returnDate);
  $('.info-leader').html('<a href="mailto:'+tripData.leaderEmail+'">'+tripData.leader+'</a>');
  $('.info-description').html(tripData.description);
  $('.info-gear').html("<u>You'll Need</u>: "+tripData.gear);
  $('.info-exp').html("<u>Experience</u>: "+tripData.level);
  if(mobile){$('#slideup-info').slideDown();}
  if(map && !$(this).find('.box').data('marker')){
    addMarker(tripData);
  }
  else{
    if (map) showMarker(tripData);
    wx = $(this).find('.box').data('weather')
    if(wx){
      $('.info-weather').find('.wx-temps').html('high: '+wx.temperatureMax+ '&#176;F, low: '+wx.temperatureMin+'&#176;F');
      $('.info-weather').find('.wx-text').html(wx.summary);
      skycons.add('weathericon', icons[wx.icon]);
      skycons.play();
      $('.info-weather').show();
    }
  }
  if($(this).find('.box').data('approx')){
    $('.icon-location-warning').find('span').html('  location approximate')
    $('.icon-location-warning').show();
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
          title: tripdata.title + " – click for directions",
          icon: 'img/ico/'+tripdata.category+'.png',
          dom: tripdata.id,
          center: results[0].geometry.location
        })

        if(results[0].geometry.location_type === google.maps.GeocoderLocationType.APPROXIMATE){
          $('.icon-location-warning').find('span').html('  location approximate');
          $('.icon-location-warning').show();
          $("#"+tripdata.id+"_box").data('approx', true);

        }
        map_markers.push(marker_tmp);

        map.panTo(marker_tmp.getPosition());

        $("#"+tripdata.id+"_box").data('marker', true)
        $("#"+tripdata.id+"_box").data('position', results[0].geometry.location)
        google.maps.event.addListener(marker_tmp, clickEvent, function(){ 
          map.panTo(marker_tmp.getPosition());
          tripClick.call($("#"+this.dom+"_box").parent())
          if(window.confirm("NOTE: Locations are approximate, so are the driving directions you're about to receive. The Tufts Mountain Club is not responsible for any inaccuracies in these directions.")){
            url = "http://maps.google.com/maps?saddr=Tufts University, Medford, MA&daddr="+marker_tmp.getPosition();
            window.open(url, '_blank');
          }

        });
        
    } else {
      $('.icon-location-warning').removeClass('hidden');
      $('.icon-location-warning').find('span').html('  location not available');
      $('.icon-location-warming').show();      
      $('.info-weather').hide();
    }
  });


  
}

function showOnly(type){
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
      $("#"+types[i].name+"_bar .bar-elem-title").data('number', types[i].number)
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
    $('#'+type.name+"_bar").on(clickEvent, function(){
      var this_type = $(this).attr('id').split('_', 1);
      if(typeClicked.valueOf() === new String(this_type).valueOf()){
        showAll();
        typeClicked = new String("");
      }
      else{
        showOnly(this_type);
        typeClicked = new String(this_type);
      }
    })
  };


}

function openDirections(destination){
  url = "http://maps.google.com/maps?saddr=42.406157,-71.120381[Tufts University]&daddr="+destination
  window.open(url, '_blank');
}

function weather(lat, lng, time, callback){
  $.getJSON(weatherpath+lat+'/'+lng+'/'+time, callback);
}