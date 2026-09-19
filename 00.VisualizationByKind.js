/* 

This script just consists of which visualization to use. 
*/ 
var palettes = require('users/gena/packages:palettes');

var getViz = function(kind, band){
  band = (band !== undefined) ? band : 'TC';
  
  if(kind == 'Sentinel2'){
                          if(band == 'TC'){
                                            var finalViz ={
                                                  bands: ['B4', 'B3', 'B2'],
                                                  min: 0,
                                                  max: 3000 //0.3, 3000
                                                };        
                                           }
                          else if(band == 'FC'){
                                            var finalViz ={
                                                        bands: ['B12', 'B8', 'B4'],
                                                        min: 0,
                                                        max: 3000
                                                      };   
                                           }
                          else if(band == 'STI'){
                                            var finalViz ={
                                                        bands: ['STI'],
                                                        min: 0.5,
                                                        max: 3
                                                      };   
                                           }
                          else if(band == 'BAI'){
                                            var finalViz ={
                                                        bands: ['BAI'],
                                                        min:170,
                                                        max:180
                                                      };   
                                           }
                           else throw new Error("For Kind-"+kind+", Band- "+band+" is not recognized.");
  }
  else if(kind == 'MODIS'){
                          if(band == 'TC'){
                                            var finalViz ={
                                                  bands: ['sur_refl_b01', 'sur_refl_b04', 'sur_refl_b03'],
                                                    min: 0,
                                                    max: 3000
                                                  };      
                                           }
                          else if(band == 'FC'){
                                            var finalViz ={
                                                        bands: ['sur_refl_b02', 'sur_refl_b01', 'sur_refl_b01'],
                                                        min: 0.0,
                                                        max: 3000.0
                                                      }; 
                                           }
                          else if(band == 'STI'){
                            var palette = palettes.crameri.bilbao [10].reverse();
                                            var finalViz ={
                                                        bands: ['STI'],
                                                        min: 0.5,
                                                        max: 3,
                                                        palette :palette
                                                        
                                                      };   
                                           }
                          else throw new Error("For Kind-"+kind+", Band- "+band+" is not recognized.");
  }
  else throw new Error("For Kind-"+kind+"Vizualization isn't defined. Use Custom.");
  
return finalViz;
}


exports.getViz = getViz; 