
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//

var getImageCollection = function(kind,beginning, ending,randomFeature,cloudMask){
  cloudMask = (cloudMask !== undefined) ? cloudMask : true;
  if(kind == 'Sentinel1'){
                             // 1. Load the Sentinel-1 Collection
                        var s1 = ee.ImageCollection("COPERNICUS/S1_GRD")
                          .filterBounds(randomFeature.geometry())
                          .filterDate(beginning, ending)
                          .filter(ee.Filter.eq('instrumentMode', 'IW'))
                          .sort('system:time_start'); // This ensures the list is chronological
                return s1
                          }
  if(kind == 'Sentinel2'){
                  // 2. Load the Sentinel-2 Collection
                  var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                  .filterBounds(randomFeature.geometry())
                  .filterDate(beginning, ending)    
                  //.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));
                  if(cloudMask)         {
                                          var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');
                                           s2 = s2.linkCollection(csPlus, ['cs'])
                                              .map(function(img) {
                                                // Keep pixels with clarity score >= 0.60
                                                var mask = img.select('cs').gte(0.40); 
                                                return img.updateMask(mask);
                                              });
                                         }
                  return s2;
                          }
  if(kind == 'MODIS_terra'){
                        
                    var terra = ee.ImageCollection("MODIS/061/MOD09GA")
                      .filterBounds(randomFeature.geometry())
                      .filterDate(beginning, ending);
                    return terra;
                          }
  if(kind == 'MODIS_aqua'){
                          var aqua = ee.ImageCollection("MODIS/061/MYD09GA")
                      .filterBounds(randomFeature.geometry())
                      .filterDate(beginning, ending); 
                      return aqua;
                          }
  if(kind == 'MODIS'){
                  var maskModisClouds= require('users/abhi4/Generic:CloudMasking').maskModisClouds;
                  var terra = ee.ImageCollection("MODIS/061/MOD09GA")
                .filterBounds(randomFeature.geometry())
                .filterDate(beginning, ending)
                .map(maskModisClouds);
              
              var aqua = ee.ImageCollection("MODIS/061/MYD09GA")
                .filterBounds(randomFeature.geometry())
                .filterDate(beginning, ending)
                .map(maskModisClouds);
              var combinedCol = terra.merge(aqua).sort('system:time_start');
              return combinedCol;
  }
    if(kind == 'HLS'){
                          function maskHLS(image) {
                      var fmask = image.select('Fmask');
                      // Bit 1: Cloud, Bit 2: Adjacent to Cloud, Bit 3: Cloud Shadow
                      var cloud = fmask.bitwiseAnd(1 << 1).neq(0);
                      var shadow = fmask.bitwiseAnd(1 << 3).neq(0);
                      var mask = cloud.or(shadow).not();
                      return image.updateMask(mask);
                    }
                var s30Bands = ['B2', 'B3', 'B4', 'B8A', 'B11', 'B12', 'Fmask'];
                var l30Bands = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'Fmask'];
                      // 1. Load HLS Sentinel-2 (S30) and HLS Landsat (L30)
                      var hlsS30 = ee.ImageCollection("NASA/HLS/HLSS30/v002")
                        .filterBounds(randomFeature.geometry())
                        .filterDate(beginning, ending)
                        .map(maskHLS)
                        .select(s30Bands);
                      
                      var hlsL30 = ee.ImageCollection("NASA/HLS/HLSL30/v002")
                        .filterBounds(randomFeature.geometry())
                        .filterDate(beginning, ending)
                        .map(maskHLS)
                        .select(l30Bands, s30Bands);
                      
                      // 2. Merge them into one virtual constellation
                      var hlsCombined = hlsS30.merge(hlsL30).sort('system:time_start');
                  return hlsCombined; 
                          }
    if(kind == 'Sentinel1Asc'){
                            var s1Col = ee.ImageCollection("COPERNICUS/S1_GRD")
                          .filterBounds(randomFeature.geometry())
                          .filterDate(beginning, ending)
                          .filter(ee.Filter.eq('instrumentMode', 'IW'))
                          .sort('system:time_start');
                          var ascending = s1Col.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
                    return ascending;      
                          }
    if(kind == 'Sentinel1Des'){
                            var s1Col = ee.ImageCollection("COPERNICUS/S1_GRD")
                          .filterBounds(randomFeature.geometry())
                          .filterDate(beginning, ending)
                          .filter(ee.Filter.eq('instrumentMode', 'IW'))
                          .sort('system:time_start');
                          var descending = s1Col.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
                    return descending;       
                          
                          
                          }
  
}


exports.getImageCollection = getImageCollection;