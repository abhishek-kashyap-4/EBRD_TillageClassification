/* 
In the future, maybe combine all the add indices into one script. 
  Have to be careful since even the names such as calculateNDVI need to be changed depending on the satellite. 
  

*/ 

//////////////////////Generic Indexes 
function calculateNDVI(image) {
  var nir = image.select('sur_refl_b02'); // NIR band
  var red = image.select('sur_refl_b01'); // Red band
  var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
  return image.addBands(ndvi);
}

//////////////////////Tillage Indexes 



///// Tillage Indices -  NDTI , STI ,NDI7 ,SRNDI ,  NDI5, NDSVI , MCRC
////https://www.sciencedirect.com/science/article/pii/S0167198722000915
function calculateNDTI(image){
    var swir1640 = image.select('sur_refl_b06'); 
  var swir2130  = image.select('sur_refl_b07');
  var ndti = swir1640.subtract(swir2130).divide(swir1640.add(swir2130)).rename('NDTI');
  return image.addBands(ndti);
}
function calculateSTI(image){
   var swir1640 = image.select('sur_refl_b06'); 
  var swir2130  = image.select('sur_refl_b07');
  var sti = swir1640.divide(swir2130).rename('STI');
  return image.addBands(sti);
}
function calculateNDSVI(image){
  var swir1640 = image.select('sur_refl_b06'); 
    var red = image.select('sur_refl_b01'); 
  var ndsvi = swir1640.subtract(red).divide(red.add(swir1640)).rename('NDSVI');
  return image.addBands(ndsvi);
}


var calculateMODISIndex = function(type){
  return function(image) {
    if (type === "NDVI") {
        return calculateNDVI(image);
    } else if (type === "NDTI") {
        return calculateNDTI(image);
    }else if (type === "STI") {
        return calculateSTI(image);
    }else if (type === "NDSVI") {
        return calculateNDSVI(image);
    }
    else {
        throw new Error("Invalid index type: "+type );
    }
  }
};


exports.calculateMODISIndex = calculateMODISIndex;