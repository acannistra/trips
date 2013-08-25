/* jshint: node */
/* client javascript */

var map;

function initialize() {
  center = new google.maps.LatLng(-34.397, 150.644);
  var mapOptions = {
    zoom: 8,
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

google.maps.event.addDomListener(window, 'load', initialize);

