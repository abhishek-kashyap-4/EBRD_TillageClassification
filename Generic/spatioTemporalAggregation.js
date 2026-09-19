/* 

Abhishek Kotcharlakota  == abhi4@umd.edu

This code is to aggregate imagecollections both temporally and spatially. 
It borrows from aggregateIndices script. Once it is finished, that script will be defunct. 
  ------------------  TemporalAggregation_VersionImgColl
                      Takes an image collection and returns an image, with the specific band aggregated
  ------------------  TemporalAggregation_VersionFColl 
                      Takes a feature collection and returns a feature collection with columns corresponding to bands aggregated. 
  ------------------  SpatialAggregation 
                      Takes an image and returns a featurecollection. If you have an imagecollection, you need to use toBands(). 
            
Updates to be made - 
--- time versions for max gradient (refer to aggregateIndices) - these normalize time by dividing the number of days. 
                I did implement these but they have to be tested. 
--- Argmaxes, small gradients. 
---  IMPORTANT Fcoll version of temporal aggregation only has basic ones for now. I need to create gradients etc for it too. 
                Theoritically, both temporal aggregation functions should be able to reuse same granular functions to reduce multiple versions that can induce errors if not maintained perfectly.

--- It would be nice to use severl scripts from Generic repo to automatically import, mozaic, calculateIndex, aggregate spatially and temporally and do preprocessing. 
        One generic script for everything. 
*/

/////////////////////////////////////////////////////////////
/////////////////////////////// Specific functions
//////////////////////////////////////////////////////////////
var aggGradient = function(collection, band,method,rename) {
  var col = collection.select(band).sort('system:time_start'); // order still matters
  var list = col.toList(col.size());
  // indices from 1 to N-1
  var indices = ee.List.sequence(1, col.size().subtract(1));
  
  var gradients = ee.ImageCollection(
        indices.map(function(i) {
                                    i = ee.Number(i);
                                    var img1 = ee.Image(list.get(i.subtract(1)));
                                    var img2 = ee.Image(list.get(i));
                                    // Gradient per timestep (Δt = 1)
                                    var gradient = img2.subtract(img1).rename(rename);
                                    return gradient.copyProperties(img2, ['system:time_start']);
                                  })
  );
  
  if(method == 'max'){
                       var result = gradients
                      .map(function(img) {
                      return img.abs();
                    })
                    .max();
    }else if (method == 'max_pos'){
                           var result = gradients.max();
    }else if (method == 'max_neg'){
                                var result = gradients.min(); 
    }else {
        throw new Error("Invalid mthod in aggGradient : "+method );
    }
    
  return result;
};

var aggGradient_timeVer = function(collection, band,method,rename) {
  var col = collection.select(band).sort('system:time_start'); // order still matters
  var list = col.toList(col.size());
  // indices from 1 to N-1
  var indices = ee.List.sequence(1, col.size().subtract(1));
  
  var gradients = ee.ImageCollection(
        indices.map(function(i) {
                                    i = ee.Number(i);
                                    var img1 = ee.Image(list.get(i.subtract(1)));
                                    var img2 = ee.Image(list.get(i));
                                    var deltaT = t2.difference(t1, 'day'); // time difference in days
                                    var gradient = img2.subtract(img1).divide(deltaT).rename(rename);
                                    return gradient.copyProperties(img2, ['system:time_start']);
                                  })
  );
  
  if(method == 'max'){
                       var result = gradients
                      .map(function(img) {
                      return img.abs();
                    })
                    .max();
    }else if (method == 'max_pos'){
                           var result = gradients.max();
    }else if (method == 'max_neg'){
                                var result = gradients.min(); 
    }else {
        throw new Error("Invalid mthod in aggGradient : "+method );
    }
    
  return result;
};
/////////////////////////////////////////////////////////////
/////////////////////////////// Separate aggregations (temporal, spatial)
//////////////////////////////////////////////////////////////
var TemporalAggregation_VersionImgColl = function(ImgColl, band, kind,rename){
  if(kind == 'min'){
    return ImgColl.select(band).min().select([band],[rename]);
  }else if(kind == 'max'){
    return ImgColl.select(band).max().select([band],[rename]);
  }else if(kind == 'mean'){
    return ImgColl.select(band).mean().select([band],[rename]);
  }else if(kind == 'median'){
    return ImgColl.select(band).median().select([band],[rename]);
  }else if(kind == 'sum'){
    return ImgColl.select(band).sum().select([band],[rename]);
  }else if(kind == 'max_gradient'){
    return aggGradient(ImgColl, band, 'max',rename);
  }else if(kind == 'max_pos_gradient'){
    return aggGradient(ImgColl, band, 'max_pos',rename);
  }else if(kind == 'max_neg_gradient'){
     return aggGradient(ImgColl, band, 'max_neg',rename);
  }else if(kind == 'max_gradient_timeVer'){
    return aggGradient_timeVer(ImgColl, band, 'max',rename);
  }else if(kind == 'max_pos_gradient_timeVer'){
     return aggGradient_timeVer(ImgColl, band, 'max_pos',rename);
  }else if(kind == 'max_neg_gradient_timeVer'){
      return aggGradient_timeVer(ImgColl, band, 'max_neg',rename);
  }else {
        throw new Error("Invalid aggregation kind: "+kind );
    }
}
/**********************************************************************************************/

