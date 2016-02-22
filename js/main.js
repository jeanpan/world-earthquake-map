(function(){
  'use strict';

  var earthquakeMap = {
    init: function() {
      var self = this;

      self.map = L.map('map').setView([25.091075, 121.559834], 3),
      self.earthquakeGeoJson = '';

      var CartoDBTiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        attribution: 'Map Data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> Contributors, Map Tiles &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
      });

      self.map.addLayer(CartoDBTiles);

      self.createRangeList();

      var dates = self.parseDateRange($("#date-range :selected").val());

      self.render(dates[0], dates[1]);

      $('#date-range').change(function() {
        var dates = self.parseDateRange($(this).val());
        self.render(dates[0], dates[1]);
      });

    },

    parseDateRange: function(str) {
      // format: 2016-02-21 - 2016-02-22
      return str.split(" - ");
    },

    createRangeList: function() {
      var ranges = {
        'Yesterday': [moment().subtract(1, 'days'), moment()],
        'Last 3 Days': [moment().subtract(3, 'days'), moment()],
        'Last 7 Days': [moment().subtract(7, 'days'), moment()],
        'Last 10 Days': [moment().subtract(10, 'days'), moment()],
        'Last 30 Days': [moment().subtract(30, 'days'), moment()],
        'This week': [moment().startOf('week'), moment()],
        'This month': [moment().startOf('month'), moment().endOf('month')]
      };

      var options = '';

      $.each(ranges, function(i, val) {
        var start = val[0].format('YYYY-MM-DD'),
            end = val[1].format('YYYY-MM-DD');

        options += '<option value="' + start + ' - ' + end + '">' + i + '</option>';
      });

      $('#date-range').html(options);
    },

    render: function(start, end) {
      var self = this;
      var url = 'http://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=' + start + '&endtime=' + end;
      console.log(url);

      self.map.removeLayer(self.earthquakeGeoJson);

      $.getJSON(url, function(data) {
        var earthquakeData = data;

        var earthquakePoint = function(feature, latlng) {
          var mag = feature.properties.mag,
              earthquakeMarker = L.circleMarker(latlng, {
                stroke: false,
                fillColor: '#3EC300',
                fillOpacity: 0.2,
                radius: Math.pow(2, mag) / 2
              });

          return earthquakeMarker;
        };

        var earthquakeClick = function(feature, layer) {
          var place = feature.properties.place,
              arr = place.split(", "),
              loc = arr[0],
              country = arr[1];

          var content = '<p class="place">' + loc + '</p>' +
                        '<p class="country">' + country + '</p>' +
                        '<p class="desc"><span class="mag">' + feature.properties.mag + '</span>' +
                        '<a href="' + feature.properties.place + '" target="_blank">More</a></p>';

          layer.bindPopup(content);
        }

        self.earthquakeGeoJson = L.geoJson(earthquakeData, {
          pointToLayer: earthquakePoint,
          onEachFeature: earthquakeClick
        }).addTo(self.map);

      });

    }
  }

  earthquakeMap.init();

})();
