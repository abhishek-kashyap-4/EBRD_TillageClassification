var data = ee.FeatureCollection("users/abhi4/UkraineEBRD/Tillage/EBRD_merged_20251212"),
    bbox = ee.FeatureCollection("users/abhi4/UkraineEBRD/Sumy_Chernihiv_bbox_HDX"),
    geometry = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[33.96653081161016, 50.80615812564595],
          [33.96653081161016, 50.80371724564206],
          [33.97228146773809, 50.80371724564206],
          [33.97228146773809, 50.80615812564595]]], null, false),
    FC_Classified = ee.FeatureCollection("users/abhi4/UkraineEBRD/Tillage/EBRD_merged_classified");
/*
Script - knowledgeBasedDetection 

Pipeline to import, visualize, chart and threshold different kinds of data. 
Remember that the working pipline should calculate bands even if it is just visualizing true images. Because I want to be be able to inspect.

Things removed form this script - 
 GLCM stuff. Add it back later. 
if(getGLCM){
  var type = 'VV' // For now, this is manual. Iterate through band_list in the future if you want.
  var div = 1000; //manually set them.
  var kernel = 7
  var glcmGrp = '_corr' // values=> _asm , _contrast, _corr, _ent
Col = Col.map(calculateGLCMIndex(type,div,kernel , glcmGrp))
}

    //var filter_pureWinter = false; // I am on using this to filter out harvest signals. We don't want to detect harvest instead of tillage.
    // UPDATE i don't think I need to do this. 
*/



//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//

//This function vizualizes image collections. To get temporal aggregation, you need to define another function.
var vizPipeline = function(imgColl , viz, randomFeature,append){ //viz has the bands, min, max. Period is just ImageCollection (It can be changed later)
                                              //Randomfeature has to be passed since Map is being called automatically and if we want feature on top, we need to curcumvent the parallelism.
              imgColl.evaluate(function(ids) {
              ids.features.forEach(function(feature) {
                var imageId = feature.id;
                var date = feature.properties['system:index']; 
                //var image = ee.Image(imageId); // this won't work for new bands. use system index to filter. 
                var image = imgColl.filter(ee.Filter.eq('system:index', date)).first(); //this isnt working on HLS
                //Map.addLayer(image, viz, viz.get('bands').join(',') + ' - ' + date);
                Map.addLayer(image, viz, append + ' - ' + date,false);
              });
               Map.addLayer(ee.Feature(randomFeature));
            });
           
}
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//

//+++++++++++++++++++++++++++++++++ REQUIREMENTS   ++++++++++++++++++++++++++++++++++++++++++++++//
var calculateSentinelIndex = require('users/abhi4/Generic:addSentinelIndices').calculateIndex;
var calculateMODISIndex = require('users/abhi4/Generic:addMODISIndices').calculateMODISIndex;
var calculateGLCMIndex = require('users/abhi4/Generic:addSentinelIndices').calculateGLCMIndex;
var bandChart = require('users/abhi4/Generic:Charting').enableBandClickChart;

var SpatioTemporalAggregation_TemporalFirst = require('users/abhi4/Generic:SpatioTemporalAggregation').SpatioTemporalAggregation_TemporalFirst;
var SpatioTemporalAggregation_SpatialFirst =  require('users/abhi4/Generic:SpatioTemporalAggregation').SpatioTemporalAggregation_SpatialFirst;
var SpatialAggregation =  require('users/abhi4/Generic:SpatioTemporalAggregation').SpatialAggregation
//(ImgColl,FC, band, spaceKind, timeKind,scale)