var TemporalAggregation_VersionFColl = function(FC ,bands ,kind ,rename){
  if(kind == 'mean'){
    var reducer = ee.Reducer.mean();
  }else if(kind == 'median'){
    var reducer = ee.Reducer.median();
  }else if(kind == 'max'){
    var reducer = ee.Reducer.max();
  }else if(kind == 'min'){
    var reducer = ee.Reducer.min();
  }else{
     throw new Error("Invalid reducer in temporal aggregation: "+kind );
  }
  var aggregatedFC = FC.map(function(feature){
                      var values  = bands.map(function(band){ return feature.getNumber(band)})
                      var aggregated = ee.Array(values).reduce(reducer,[0]).get([0]);
                      return feature.set(rename,aggregated)
                                })
  return aggregatedFC;
}
/**********************************************************************************************/

var SpatialAggregation = function(Image,fc,kind,scale){
  if(kind == 'mean'){
                      var retFC =  Image.reduceRegions({
                      collection: fc,
                      reducer:ee.Reducer.mean(),
                      scale: scale,     
                      crs: 'EPSG:4326'           
                    });
                    }
 else if(kind == 'median'){
                       var retFC =  Image.reduceRegions({
                      collection: fc,
                      reducer:ee.Reducer.median(),
                      scale: scale,     
                      crs: 'EPSG:4326'           
                    });
                    }
   else if(kind == 'max'){
                       var retFC =  Image.reduceRegions({
                      collection: fc,
                      reducer:ee.Reducer.max(),
                      scale: scale,     
                      crs: 'EPSG:4326'           
                    });
                    }
    else{
     throw new Error("Invalid reducer in spatial aggregation: "+kind );
  }
  
  return retFC;
}
/*
var reducers = {
    'mean': ee.Reducer.mean(),
    'median': ee.Reducer.median(),
    'max': ee.Reducer.max()
  };
  
  // 2. Check if the requested 'kind' exists in our mapping
  if (!reducers.hasOwnProperty(kind)) {
    throw new Error("Invalid reducer in spatial aggregation: " + kind);
  }
*/
/////////////////////////////////////////////////////////////
/////////////////////////////// Combined Aggregations
//////////////////////////////////////////////////////////////
var SpatioTemporalAggregation_TemporalFirst  = function(ImgColl,FC, band, timeKind, spaceKind,scale){
  var rename = timeKind+'__'+band;
  var temporalAgImage = TemporalAggregation_VersionImgColl(ImgColl, band, timeKind,rename)
  
  // Dummy band needs to be added for the naming convention. reduceRegions does this frustrating thing where it renames the band if there is only one band.
  var dummyBand = ee.Image.constant(0).rename('dumm');
  temporalAgImage = temporalAgImage.addBands(dummyBand);
  
  var retFC =  SpatialAggregation(temporalAgImage, FC,spaceKind , scale)
  
  
  retFC = retFC.map(function(feature) {
  // Setting a property to null removes it from the feature
  return feature.set('dumm', null); 
  });
  return retFC;

}
var SpatioTemporalAggregation_SpatialFirst  = function(ImgColl,FC, band, spaceKind, timeKind,scale){
  
  var Image = ImgColl.select(band).toBands(); // Better to do this here to avoid false positive matching later on. 
  var spatialFC = SpatialAggregation(Image, FC,spaceKind , scale);
  
  var firstFeature = spatialFC.first(); 
  var keys = firstFeature.propertyNames(); 
  var filteredKeys = keys.map(function(key) {
    var str = ee.String(key);
    return ee.Algorithms.If(str.match('.*'+band+'$').length(), str, '');
  }).removeAll(['']);
  var bands = filteredKeys;
  var rename = timeKind+'__'+band;
  return TemporalAggregation_VersionFColl(spatialFC, bands , timeKind,rename);
   
}



//////////////////////////////////////////////////////////////////////////

exports.TemporalAggregation_VersionImgColl = TemporalAggregation_VersionImgColl;
exports.TemporalAggregation_VersionFColl = TemporalAggregation_VersionFColl;
exports.SpatialAggregation = SpatialAggregation;
exports.SpatioTemporalAggregation_TemporalFirst = SpatioTemporalAggregation_TemporalFirst;
exports.SpatioTemporalAggregation_SpatialFirst = SpatioTemporalAggregation_SpatialFirst;
