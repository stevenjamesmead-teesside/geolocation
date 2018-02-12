"use strict";

//
// Called when the page has completely loaded, including all assets.
//
window.onload = function(e) {

  //
  // Instantiate a Geo object.
  //
  const geo = new Geo();

  if(geo) {


    let selector = document.getElementById("unit-type-selector");

    //
  	// Generate selection list options based upon the current conversion unit types offered by the
  	// Geo object and use them set the options for the select field.
  	//
    selector.innerHTML = (function() {
                                  let options = '<option value="NA">Select an option...</option>';
                                  for(let label in geo.unitTypes) {
                                    options += "<option value=" + label + ">" + geo.unitTypes[label] + "</option>";
                                  }
                                  return options;
                                })();;

  	//
  	// Set the event callback method for the select field.
  	//
    selector.onchange = function(e) {
  		e.preventDefault();

      //
    	// Grab the destination gps coordinated from the text field in the HTML
    	//
        const destinationPosition = {
          coords: 	(function(){
    					let text = document.getElementById('destination-position').value;
    					text = text.split(",");
    					return {
    						latitude:	Number(text[0]),
    						longitude: 	Number(text[1])
    					};
    				})()
        };

  		if(this.options[this.selectedIndex].value !== "NA") {
  		  //
  		  //This sets how the conversion will be calculated "under the hood"
  		  //
  		  Geo.unitType = this.options[this.selectedIndex].value;

  		  geo.compute(
    			destinationPosition,
    			//
    			//Anonymous function:
    			//
    			//Callback function to update the DOM.
    			//
    			function (result) {
    					document.getElementById('distance').innerHTML = result.distance.value.toFixed(6) + " " + result.distance.label;

    					document.getElementById('info').innerHTML =  '<div id="current-position"><span class="latitude">' +
                                                            result.currentPosition.coords.latitude +
    														                            '</span><span class="longitude">' +
                                                            result.currentPosition.coords.longitude + '</div>' +
                                                            '<div><span class="latitude">' +
    														                            result.destinationPosition.coords.latitude +
                                                            '</span>' +
                                                            '<span class="longitude">' +
                                                            result.destinationPosition.coords.longitude +
                                                            "</span></div>";

              //create the google map:
              const curLatLng =   new google.maps.LatLng(
                                    result.currentPosition.coords.latitude,
                                    result.currentPosition.coords.longitude
                                  );

              const destLatLng =  new google.maps.LatLng(
                                    result.destinationPosition.coords.latitude,
                                    result.destinationPosition.coords.longitude
                                  );

              //compute the mid-point location - this is used to center of the
              //map's display position.
              //
              const midLatLng =   new google.maps.LatLng(
                                    0.5 * (result.destinationPosition.coords.latitude + result.currentPosition.coords.latitude),
                                    0.5 * (result.destinationPosition.coords.longitude + result.currentPosition.coords.longitude)
                                  );

              //create a boundary that will ensure that the
              //map is displayed at a zoom level that
              //will show both destination and current location.
              //
              const bounds    =   new google.maps.LatLngBounds();

              bounds.extend(curLatLng);
              bounds.extend(destLatLng);

              const map =         new google.maps.Map(
                                    document.getElementById('google-map'),
                                    {
                                      /* zoom:       10, */
                                      center:     midLatLng,
                                      mapTypeId:  google.maps.MapTypeId.ROADMAP
                                    }
                                  );

              map.fitBounds(bounds);
              map.panToBounds(bounds);

              //Add a marker for the two points
              const curMarker =   new google.maps.Marker(
                                    {
                                      position:   curLatLng,
                                      map:        map,
                                      title:      "Current Location"
                                    }
                                  );

              const destMarker =  new google.maps.Marker(
                                    {
                                      position:   destLatLng,
                                      map:        map,
                                      title:      "Destination Marker"
                                    }
                                  );

              //draw a line over the map from the current to the destination
              //positions.
              //
              const lineCoords =  [
                                    {lat: result.destinationPosition.coords.latitude, lng: result.destinationPosition.coords.longitude},
                                    {lat: result.currentPosition.coords.latitude, lng: result.currentPosition.coords.longitude}
                                  ];

              const linePath =    new google.maps.Polyline(
                                    {
                                      path: lineCoords,
                                      geodesic: true,
                                      strokeColor: '#F00',
                                      strokeOpacity: 1.0,
                                      strokeWidth: 2
                                    }
                                  );

              linePath.setMap(map);
    				}
  			);
		  }
    };
  }
}
