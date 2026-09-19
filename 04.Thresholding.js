/*
Functions for thresholding

CONCERNS: 
images that are aquired during the tilalge practice may be confusing. 
Many times, tillage continues beyond the end date. The end date of tillage is only related to the part of the field tilled in the data. 

*/
 
var calculateSentinelIndex = require('users/abhi4/Generic:addSentinelIndices').calculateIndex;
var calculateMODISIndex = require('users/abhi4/Generic:addMODISIndices').calculateMODISIndex;
var getImageCollection = require('users/abhi4/UkraineEBRDRotation:01.Import_Satellite').getImageCollection;
var SpatioTemporalAggregation_TemporalFirst = require('users/abhi4/Generic:SpatioTemporalAggregation').SpatioTemporalAggregation_TemporalFirst;
var SpatioTemporalAggregation_SpatialFirst =  require('users/abhi4/Generic:SpatioTemporalAggregation').SpatioTemporalAggregation_SpatialFirst;

/////////////////////////////////////
  // A Thresholdable band has  - 
  // 1. Reduction at the field level (spatAg)
  // 2. Reduction across time (given window) (tempAg)
  // 3. Band in question. 
  // Note - I am not implementing static timesteps. They won't be reliable because tilalge event time isn't given. 

function getThresholdableBand_TemporalFirst(FC,kind, band,padding,tempAg,spatAg ){
  //Reduction across time happens first. 
  // This means, take pixel wise reduction across time, then aggregate field wise. 
    if(kind == 'MODIS' || kind == 'MODIS_aqua'|| kind == 'MODIS_terra')
    var calculateIndex = calculateMODISIndex;
  else if (kind == 'Sentinel2'|| kind == 'Sentinel1' || kind == 'HLS' || kind == 'Sentinel1Asc' || kind == 'Sentinel1Des')
    var calculateIndex = calculateSentinelIndex;
  else 
    throw new Error('(In Thresholding) Kind '+ kind +' not supported for adding indices yet.')
    
   var pattern = "YYYY/MM/dd HH:mm:ss.SSS";
   var aggregatedFC = FC.map(function(feature){
                                    var beginning = feature.get('Beginning')
                                    beginning = ee.Date.parse(pattern, beginning)
                                    var ending =  feature.get('End date')
                                    ending = ee.Date.parse(pattern, ending)
                                    
                                    beginning = beginning.advance(-padding,'day');
                                    ending = ending.advance(padding,'day');     //You may need to skip those that don't have good images in the time. Even better to do dynamic logic. 
                                    
                                  var Col = getImageCollection(kind,beginning, ending,feature);
                                  Col = Col.map(calculateIndex(band));
                                  var singleFC = ee.FeatureCollection([feature])
                                  singleFC = SpatioTemporalAggregation_TemporalFirst(Col,singleFC, band, tempAg ,spatAg,10)
                                  return singleFC.first();
   })
   return aggregatedFC; 
}
function getThresholdableBand_SpatialFirst(FC,kind, band,padding,spatAg,tempAg ){
  //Reduction across time happens first. 
  // This means, take pixel wise reduction across time, then aggregate field wise. 
    if(kind == 'MODIS' || kind == 'MODIS_aqua'|| kind == 'MODIS_terra')
    var calculateIndex = calculateMODISIndex;
  else if (kind == 'Sentinel2'|| kind == 'Sentinel1' || kind == 'HLS' || kind == 'Sentinel1Asc' || kind == 'Sentinel1Des')
    var calculateIndex = calculateSentinelIndex;
  else 
    throw new Error('(In Thresholding) Kind '+ kind +' not supported for adding indices yet.')
    
   var pattern = "YYYY/MM/dd HH:mm:ss.SSS";
   var aggregatedFC = FC.map(function(feature){
                                    var beginning = feature.get('Beginning')
                                    beginning = ee.Date.parse(pattern, beginning)
                                    var ending =  feature.get('End date')
                                    ending = ee.Date.parse(pattern, ending)
                                    
                                    beginning = beginning.advance(-padding,'day');
                                    ending = ending.advance(padding,'day');     //You may need to skip those that don't have good images in the time. Even better to do dynamic logic. 
                                    
                                  var Col = getImageCollection(kind,beginning, ending,feature);
                                  Col = Col.map(calculateIndex(band));
                                  var singleFC = ee.FeatureCollection([feature])
                                  singleFC = SpatioTemporalAggregation_SpatialFirst(Col,singleFC, band, spatAg,tempAg,10)
                                  return singleFC.first();
   })
   return aggregatedFC; 
}