//     Local Requirements
var getImageCollection = require('users/abhi4/UkraineEBRDRotation:01.Import_Satellite').getImageCollection;
var getViz = require('users/abhi4/UkraineEBRDRotation:00.VisualizationByKind').getViz;
var getFieldChart = require('users/abhi4/UkraineEBRDRotation:03.Charting').getFieldChart;
var getThresholdableBand_TemporalFirst  = require('users/abhi4/UkraineEBRDRotation:04.Thresholding').getThresholdableBand_TemporalFirst;
var getThresholdableBand_SpatialFirst  = require('users/abhi4/UkraineEBRDRotation:04.Thresholding').getThresholdableBand_SpatialFirst;
var findOptimalThreshold  = require('users/abhi4/UkraineEBRDRotation:04.Thresholding').findOptimalThreshold;
var getBandChart  = require('users/abhi4/UkraineEBRDRotation:04.Thresholding').getBandChart;
//+++++++++++++++++++++++++++++++++ VARIABLES ++++++++++++++++++++++++++++++++++++++++++++++//

var thresholding = true; 
var verbose = false;




var filteredSet = data.filter(ee.Filter.or( 
                      ee.Filter.eq('operation_','Tillage'),
                      ee.Filter.eq('operation_','Tillage + Fertilization'),
                       ee.Filter.eq('operation_','Tillage + Sowing_cover_crop')
                      ))
var dynamicSeed = Date.now();
filteredSet = filteredSet.randomColumn('random',dynamicSeed)
var randomFeature = filteredSet.sort('random').limit(1).first();

Map.centerObject(randomFeature);


