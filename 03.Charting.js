//////////////////////// Field level time series 

  var getFieldChartOld = function(ImgColl,RandomFeature,reduceBy,band){
                    if(reduceBy == 'mean'){ var reducer = ee.Reducer.mean()}
                    else if (reduceBy == 'median'){var reducer = ee.Reducer.median()}
                    else throw new Error("Invalid reduceBY type: "+reduceBy );
                    
                    var chart = ui.Chart.image.seriesByRegion({
                  imageCollection: ImgColl,
                  regions: RandomFeature.geometry(),
                  reducer: reducer,
                  band: band,
                  scale: 10,
                  xProperty: 'system:time_start',
                  //seriesProperty: 'field_id' // Unique ID property in your polygon attribute table
                });
          return chart;
           }
  var getFieldChart = function(ImgColl,RandomFeature,reduceBy,band,append){
                    append = (append !== undefined) ? append : '';
                    if(reduceBy == 'mean'){ var reducer = ee.Reducer.mean()}
                    else if (reduceBy == 'median'){var reducer = ee.Reducer.median()}
                    else throw new Error("Invalid reduceBY type: "+reduceBy );
                    
                    var chart = ui.Chart.image.series({
                  imageCollection: ImgColl.select(band),
                  region: RandomFeature.geometry(),
                  reducer: reducer,
                  scale: 10,
                  xProperty: 'system:time_start',
                  //seriesProperty: 'field_id' // Unique ID property in your polygon attribute table
                })
                .setOptions({
                          title: '---- '+ append+ ' Time Series -- ',
                          vAxis: {title: 'Value'},
                          hAxis: {title: 'Date', format: 'YYYY-MM'},
                          
                          // 1. Disable interpolation across null values
                          interpolateNulls: false,
                          
                          // 2. Set pointSize > 0 so single non-null points surrounded by gaps remain visible
                          pointSize: 3,
                          lineWidth: 1
                        });
          return chart;
           }
           
/////////////////////////////////////////////////////////////////////////////////////////////////
exports.getFieldChart = getFieldChart; 
