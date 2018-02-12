"use strict";

function Geo() {
  if (!navigator.geolocation) {
    throw "Geolocation is not supported by this browser.";
  }
  const CONVERSIONS = {
    M:  { coefficient: 0.00062137,              label: "miles" },
    NM: { coefficient: 0.00053995684107127422,  label: "nautical miles"},
    KM: { coefficient: 0.001,                   label: "kms" },
    CM: { coefficient: 100,                     label: "cms" },
    MM: { coefficient: 1000,                    label: "mms" },
    FT: { coefficient: 3.28084,                 label: "feet" },
    IN: { coefficient: 39.3701,                 label: "inches" },
    YD: { coefficient: 1.09361,                 label: "yards" },
    PX: { coefficient: 3779.5275590551,         label: "pixel (X) (why not?!)"},
    FL: { coefficient: 0.0049710,               label: "furlongs"},
    SM: { coefficient: 0.587613,                label: "smoots"},
    DD: { coefficient: 0.119303,                label: "double decker buses"},
    BW: { coefficient: 0.033333,                label: "blue whales"},
    JO: { coefficient: 0.000001,                label: "trips from Land's End to John O'Groats"},
    //
    //convert:
    //
    //method to actually convert the raw distance to the specified
    //unit type.
    //
    convert: function(rawDistance,unitType) {
      const converter = this[unitType];
      return {
        value: converter ? rawDistance * converter.coefficient : rawDistance,
        label: converter ? converter.label : "meters"
      };
    }
  };

  //Create a reference to the object being constructed
  //so that we can ensure we know the correct 'Geo' object
  //that is being used.  The 'this' reference will
  //change depending on when, when and by whom a function
  //is being called.
  //
  const self = this;

  //
  // Private functions of the Geo object.
  //
  function computeDistanceToDestination(currentPosition) {
  	if(!(self.destinationPosition && self.destinationPosition.coords && self.destinationPosition.coords.latitude && self.destinationPosition.coords.longitude)) {
  	  self.destinationPosition = currentPosition;
  	}

  	const distance = calculateDistance(
  	  currentPosition,
  	  self.destinationPosition,
  	  Geo.unitType
  	);

  	if(self.fnUpdateView) {
  		self.fnUpdateView(Object.freeze({currentPosition: currentPosition, destinationPosition: self.destinationPosition, distance: distance}));
  	}
  }

  const calculateDistance = (function() {
                              //
                              //Private constants that can only be
                              //seen in the scope of this closure,
                              //which includes the anonymous function
                              //it defines and returns.
                              //
                              const EARTH_RADIUS = 6371e3; //meters
                              const TO_RADIANS = Math.PI / 180.0;
                              //
                              //This anonymous function is returned and
                              //assigned to calculateDistance.
                              //
                              return function (currentPosition, destinationPosition, unitType) {
                                //
                                //Based on the algorithm described here:
                                //  https://www.movable-type.co.uk/scripts/latlong.html
                                //
                                //You may also find this Wikipedia entry useful
                                //  https://en.wikipedia.org/wiki/Great-circle_distance
                                //
                                const currentLat = currentPosition.coords.latitude * TO_RADIANS;
                                const destLat = destinationPosition.coords.latitude * TO_RADIANS;
                                const deltaLat = (currentPosition.coords.latitude - destinationPosition.coords.latitude) * TO_RADIANS;
                                const deltaLong = (currentPosition.coords.longitude - destinationPosition.coords.longitude) * TO_RADIANS;
                                const halfDeltaLat = deltaLat / 2;
                                const halfDeltaLong = deltaLong / 2;
                                const a = Math.sin(halfDeltaLat) * Math.sin(halfDeltaLat) +
                                          Math.cos(currentLat) * Math.cos(destLat) *
                                          Math.sin(halfDeltaLong) * Math.sin(halfDeltaLong);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
                                const distance = EARTH_RADIUS * c;

                                return CONVERSIONS.convert(distance,unitType);
                              }
                            })();

  function showError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
          self.fnError("User denied the request for Geolocation.");
          break;
      case error.POSITION_UNAVAILABLE:
          self.fnError("Location information is unavailable.");
          break;
      case error.TIMEOUT:
          self.fnError("The request to get user location timed out.");
          break;
      case error.UNKNOWN_ERROR:
          self.fnError("An unknown error occurred.");
          break;
    }
  }

  //
  //Build an object that contains only the unitType,label pairs:
  //
  this.unitTypes =  (function(){
                      let obj = {};
                      for(let key in CONVERSIONS) {
                        if(typeof(CONVERSIONS[key]) !== "function") {
                          obj[key] = CONVERSIONS[key].label;
                        }
                      }
                      return Object.freeze(obj); //Creates a read-only object.
                    })();

    //
    //compute()
    //
    //Public interface method to start the
    this.compute = function(destinationPosition,fnUpdateView,fnError) {
      this.destinationPosition = destinationPosition;
      this.fnUpdateView = fnUpdateView;
      this.fnError = fnError || function(errorMsg) { console.log(errorMsg); };

      navigator.geolocation.getCurrentPosition(computeDistanceToDestination, showError);
    }
}
Geo.unitType = "M";  //Default conversion unit type.
