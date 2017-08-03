(function(window, undefined) {
  var MapsLib = function(options) {
    var self = this;

    options = options || {};

    this.recordName = options.recordName || "fuel"; //for showing a count of results
    this.recordNamePlural = options.recordNamePlural || "fuels";
    this.searchRadius = options.searchRadius || 805; //in meters ~ 1/2 mile

    // the encrypted Table ID of your Fusion Table (found under File => About)

    this.centroidsFusionTableId = options.centroidsFusionTableId || "",
      this.treesFusionTableId = options.treesFusionTableId || "",
      this.shrubsFusionTableId = options.shrubsFusionTableId || "",
      this.buildingsFusionTableId = options.buildingsFusionTableId || "",
      this.greenspaceFusionTableId = options.greenspaceFusionTableId || "",
      this.poolsFusionTableId = options.poolsFusionTableId || "",


      // Found at https://console.developers.google.com/
      // Important! this key is for demonstration purposes. please register your own.
      this.googleApiKey = options.googleApiKey || "",

      // name of the location column in your Fusion Table.
      // NOTE: if your location column name has spaces in it, surround it with single quotes
      // example: locationColumn:     "'my location'",
      this.locationColumn = options.locationColumn || "geometry";

    // appends to all address searches if not present
    this.locationScope = options.locationScope || "";

    // zoom level when map is loaded (bigger is more zoomed in)
    this.defaultZoom = options.defaultZoom || 11;

    // center that your map defaults to
    this.map_centroid = new google.maps.LatLng(options.map_center[0], options.map_center[1]);

    // marker image for your searched address
    if (typeof options.addrMarkerImage !== 'undefined') {
      if (options.addrMarkerImage !== "")
        this.addrMarkerImage = options.addrMarkerImage;
      else
        this.addrMarkerImage = ""
    } else
      this.addrMarkerImage = "http://publicdomainvectors.org/tn_img/Rope_Ring-02.png"


    this.currentPinpoint = null;
    $("#result_count").html("");

    this.myOptions = {
      zoom: this.defaultZoom,
      center: this.map_centroid,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      maxZoom: 23,
      minZoom: 18,
      scrollwheel: false,
      draggable: true,
    };
    this.geocoder = new google.maps.Geocoder();
    this.map = new google.maps.Map($("#map_canvas")[0], this.myOptions);
    markerClusterer = new MarkerClusterer(this.map, []);

    // maintains map centerpoint for responsive design
    google.maps.event.addDomListener(self.map, 'idle', function() {
      self.calculateCenter();
    });
    google.maps.event.addDomListener(window, 'resize', function() {
      self.map.setCenter(self.map_centroid);
    });
    self.searchrecords = null;

    //reset filters
    $("#search_address").val(self.convertToPlainString($.address.parameter('address')));
    var loadRadius = self.convertToPlainString($.address.parameter('radius'));
    if (loadRadius !== "")
      $("#search_radius").val(loadRadius);
    else
      $("#search_radius").val(self.searchRadius);

    $(":checkbox").prop("checked", "checked");
    $("#result_box").hide();

    //-----custom initializers-----
    //-----end of custom initializers-----

    //run the default search when page loads
    self.doSearch();
    if (options.callback) options.callback(self);
  };

  //-----custom functions-----



  //-----end of custom functions-----

  MapsLib.prototype.submitSearch = function(whereClause, map) {
    var self = this;
    //get using all filters
    //NOTE: styleId and templateId are recently added attributes to load custom marker styles and info windows
    //you can find your Ids inside the link generated by the 'Publish' option in Fusion Tables
    //for more details, see https://developers.google.com/fusiontables/docs/v1/using#WorkingStyles

    var geometryColumn = 'LongLatID';
    var classColumn = 'Type_1';
    var speciesColumn = 'Type_2';
    var heightColumn = 'Height';
    var ladderColumn = 'Type_3';
    var dateColumn = 'Date';

    function createMarker(centroid) {
      var coordinates = centroid[0];
      var fuel = centroid[1];
      var type = centroid[2];
      var height = centroid[3] + ' ft';
      var ladder = centroid[4];
      var date = centroid[5].substring(0, 10);
      var image = "https://t3.ftcdn.net/jpg/00/80/33/32/240_F_80333297_qHGRk9vWYoZ1MrNxaHDxuIzTPi4kclBJ.jpg";

      marker = new google.maps.Marker({
        map: map,
        position: coordinates
      });

      this.markerClusterer.addMarker(marker);



      var infoBubble = new InfoBubble({
        ShadowStyle: 1,
        Padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        maxWidth: 600,
        minWidth: 600,
        maxHeight: 300,
        minHeight: 300,
        arrowSize: 15,
      });


      google.maps.event.addListener(marker, 'click', function(event) {

        taggable = ["House", "c", "d", "e", "Yes", "No", "yes", "no", "Shrub", "Unknown"];

        if (taggable.indexOf(fuel) > -1) {
          //buildings
          if (fuel == "House") {
            content = building_content(coordinates, date, fuel, type, height, ladder)[0];
            form = building_content(coordinates, date, fuel, type, height, ladder)[1];

            //trees
          } else if (fuel == "c" || fuel == "d" || fuel == "e") {
            content = tree_content(coordinates, date, fuel, type, height, ladder)[0];
            form = tree_content(coordinates, date, fuel, type, height, ladder)[1];


            //shrubs  
          } else if (fuel == "Yes" || fuel == "No" || fuel == "yes" || fuel == "no" || fuel == "Shrub" || fuel == "Unknown") {
            content = shrub_content(coordinates, date, fuel, type, height, ladder)[0];
            form = shrub_content(coordinates, date, fuel, type, height, ladder)[1];
          }
        }

        var tab1 = document.createElement('DIV');
        tab1.innerHTML = content;

        infoBubble.addTab('Info', tab1);
        infoBubble.addTab('Update', form);

        if (!infoBubble.isOpen()) {
          infoBubble.open(map, this);
        }
      });

    }

    function fetchData(tableId) {

      // Construct a query to get data from the Fusion Table
      // EDIT this list to include the variables for columns named above
      var query = 'SELECT ' + geometryColumn + ',' + classColumn + ',' + speciesColumn + ',' + heightColumn + ',' + ladderColumn + ',' + dateColumn + ' FROM ' + tableId;
      var encodedQuery = encodeURIComponent(query);


      // Construct the URL
      var url = ['https://www.googleapis.com/fusiontables/v1/query'];
      url.push('?sql=' + encodedQuery);
      url.push('&key=' + 'AIzaSyBIJU-Na0ZdzgkC7DHJAHXrqGOblt3yzpE');
      url.push('&callback=?');

      // Send the JSONP request using jQuery
      $.ajax({
        url: url.join(''),
        dataType: 'jsonp',
        success: onDataFetched
      });
    }

    function onDataFetched(data) {
      var rows = data['rows'];
      var markerList = [];

      // Copy each row of data from the response into variables.
      // Each column is present in the order listed in the query.
      // Starting from 0.
      // EDIT this if you've changed the columns, above.
      for (var i = 0; i < rows.length - 1; i++) {
        var lat = rows[i][0]['geometry']['coordinates'][1];
        var lng = rows[i][0]['geometry']['coordinates'][0];
        var fuelClass = rows[i][1];
        var speciesClass = rows[i][2];
        var heightClass = rows[i][3];
        var ladderClass = rows[i][4];
        var date = rows[i][5];
        var coordinate = new google.maps.LatLng(lat, lng);
        markerList.push([coordinate, fuelClass, speciesClass, heightClass, ladderClass, date]);
        //createMarker(coordinate, lat, lng, fuelClass, speciesClass, heightClass, ladderClass, date, markerList);


      }
      for (var centroid in markerList) {
        createMarker(markerList[centroid]);
      }

    }
    fetchData(self.centroidsFusionTableId);

    function building_content(coordinates, date, fuel, type, height, ladder) {

      if (type == "Asphalt") {
        image1 = "https://bcourses.berkeley.edu/courses/1456246/files/70229289/preview";
      } else if (type == "Metal") {
        image1 = "https://bcourses.berkeley.edu/courses/1456246/files/70229290/preview";
      } else if (type == "Clay Tile") {
        image1 = "https://bcourses.berkeley.edu/courses/1456246/files/70229292/preview";
      } else if (type == "Wood") {
        image1 = "https://bcourses.berkeley.edu/courses/1456246/files/70229294/preview";
      } else {
        type = "Unknown";
        image1 = "https://bcourses.berkeley.edu/courses/1456246/files/70229326/preview";
      }
      if (ladder = "Brick") {
        image2 = "https://bcourses.berkeley.edu/courses/1456246/files/70229305/preview";
      } else if (ladder = "Stucco") {
        image2 = "https://bcourses.berkeley.edu/courses/1456246/files/70229307/preview";
      } else if (ladder = "Wood") {
        image2 = "https://bcourses.berkeley.edu/courses/1456246/files/70229309/preview";
      } else if (ladder = "Vinyl") {
        image2 = "https://bcourses.berkeley.edu/courses/1456246/files/70229308/preview";
      } else {
        image2 = "https://bcourses.berkeley.edu/courses/1456246/files/70229328/preview";
      }
      //customForm = "https://docs.google.com/forms/d/1DoB3mJpcMMA8NRV9BlHkdxm_EM9kVSsyyz6oh7-GN6U";
      customForm = "https://docs.google.com/forms/d/e/1FAIpQLSfUR5Yq6d7x0qEXnnLfofYfWc64OEQxyFyV62ojnqNwp0VEWw/viewform?usp=pp_url&entry.643375635="+ coordinates +"&entry.1345089004&entry.95699849&entry.1534486865";

      content = '<h2>' + fuel + '</h2>' +
        '<p>' +
        '<b>Roof Material: </b>' + type + '</br>' +
        '<b>Last Updated: </b>' + date + '</p>';
      form = '<iframe src="' + customForm + '/viewform?embedded=true" width="575" height="575" >Loading...</iframe></br>';
      return [content, form];
    }

    function tree_content(coordinates, date, fuel, type, height, ladder) {

      if (fuel == "c") {
        type = "Coniferous";
        species = "Unknown";
        image1 = "https://bcourses.berkeley.edu/courses/1456246/files/70229312/preview";

      } else if (fuel == "d") {
        type = "Deciduous";
        species = "Unknown";
        image1 = "https://bcourses.berkeley.edu/courses/1456246/files/70082860/preview";

      } else if (fuel == "e") {
        type = "Perennial | Evergreen";
        species = "Unknown";
        image1 = "https://bcourses.berkeley.edu/courses/1456246/files/70229314/preview";

      } else {
        type = "Unknown";
        species = "Unknown";
        image1 = "https://bcourses.berkeley.edu/courses/1456246/files/70229317/preview";

      }
      if (ladder == "yes" || ladder == "no") {
        if (ladder == "yes") {
          ladder = "Yes";
          image2 = "https://bcourses.berkeley.edu/courses/1456246/files/70229284/preview"
        } else {
          ladder = "No";
          image2 = "https://bcourses.berkeley.edu/courses/1456246/files/70229285/preview"
        }
      }
      health = "Unknown";
      cbh = "Unknown";
      image2 = "https://bcourses.berkeley.edu/courses/1456246/files/70229285/preview"
      //customForm = "https://docs.google.com/forms/d/e/1FAIpQLSfUR5Yq6d7x0qEXnnLfofYfWc64OEQxyFyV62ojnqNwp0VEWw";
      customForm = "https://docs.google.com/forms/d/e/1FAIpQLSfUR5Yq6d7x0qEXnnLfofYfWc64OEQxyFyV62ojnqNwp0VEWw/viewform?usp=pp_url&entry.643375635="+ coordinates +"&entry.1345089004&entry.95699849&entry.1534486865";
      
      content =
        '<h2>Tree</h2>' +
        '<div id="bodyContent">' + '<p>' +
        '<b>Status: </b>' + health + '</br>' +
        '<b>Type: </b>' + type + '</br>' +
        '<b>Species: </b>' + species + '</br>' +
        '<b>Last Updated: </b>' + date + '</p>';
      form = '<iframe src="' + customForm + '/viewform?embedded=true" width="575" height="575" >Loading...</iframe></br>';
      return [content, form];
    }

    function shrub_content(coordinates, date, fuel, type, height, ladder) {

      if (fuel == "yes" || fuel == "no") {
        if (fuel == "yes") {
          fuel = "Yes";
        } else {
          fuel = "No";
        }
      }
      if (fuel == 1 || fuel == "Shrub") {
        fuel = "Unknown";
      }
      species = "Unknown";
      ladder = "";
      health = "Unknown";
      type = "Woody | Herbacious";
      image1 = "https://bcourses.berkeley.edu/courses/1456246/files/70229321/preview";
      image2 = "";
      //customForm = "https://docs.google.com/forms/d/1Zwtl1HclR-n6zZd6pyPFEoOBEWq7d5hmP4l2NktYQFU";
      customForm = "https://docs.google.com/forms/d/e/1FAIpQLSfUR5Yq6d7x0qEXnnLfofYfWc64OEQxyFyV62ojnqNwp0VEWw/viewform?usp=pp_url&entry.643375635="+ coordinates +"&entry.1345089004&entry.95699849&entry.1534486865";

      content =

        '<h2>Shrub</h2>' +
        '<div id="bodyContent">' + '<p>' +
        '<b>Status: </b>' + health + '</br>' +
        '<b>Type: </b>' + type + '</br>' +
        '<b>Species: </b>' + species + '</br>' +
        '<b>Last Updated: </b>' + date + '</p>';
      form = '<iframe src="' + customForm + '/viewform?embedded=true" width="575" height="575" >Loading...</iframe></br>';
      return [content, form];
    }

    function path_content(coordinates, date, fuel, type, height, ladder) {

      if (type == 1) {
        fuel_desc = "Surface Material: ";
        type = "Unknown";
        ladder = "";
        species = "";
        image = "https://t3.ftcdn.net/jpg/00/80/33/32/240_F_80333297_qHGRk9vWYoZ1MrNxaHDxuIzTPi4kclBJ.jpg";
      }
      content = 'TBA';
      return content;
    }

  

    self.trees = new google.maps.FusionTablesLayer({
      query: {
        from: self.treesFusionTableId,
        select: self.locationColumn,
        where: whereClause
      },
      styleId: 2,
      templateId: 2,
      clickable: false,
    });

    self.shrubs = new google.maps.FusionTablesLayer({
      query: {
        from: self.shrubsFusionTableId,
        select: self.locationColumn,
        where: whereClause
      },
      styleId: 2,
      templateId: 2,
      clickable: false,
    });

    self.buildings = new google.maps.FusionTablesLayer({
      query: {
        from: self.buildingsFusionTableId,
        select: self.locationColumn,
        where: whereClause
      },
      styleId: 2,
      templateId: 2,
      clickable: false,
    });

    self.greenspace = new google.maps.FusionTablesLayer({
      query: {
        from: self.greenspaceFusionTableId,
        select: self.locationColumn,
        where: whereClause
      },
      styleId: 2,
      templateId: 2,
      clickable: false,
    });

    self.pools = new google.maps.FusionTablesLayer({
      query: {
        from: self.poolsFusionTableId,
        select: self.locationColumn,
        where: whereClause
      },
      styleId: 2,
      templateId: 2,
      clickable: false,
    });



    self.fusionTable = self.searchrecords;
    self.greenspace.setMap(map);
    self.pools.setMap(map);
    self.buildings.setMap(map);
    self.shrubs.setMap(map);
    self.trees.setMap(map);
    self.getCount(whereClause);
  };


  MapsLib.prototype.getgeoCondition = function(address, callback) {
    var self = this;
    if (address !== "") {
      if (address.toLowerCase().indexOf(self.locationScope) === -1) {
        address = address + " " + self.locationScope;
      }
      self.geocoder.geocode({
        'address': address
      }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          self.currentPinpoint = results[0].geometry.location;
          var map = self.map;

          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', encodeURIComponent(self.searchRadius));
          map.setCenter(self.currentPinpoint);
          // set zoom level based on search radius
          self.map.setZoom(17);

          if (self.addrMarkerImage !== '') {
            self.addrMarker = new google.maps.Marker({
              position: self.currentPinpoint,
              map: self.map,
              icon: self.addrMarkerImage,
              animation: google.maps.Animation.DROP,
              title: address
            });
          }
          var geoCondition = " AND ST_INTERSECTS(" + self.locationColumn + ", CIRCLE(LATLNG" + self.currentPinpoint.toString() + "," + self.searchRadius + "))";
          callback(geoCondition);
          self.drawSearchRadiusCircle(self.currentPinpoint);
        } else {
          alert("We could not find your address: " + status);
          callback('');
        }
      });
    } else {
      callback('');
    }
  };

  MapsLib.prototype.doSearch = function() {
    var self = this;
    self.clearSearch();
    var address = $("#search_address").val();
    self.searchRadius = $("#search_radius").val();
    self.whereClause = self.locationColumn + " not equal to ''";

    //-----custom filters-----
    //-----end of custom filters-----

    self.getgeoCondition(address, function(geoCondition) {
      self.whereClause += geoCondition;
      self.submitSearch(self.whereClause, self.map);
    });

  };

  MapsLib.prototype.reset = function() {
    $.address.parameter('address', '');
    $.address.parameter('radius', '');
    window.location.reload();
  };


  MapsLib.prototype.getInfo = function(callback) {
    var self = this;
    jQuery.ajax({
      url: 'https://www.googleapis.com/fusiontables/v1/tables/' + self.centroidsFusionTableId + '?key=' + self.googleApiKey,
      dataType: 'json'
    }).done(function(response) {
      if (callback) callback(response);
    });
  };

  MapsLib.prototype.addrFromLatLng = function(latLngPoint) {
    var self = this;
    self.geocoder.geocode({
      'latLng': latLngPoint
    }, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $('#search_address').val(results[1].formatted_address);
          $('.hint').focus();
          self.doSearch();
        }
      } else {
        alert("Geocoder failed due to: " + status);
      }
    });
  };

  MapsLib.prototype.drawSearchRadiusCircle = function(point) {
    var self = this;
    var circleOptions = {
      strokeColor: "#4b58a6",
      strokeOpacity: 0.3,
      strokeWeight: 1,
      fillColor: "#4b58a6",
      fillOpacity: 0.05,
      map: self.map,
      center: point,
      clickable: false,
      zIndex: -1,
      radius: parseInt(self.searchRadius)
    };
    self.searchRadiusCircle = new google.maps.Circle(circleOptions);
  };

  MapsLib.prototype.query = function(query_opts, callback) {
    var queryStr = [],
      self = this;
    queryStr.push("SELECT " + query_opts.select);
    queryStr.push(" FROM " + self.centroidsFusionTableId);
    // where, group and order clauses are optional
    if (query_opts.where && query_opts.where != "") {
      queryStr.push(" WHERE " + query_opts.where);
    }
    if (query_opts.groupBy && query_opts.groupBy != "") {
      queryStr.push(" GROUP BY " + query_opts.groupBy);
    }
    if (query_opts.orderBy && query_opts.orderBy != "") {
      queryStr.push(" ORDER BY " + query_opts.orderBy);
    }
    if (query_opts.offset && query_opts.offset !== "") {
      queryStr.push(" OFFSET " + query_opts.offset);
    }
    if (query_opts.limit && query_opts.limit !== "") {
      queryStr.push(" LIMIT " + query_opts.limit);
    }
    var theurl = {
      base: "https://www.googleapis.com/fusiontables/v1/query?sql=",
      queryStr: queryStr,
      key: self.googleApiKey
    };
    $.ajax({
      url: [theurl.base, encodeURIComponent(theurl.queryStr.join(" ")), "&key=", theurl.key].join(''),
      dataType: "json"
    }).done(function(response) {
      //console.log(response);
      if (callback) callback(response);
    }).fail(function(response) {
      self.handleError(response);
    });
  };

  MapsLib.prototype.handleError = function(json) {
    if (json.error !== undefined) {
      var error = json.responseJSON.error.errors;
      console.log("Error in Fusion Table call!");
      for (var row in error) {
        console.log(" Domain: " + error[row].domain);
        console.log(" Reason: " + error[row].reason);
        console.log(" Message: " + error[row].message);
      }
    }
  };
  MapsLib.prototype.getCount = function(whereClause) {
    var self = this;
    var selectColumns = "Count()";
    self.query({
      select: selectColumns,
      where: whereClause
    }, function(json) {
      self.displaySearchCount(json);
    });
  };

  MapsLib.prototype.displaySearchCount = function(json) {
    var self = this;

    var numRows = 0;
    if (json["rows"] != null) {
      numRows = json["rows"][0];
    }
    var name = self.recordNamePlural;
    if (numRows == 1) {
      name = self.recordName;
    }
    $("#result_box").fadeOut(function() {
      $("#result_count").html(self.addCommas(numRows) + " " + name + " found");
    });
    $("#result_box").fadeIn();
  };

  MapsLib.prototype.addCommas = function(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  };

  // maintains map centerpoint for responsive design
  MapsLib.prototype.calculateCenter = function() {
    var self = this;
    center = self.map.getCenter();
  };

  //converts a slug or query string in to readable text
  MapsLib.prototype.convertToPlainString = function(text) {
    if (text === undefined) return '';
    return decodeURIComponent(text);
  };

  MapsLib.prototype.clearSearch = function() {
    var self = this;
    if (self.searchrecords && self.searchrecords.getMap)
      self.searchrecords.setMap(null);
    if (self.addrMarker && self.addrMarker.getMap)
      self.addrMarker.setMap(null);
    if (self.searchRadiusCircle && self.searchRadiusCircle.getMap)
      self.searchRadiusCircle.setMap(null);
  };

  MapsLib.prototype.findMe = function() {
    var self = this;
    var foundLocation;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var accuracy = position.coords.accuracy;
        var coords = new google.maps.LatLng(latitude, longitude);
        self.map.panTo(coords);
        self.addrFromLatLng(coords);
        self.map.setZoom(14);
        jQuery('#map_canvas').append('<div id="myposition"><i class="fontello-target"></i></div>');
        setTimeout(function() {
          jQuery('#myposition').remove();
        }, 3000);
      }, function error(msg) {
        alert('Please enable your GPS position future.');
      }, {
        //maximumAge: 600000,
        //timeout: 5000,
        enableHighAccuracy: true
      });
    } else {
      alert("Geolocation API is not supported in your browser.");
    }
  };
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = MapsLib;
  } else if (typeof define === 'function' && define.amd) {
    define(function() {
      return MapsLib;
    });
  } else {
    window.MapsLib = MapsLib;
  }

})(window);