///////////////////////////////////////////////
/* 
Code to detect thresholds based on binary classification
From: Gemini
*/
function findOptimalThreshold(fc, valueCol, classCol) {
  valueCol = valueCol || 'band';
  classCol = classCol || 'classification';
  
  fc = fc.filter(ee.Filter.notNull([valueCol]));
  // 1. Sort the collection by the feature value to evaluate sequential split points
  var sorted = fc.sort(valueCol);
  
  // Extract values and labels into EE Lists
  var values = sorted.aggregate_array(valueCol);
  var labels = sorted.aggregate_array(classCol);
  
  var totalCount = values.size();
  // 2. Compute candidate thresholds as midpoints between adjacent sorted values
  var headValues = values.slice(0, -1);
  var tailValues = values.slice(1);
  
  var candidateThresholds = headValues.zip(tailValues).map(function(pair) {
    pair = ee.List(pair);
    var v1 = ee.Number(pair.get(0));
    var v2 = ee.Number(pair.get(1));
    return v1.add(v2).divide(2);
  }).distinct(); // Remove duplicate midpoints

  
  // 3. Map over all candidate thresholds to compute accuracy for both split directions
  var accuracyResults = candidateThresholds.map(function(threshold) {
    var thresh = ee.Number(threshold);

    // Count correct predictions assuming Direction 1: Value <= Threshold -> Class 1
    // (We compare element-wise boolean evaluations)
    var correctDir1 = values.zip(labels).map(function(pair) {
      pair = ee.List(pair);
      var val = ee.Number(pair.get(0));
      var lbl = pair.get(1);
      
      var pred = ee.Algorithms.If(val.lte(thresh), labels.get(0), labels.get(-1));
      return ee.Number(ee.Algorithms.If(ee.Algorithms.IsEqual(pred, lbl), 1, 0));
    });

    var countCorrect1 = ee.Array(correctDir1).reduce(ee.Reducer.sum(), [0]).get([0]);
    var acc1 = ee.Number(countCorrect1).divide(totalCount);

    // Direction 2: Value > Threshold -> Class 1 (opposite polarity)
    var acc2 = ee.Number(1).subtract(acc1); 
    
    // Take the maximum accuracy between the two directional interpretations
    var maxAcc = acc1.max(acc2);

    return ee.Feature(null, {
      'accuracy': maxAcc,
      'threshold': thresh
    });
  });
  print(accuracyResults)

  // 4. Return the feature with the highest accuracy
  var bestFeature = ee.FeatureCollection(accuracyResults)
    .sort('accuracy', false)
    .first();
  
  
  return ee.Dictionary({
    'best_accuracy': bestFeature.get('accuracy'),
    'best_threshold': bestFeature.get('threshold')
  });
}
////////////
var getBandChart = function(FC_Classified_Filtered,finalBand ){
        // check the funciton, something is wrong. The chart doesn't show all points. 
        
    // 1. Separate your collection by the binary classification column B
        var class0 = FC_Classified_Filtered.filter(ee.Filter.eq('Classifica', 'Conservation'));
        var class1 = FC_Classified_Filtered.filter(ee.Filter.eq('Classifica', 'Conventional'));
        
        // 2. Combine them into a primary FeatureCollection with distinct properties for the chart
        // This creates separate series so GEE assigns distinct colors to Class 0 and Class 1
        var chartData = class0.map(function(f) {
          return f.set({'Value_Class0': f.get(finalBand), 'Value_Class1': null});
        }).merge(class1.map(function(f) {
          return f.set({'Value_Class0': null, 'Value_Class1': f.get(finalBand)});
        }));
        
        // 3. Create a scatter plot chart
        var chart = ui.Chart.feature.byFeature({
          features: chartData,
          xProperty: 'system:index', // Plots points sequentially
          yProperties: ['Value_Class0', 'Value_Class1']
        })
        .setChartType('ScatterChart')
        .setOptions({
          title: ' Values by Binary Classification',
          hAxis: {title: 'Feature Index'},
          vAxis: {title: finalBand},
          pointSize: 5,
          series: {
            0: {color: 'blue', labelInLegend: 'Conservation'},
            1: {color: 'red', labelInLegend: 'Conventional'}
          }
        });
        return chart;
}

///////////////////////////////////////////////////////////////////
exports.getThresholdableBand_TemporalFirst = getThresholdableBand_TemporalFirst;
exports.getThresholdableBand_SpatialFirst = getThresholdableBand_SpatialFirst;
exports.findOptimalThreshold = findOptimalThreshold;
exports.getBandChart = getBandChart;