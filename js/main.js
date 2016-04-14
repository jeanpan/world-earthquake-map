(function(){
  'use strict';

  var earthquakeMap = {
    init: function() {
      var self = this;

      self.map = L.map('map').setView([9.102097, 77.343750], 2),
      self.earthquakeGeoJson = '';
      self.timeline = '';

      var CartoDBTiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        attribution: 'Map Data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> Contributors, Map Tiles &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
      });

      self.map.addLayer(CartoDBTiles);

      var start = (moment().subtract(7, 'days')).format('YYYY-MM-DD'),
          end = (moment()).format('YYYY-MM-DD');

      self.getData(start, end);

      $('#clear').on('click', function(event) {
        event.preventDefault();
        self.map.removeLayer(self.earthquakeGeoJson);
      });

    },

    popUpContent: function(feature) {
      var place = feature.properties.place,
          arr = place.split(", "),
          loc = arr[0],
          country = arr[1];

      var content = '<p class="place">' + loc + '</p>' +
                    '<p class="country">' + country + '</p>' +
                    '<p class="desc"><span class="mag">' + feature.properties.mag + '</span>' +
                    '<a href="' + feature.properties.url + '" target="_blank">More</a></p>';
      return content;
    },

    pointRadius: function(feature) {
      return Math.pow(2, feature.properties.mag) / 2;
    },

    renderTimeline: function(data) {
      var self = this;

      var getInterval = function(quake) {
        // earthquake data only has a time, so we'll use that as a "start"
        // and the "end" will be that + some value based on magnitude
        // 18000000 = 30 minutes, so a quake of magnitude 5 would show on the
        // map for 150 minutes or 2.5 hours
        return {
          start: quake.properties.time,
          end:   quake.properties.time + quake.properties.mag * 1800000
        };
      };

      var timelineControl = L.timelineSliderControl({
        formatOutput: function(date) {
          return new Date(date).toString();
        }
      });

      var timeline = L.timeline(data, {
        getInterval: getInterval,
        pointToLayer: function(data, latlng){
          return L.circleMarker(latlng, {
            radius: self.pointRadius(data),
            color: '#FFFF00',
            fillColor: '#3EC300'
          }).bindPopup(self.popUpContent(data));
        }
      });

      timelineControl.addTo(self.map);

      timelineControl.addTimelines(timeline);

      timeline.addTo(self.map);
    },

    renderData: function(data) {
      var self = this;

      var earthquakePoint = function(feature, latlng) {
        var mag = feature.properties.mag,
            earthquakeMarker = L.circleMarker(latlng, {
              stroke: false,
              fillColor: '#3EC300',
              fillOpacity: 0.2,
              radius: self.pointRadius(feature)
            });

        return earthquakeMarker;
      };

      var earthquakeClick = function(feature, layer) {
        layer.bindPopup(self.popUpContent(feature));
      }

      self.earthquakeGeoJson = L.geoJson(data, {
        pointToLayer: earthquakePoint,
        onEachFeature: earthquakeClick
      }).addTo(self.map);

    },

    getData: function(start, end) {
      var self = this;
      var url = 'http://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=' + start + '&endtime=' + end;

      console.log(url);

      // self.map.removeLayer(self.earthquakeGeoJson);

      $.getJSON(url, function(data) {

        var earthquakeData = data;

        self.renderTimeline(earthquakeData);

        self.renderData(earthquakeData);

      });

    },

  }

  earthquakeMap.init();

})();