if (verbose){
  print(randomFeature)
  var till_area =  randomFeature.get('Area, ha')
  var field_area  = randomFeature.get('FieldAreaH')
  print("Tilled area ",till_area,'Field Area',field_area)
  print("Actual dates")
  var pattern = "YYYY/MM/dd HH:mm:ss.SSS";
  var beginning = randomFeature.get('Beginning')
  beginning = ee.Date.parse(pattern, beginning)
  var ending =  randomFeature.get('End date')
  ending = ee.Date.parse(pattern, ending)
  print(beginning)
  print(ending)
  print(randomFeature.get('operation_')) 
}
//+++++++++++++++++++++++++++++++++  WORKING  ++++++++++++++++++++++++++++++++++++++++++++++//
// For charting, don't visualize. Workingpipline depends on only 1 padding variable. 
var workingPipeline =function(randomFeature, kind, padding, bands_list,append, tasks, additionalOptions){
  /*
  Pipeline does the following -
  -- Get the specific kind of satellite imagery with defined padding (So time would be feature tillage += padding days)
  -- Calculate the required bands 
  -- Perform the tasks - this can be visualization, field chart, click chart etc. 
                          Though you can perform multiple in the same pipline, avoid it because tasks usually have different padding (You may only want to visualize tilalge but print chart longer)
  
  */
  print('Retuning without doing anything. Remove this for working')
  return 
  if(verbose) {print("++++++++++++++ NEW PIPELINE CALL++++++++++++++++++")}
  
  var pattern = "YYYY/MM/dd HH:mm:ss.SSS";
  var beginning = randomFeature.get('Beginning')
  beginning = ee.Date.parse(pattern, beginning)
  var ending =  randomFeature.get('End date')
  ending = ee.Date.parse(pattern, ending)
  beginning = beginning.advance(-padding,'day');
  ending = ending.advance(padding,'day');
  if(verbose){
              print("Padded dates")
              print(beginning)
              print(ending)
              }
              
  var Col = getImageCollection(kind,beginning, ending,randomFeature,true)
  if(verbose) print(Col," data, first instance.")
  
  if(kind == 'MODIS' || kind == 'MODIS_aqua'|| kind == 'MODIS_terra')
    var calculateIndex = calculateMODISIndex;
  else if (kind == 'Sentinel2'|| kind == 'Sentinel1' || kind == 'HLS' || kind == 'Sentinel1Asc' || kind == 'Sentinel1Des')
    var calculateIndex = calculateSentinelIndex;
  else 
    throw new Error('Kind '+ kind +' not supported for adding indices yet.')
  
  bands_list.forEach(function(index) {
     Col = Col.map(calculateIndex(index));
  });
  if(verbose) print(Col," data with indices")
  
  if(tasks.visualizeImages){
     if (verbose) print('Visualizing images.....')
      var finalViz = additionalOptions.imgViz;
      vizPipeline(Col,finalViz,randomFeature,append)
                            }
  if(tasks.visualizeBand){
    if (verbose) print('Visualizing Specific Band.....')
    // For now, the behaviour is to visualize the first band 
    var finalViz = additionalOptions.bandViz; // if you're getting weird viz problem, change the name of this var.
    vizPipeline(Col,finalViz,randomFeature,append)
                            
                            }
  if(tasks.clickChart){
    if (verbose) print('Creating Click Chart.....')
    var chartBand = additionalOptions.clickChartBand;
                      // UI panel
                      var panel = ui.Panel({
                        style: {width: '400px'}
                      });
                      ui.root.insert(1, panel);
                    // Enable click chart
                    bandChart(
                      Map,
                      panel,
                      Col,
                      chartBand,
                      10   // scale (Sentinel-2)
                    );
                            
                            }
   if(tasks.fieldChart){
     if (verbose) print('Creating Field Level timeseries.....')
     var chartBand = additionalOptions.fieldChartBand; // if error, change name. 
      var reduction = additionalOptions.fieldReduction;
      print(getFieldChart(Col, randomFeature,reduction,chartBand,kind))
                            }
    
  
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//
//+++++++++++++++++++++++++++++++++  RUN  ++++++++++++++++++++++++++++++++++++++++++++++//

///// ++++++ First run 
var kind = 'Sentinel2'
var append = 'S2'
var padding = 5
var bands_list = ['STI','NDTI','MCRC','BAI'] 
var tasks = {
  'visualizeImages': true,
  'visualizeBand':true
}
var finalViz = getViz(kind,'TC')
var additionalOptions = {
  'imgViz': finalViz,
  'bandViz': getViz(kind,bands_list[0]),
}
workingPipeline(randomFeature, kind, padding, bands_list,append, tasks, additionalOptions)

//////// ++++ Second Run
var kind = 'MODIS'
var append = 'MOD'
var padding = 5
var bands_list = ['STI','NDTI','NDSVI'] 
var tasks = {
  'visualizeImages': true,
  'visualizeBand':true
}
var finalViz = getViz(kind,'TC')
var additionalOptions = {
  'imgViz': finalViz,
  'bandViz': getViz(kind,bands_list[0]),
  
}
workingPipeline(randomFeature, kind, padding, bands_list,append, tasks, additionalOptions)

////////////////////////////////////////////////////////////////////////  
//////////////////////////////////// Charting 

//////// ++++ Sentinel Charts
var kind = 'Sentinel2'
var append = 'S2'
var padding = 100
var bands_list = ['STI'] 
var tasks = {
  'fieldChart': true
}
var additionalOptions = {
  'fieldChartBand': bands_list[0],
  'fieldReduction': 'mean',
}
workingPipeline(randomFeature, kind, padding, bands_list,append, tasks, additionalOptions)

var kind = 'Sentinel2'
var append = 'S2'
var padding = 10
var bands_list = ['STI'] 
var tasks = {
  'clickChart': true
}
var additionalOptions = {
  'clickChartBand': bands_list[0]
}
workingPipeline(randomFeature, kind, padding, bands_list,append, tasks, additionalOptions)

//////// ++++ MODIS Charts
var kind = 'MODIS'
var append = 'MOD'
var padding = 100
var bands_list = ['STI'] 
var tasks = {
  'fieldChart': true
}
var additionalOptions = {
  'fieldChartBand': bands_list[0],
  'fieldReduction': 'mean',
}
workingPipeline(randomFeature, kind, padding, bands_list,append, tasks, additionalOptions)

var kind = 'MODIS'
var append = 'MOD'
var padding = 10
var bands_list = ['STI'] 
var tasks = {
  'clickChart': true
}
var additionalOptions = {
  'clickChartBand': bands_list[0]
}
workingPipeline(randomFeature, kind, padding, bands_list,append, tasks, additionalOptions)
/////// Additional imagery


/*
var bands_list_sar = ['VH']
var sarViz = {
  bands: [bands_list_sar[0]],
  min:-30,
  max:0
}
kind = 'Sentinel1Asc'
var sarColAsc = getImageCollection(kind,beginning, ending,randomFeature)
vizPipeline(sarColAsc,sarViz,randomFeature,'S1ASC')
kind = 'Sentinel1Des'
var sarColDes = getImageCollection(kind,beginning, ending,randomFeature)
vizPipeline(sarColDes,sarViz,randomFeature,'S1DES')

*/

//+++++++++++++++++++++++++++Click Chart++++++++++++++++++++++++++++++++++++++++//


//++++++++++++++++++++++++++++++++++ Thresholding ++++++++++++++++++++++++++++++++++++++++++++++++//

var FC_Classified_Tillage = FC_Classified.filter(ee.Filter.or(
                                        ee.Filter.eq('Classifica','Conventional'),
                                        ee.Filter.eq('Classifica','Conservation')
                                        ));
if( thresholding){
       
  var FC = data
  var kind = 'Sentinel1'
  var band = 'VH'
  var padding = 5
  var tempAg = 'min'
  var spatAg = 'mean'
  var classCol = 'Classifica'
  
  var dynamicSeed = Date.now();
    var class0 = FC_Classified_Tillage.filter(ee.Filter.eq(classCol, 'Conservation'))
                   .randomColumn('random', dynamicSeed)
                   .sort('random')
                   .limit(5);
    var class1 = FC_Classified_Tillage.filter(ee.Filter.eq(classCol, 'Conventional'))
                   .randomColumn('random', dynamicSeed+1)
                   .sort('random')
                   .limit(5);
    var FC_Classified_Filtered = class0.merge(class1);

  
   //var FC_Classified_Filtered =  FC_Classified_Tillage.randomColumn('random',dynamicSeed)
   //var FC_Classified_Filtered = FC_Classified_Filtered.sort('random').limit(100);
   

  FC_Classified_Filtered =  getThresholdableBand_TemporalFirst(FC_Classified_Filtered,kind, band,padding,tempAg,spatAg )
  print(FC_Classified_Filtered.first())
  //print('Filtered size',FC_Classified_Filtered.size())
  var finalBand = tempAg+'__'+band
  // TRY var finalBand = 'random' for baseline
  //print(getBandChart(FC_Classified_Filtered,finalBand));
  
  //var ddam = findOptimalThreshold(FC_Classified_Filtered, finalBand, classCol)
  //++++++++++++++++++++Finding the best threshold++++++++++++++++++++++++++++
  // 1. Sort the collection by the feature value to evaluate sequential split points
  var valueCol = finalBand; 
  FC_Classified_Filtered = FC_Classified_Filtered.filter(ee.Filter.notNull([valueCol]));
  var sorted = FC_Classified_Filtered.sort(valueCol);
  // Extract values and labels into EE Lists
  var values = sorted.aggregate_array(valueCol); // Values may have nulls, which will be ignored by aggregate_array
  var labels = sorted.aggregate_array(classCol);
  //print('Values size is ', values.size(), 'Unique are', values.distinct().size())
  //print('Labels size is ', labels.size(), 'Unique are', labels.distinct().size())
  
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
  
        candidateThresholds=candidateThresholds.shuffle().slice(0,20)
        
          var accuracyResults = candidateThresholds.map(function(threshold) {
            var thresh = ee.Number(threshold);
        
            var conservation_less = FC_Classified_Filtered.filter(ee.Filter.and(ee.Filter.eq(classCol, 'Conservation'), ee.Filter.lte(valueCol, thresh))).size();
            var conservation_more = FC_Classified_Filtered.filter(ee.Filter.and(ee.Filter.eq(classCol, 'Conservation'), ee.Filter.gt(valueCol, thresh))).size();
            var conventional_less = FC_Classified_Filtered.filter(ee.Filter.and(ee.Filter.eq(classCol, 'Conventional'), ee.Filter.lte(valueCol, thresh))).size();
            var conventional_more = FC_Classified_Filtered.filter(ee.Filter.and(ee.Filter.eq(classCol, 'Conventional'), ee.Filter.gt(valueCol, thresh))).size();
            
            var total = FC_Classified_Filtered.size();
            // Calculate both directional accuracies
            // Direction 1: Good < Thresh AND Bad >= Thresh
            var acc1 = ee.Number(conservation_less).add(conventional_more).divide(total);
            // Direction 2: Good >= Thresh AND Bad < Thresh
            var acc2 = ee.Number(conservation_more).add(conventional_less).divide(total);
            // Select the maximum accuracy
            var maxAccuracy = acc1.max(acc2);
            
            return ee.Feature(null, {
              'accuracy': maxAccuracy,
              'threshold': thresh
            });
          });
    var bestFeature = ee.FeatureCollection(accuracyResults)
    .sort('accuracy', false)
    .first();
    var ddam = ee.Dictionary({
    'best_accuracy': bestFeature.get('accuracy'),
    'best_threshold': bestFeature.get('threshold')
                     });
  
    
  
  
  //++++++++++++++++++++++++++++++++++++++++++++++++
  print(ddam)
  /*var threshold = ddam.get('best_threshold');
  print(threshold)
  var less = FC_Classified_Filtered.filter(ee.Filter.lte(finalBand, threshold))
  var more = FC_Classified_Filtered.filter(ee.Filter.gt(finalBand, threshold))
  print(less.size(),'less')
  print(more.size(),'more')
  var uniqueValues = less.aggregate_array('Classifica').distinct();
  print('Less Unique Values:', uniqueValues);
  var uniqueValues = more.aggregate_array('Classifica').distinct();
  print('More Unique Values:', uniqueValues);
  */
  
  /*
  For some reason this code doesn't work. Very weird
  var less_conventional = less.filter(ee.Filter.eq('Classifica', 'Conventional'))
  var more_conventional = more.filter(ee.Filter.eq('Classifica', 'Conventional'))
  var less_conservation = less.filter(ee.Filter.eq('Classifica', 'Conservation'))
  var more_conservation = more.filter(ee.Filter.eq('Classifica', 'Conservation'))
  
  print('Less Conventional',less_conventional )
  print('more_conventional',more_conventional)
  print('more_conservation',less_conservation)
  print('less_conservation',less_conservation)
  */
    /*  var lessValueCounts = less.reduceColumns({
      reducer: ee.Reducer.frequencyHistogram(),
      selectors: ['Classifica']
    }).get('histogram');
    
    // Cast to ee.Dictionary and print
    print('Less Value Counts:', ee.Dictionary(lessValueCounts));
    
    var moreValueCounts = more.reduceColumns({
      reducer: ee.Reducer.frequencyHistogram(),
      selectors: ['Classifica']
    }).get('histogram');
    
    // Cast to ee.Dictionary and print
    print('More Value Counts:', ee.Dictionary(moreValueCounts));
    */
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////// Run templates
/* 

var kind = 'Sentinel2'
var append = 'S2'
var padding = 5
var bands_list = ['STI','NDTI','MCRC','BAI'] 
var tasks = {
  'visualizeImages': true,
  'visualizeBand':true,
  'clickChart': false,
  'fieldChart': false
}
var finalViz = getViz(kind,'TC')
var additionalOptions = {
  'imgViz': finalViz,
  'bandViz': getViz(kind,bands_list[0]),
}
workingPipeline(randomFeature, kind, padding, bands_list,append, tasks, additionalOptions)

//// BASIC CHARTING IDEA
var kind = 'Sentinel2'
var append = 'S2'
var padding = 100
var bands_list = ['STI','NDTI','MCRC','BAI'] 
var tasks = {
  'visualizeImages': false,
  'visualizeBand':false,
  'clickChart': true,
  'fieldChart': true
}

var additionalOptions = {
  'clickChartBand': bands_list[0],
  'fieldChartBand': bands_list[0],
  'fieldReduction': 'mean',
}
workingPipeline(randomFeature, kind, padding, bands_list,append, tasks, additionalOptions)
*/
