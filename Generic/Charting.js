
//creates new panel everytime
exports.makeChartPanel = function(monthly, point, title) {
  var chart = ui.Chart.image.series({
    imageCollection: monthly,
    region: point,
    reducer: ee.Reducer.mean(),
    scale: 10,
    xProperty: 'system:time_start'
  })
  .setChartType('LineChart')
  .setOptions({
    title: title,
    hAxis: {title: 'Date', format: 'MMM yyyy'},
    vAxis: {title: 'Backscatter (dB)'},
    lineWidth: 2,
    pointSize: 4
  });

  var panel = ui.Panel({style: {width: '420px'}});
  panel.add(chart);
  return panel;
};
/*
if(chartmaking)
{
  var start  = items[1][0]
  var end = items[1][1]
  var IC  = generate(ukraine , start,end)
  
  var monthly  = monthlyComposite(IC , start, end)
  var chartPanel = ui.Panel({style: {position: 'bottom-right'}});
ui.root.insert(1, chartPanel);

Map.onClick(function(coords) {
  chartPanel.clear();
  var point = ee.Geometry.Point([coords.lon, coords.lat]);
  var chart = makeChartPanel(monthly, point, 'Sentinel-1 Backscatter');
  chartPanel.add(chart);
});
}
*/


// ======================================
// NDVI on-click time series module
// ======================================

/**
 * Creates a map click handler that draws an NDVI chart
 * @param {ui.Map} map - GEE map object
 * @param {ui.Panel} panel - Panel to display the chart
 * @param {ee.ImageCollection} ic - Image collection
 * @param {string} band - band for time series. 
 * @param {number} scale - Pixel scale in meters
 */
exports.enableBandClickChart = function(map, panel, ic,band, scale) {

  map.onClick(function(coords) {
    panel.clear();

    var point = ee.Geometry.Point([coords.lon, coords.lat]);

    var chart = ui.Chart.image.series({
      imageCollection: ic.select(band),
      region: point,
      reducer: ee.Reducer.mean(),
      scale: scale
    })
    .setOptions({
      title: band+' Time Series',
      hAxis: {title: 'Date'},
      vAxis: {title: 'Band'},
      lineWidth: 2,
      pointSize: 4
    });

    panel.add(chart);
  });
};
/*
USAGE 
var ndviChart = require('users/your_username/utils/Charting');

// UI panel
var panel = ui.Panel({
  style: {width: '400px'}
});
ui.root.insert(1, panel);


// Map setup
Map.setCenter(30, 48, 6);

// Enable click chart
Charting.enableBandClickChart(
  Map,
  panel,
  ic,
  band,
  10   // scale (Sentinel-2)
);
*/