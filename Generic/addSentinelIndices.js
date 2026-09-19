

//////////////////////Indexes 
function calculateNDVI(image) {
  var nir = image.select('B8'); // NIR band
  var red = image.select('B4'); // Red band
  var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
  return image.addBands(ndvi);
}

function calculateNRFI(image){
  var green = image.select('B3'); 
  var swir = image.select('B11'); 
  var nrfi = green.subtract(swir).divide(green.add(swir)).rename('NRFI');
  return image.addBands(nrfi);
}
function calculateNRFI2(image){
  var green = image.select('B3'); 
  var swir = image.select('B12'); 
  var nrfi = green.subtract(swir).divide(green.add(swir)).rename('NRFI2');
  return image.addBands(nrfi);
}
function calculateNIR(image){
  var b8 = image.select('B8');
  var nir = b8.divide(10000).rename('NIR');
  return image.addBands(nir);
}
function calculateRENDVI(image) {
  var nir = image.select('B8A'); // NIR band
  var re = image.select('B5'); // Red band
  var rendvi = nir.subtract(re).divide(nir.add(re)).rename('RENDVI');
  return image.addBands(rendvi);
}
function calculateNDRE(image) {
  var nir = image.select('B8'); // NIR band
  var re = image.select('B5'); // Red band
  var ndre = nir.subtract(re).divide(nir.add(re)).rename('NDRE');
  return image.addBands(ndre);
}
function calculateNDWI(image) {
  var nir = image.select('B8'); // NIR band
  var swir = image.select('B11'); // Red band
  var ndwi = nir.subtract(swir).divide(nir.add(swir)).rename('NDWI');
  return image.addBands(ndwi);
}


/////////// Yellow Indices -- NDYI , YI , YI2 , YFI , SYR
function calculateNDYI(image){
  var green = image.select('B3'); 
  var blue = image.select('B2'); 
  var ndyi = green.subtract(blue).divide(green.add(blue)).rename('NDYI');
  return image.addBands(ndyi);
}

function calculateYI(image){
  var red = image.select('B4');
  var green = image.select('B3'); 
  var yi = red.divide(green).rename('YI');
  return image.addBands(yi);
}
function calculateYI2(image){
  var red = image.select('B4');
  var green = image.select('B3'); 
  var blue = image.select('B2'); 
  var yi = red.subtract(blue).divide(green).rename('YI2');
  return image.addBands(yi);
}
function calculateYFI(image){
  var green = image.select('B3'); 
  var re = image.select('B5'); 
  var yfi = green.subtract(re).divide(green.add(re)).rename('YFI');
  return image.addBands(yfi);
}
function calculateSYR(image){
  var green = image.select('B3'); 
  var red = image.select('B4'); 
  var blue = image.select('B2');
  var syr = green.add(red).divide(blue.add(blue)).rename('SYR');
  return image.addBands(syr);
}

///// Tillage Indices -  NDTI , STI ,NDI7 ,SRNDI ,  NDI5, NDSVI , MCRC
////https://www.sciencedirect.com/science/article/pii/S0167198722000915
function calculateNDTI(image){
    var swir1610 = image.select('B11'); 
  var swir2190  = image.select('B12');
  var ndti = swir1610.subtract(swir2190).divide(swir1610.add(swir2190)).rename('NDTI');
  return image.addBands(ndti);
}
function calculateSTI(image){
    var swir1610 = image.select('B11'); 
  var swir2190  = image.select('B12');
  var sti = swir1610.divide(swir2190).rename('STI');
  return image.addBands(sti);
}
function calculateNDI7(image){
    var nir865 = image.select('B8A'); 
  var swir2190  = image.select('B12');
  var ndi7 = nir865.subtract(swir2190).divide(nir865.add(swir2190)).rename('NDI7');
  return image.addBands(ndi7);
}
function calculateSRNDI(image){
  var swir2190  = image.select('B12');
    var red = image.select('B4'); 
  var ndi7 = swir2190.subtract(red).divide(red.add(swir2190)).rename('SRNDI');
  return image.addBands(ndi7);
}
function calculateNDI5(image){
    var nir865 = image.select('B8A'); 
  var swir1610 = image.select('B11'); 
  var ndi5 = nir865.subtract(swir1610).divide(nir865.add(swir1610)).rename('NDI5');
  return image.addBands(ndi5);
}
function calculateNDSVI(image){
  var swir1610 = image.select('B11'); 
    var red = image.select('B4'); 
  var ndsvi = swir1610.subtract(red).divide(red.add(swir1610)).rename('NDSVI');
  return image.addBands(ndsvi);
}
function calculateMCRC(image){
  var swir1610 = image.select('B11'); 
    var green = image.select('B3'); 
  var mcrc = swir1610.subtract(green).divide(green.add(swir1610)).rename('MCRC');
  return image.addBands(mcrc);
}
///////// BAI 
function calculateBAI(image) {
  // Sentinel-2 Central Wavelengths (in nanometers)
  // Red (B4) = 665 nm, NIR (B8) = 842 nm, SWIR2 (B12) = 2190 nm
  
  // x1 = wav(NIR - Red) = (842 - 665) / 2500
  var x1 = (842 - 665) / 2500; 
  
  // x2 = wav(SWIR2 - NIR) = (2190 - 842) / 2500
  var x2 = (2190 - 842) / 2500;

  var bai = image.expression(
    '180 - atan(y1 / x1) + atan(y2 / x2)', {
      'y1': image.select('B8').subtract(image.select('B4')),   // Ref_NIR - Ref_Red
      'y2': image.select('B12').subtract(image.select('B8')), // Ref_SWIR2 - Ref_NIR
      'x1': x1,
      'x2': x2
    }).rename('BAI');
    
  return image.addBands(bai);
}
function calculateBAI_HLS(image) {
  // For hls, just use B8A instead of B8
  //Sentinel 2 Central Wavelengths (in nanometers)
  // Red (B4) = 665 nm, NIR (B8A) = 865 nm, SWIR2 (B12) = 2190 nm
  
  // x1 = wav(NIR - Red) = (842 - 665) / 2500
  var x1 = (865 - 665) / 2500; 
  
  // x2 = wav(SWIR2 - NIR) = (2190 - 842) / 2500
  var x2 = (2190 - 865) / 2500;

  var bai = image.expression(
    '180 - atan(y1 / x1) + atan(y2 / x2)', {
      'y1': image.select('B8A').subtract(image.select('B4')),   // Ref_NIR - Ref_Red
      'y2': image.select('B12').subtract(image.select('B8A')), // Ref_SWIR2 - Ref_NIR
      'x1': x1,
      'x2': x2
    }).rename('BAI_HLS');
    
  return image.addBands(bai);
}

// Functions that do nothing; for automation of code to work.
function calculateVH(image){
  return image; // SHould already have VH 
}
function calculateVV(image){
  return image; // SHould already have VV
}
function calculateVVVH(image){
   var vv = image.select('VV'); 
    var vh = image.select('VH'); 
    var vvvh = vv.divide(vh).rename('VVVH');
    return image.addBands(vvvh);
}


var calculateSentinelIndex = function(type){
  return function(image) {
    if (type === "NDVI") {
        return calculateNDVI(image);
    } else if (type === "NDYI") {
        return calculateNDYI(image);
    } else if (type === "NRFI") {
        return calculateNRFI(image);
    }else if (type === "NRFI2") {
        return calculateNRFI2(image);
    }else if (type == 'RENDVI'){
      return calculateRENDVI(image);
    }else if (type == 'NDRE'){
      return calculateNDRE(image);
    }else if (type == 'NDWI'){
      return calculateNDWI(image);
    }
    else if (type === "YI") {
        return calculateYI(image);
    }else if (type === "YI2") {
        return calculateYI2(image);
    }else if (type === "NIR") {
        return calculateNIR(image);
    }else if (type === "VH") {
        return calculateVH(image);
    }else if (type === "VV") {
        return calculateVV(image);
    }else if (type === "VVVH") {
        return calculateVVVH(image);
    }else if (type === "VV_VH") {
        return calculateVVVH(image);   // Different codes might be using different ways (VVVH or VV_VH). But output will always be VVVH
    }else if (type === "YFI") {
        return calculateYFI(image);
    }else if (type === "SYR") {
        return calculateSYR(image);
    }else if (type === "NDTI") {
        return calculateNDTI(image);
    }else if (type === "STI") {
        return calculateSTI(image);
    }else if (type === "NDI7") {
        return calculateNDI7(image);
    }else if (type === "SRNDI") {
        return calculateSRNDI(image);
    }else if (type === "NDI5") {
        return calculateNDI5(image);
    }else if (type === "NDSVI") {
        return calculateNDSVI(image);
    }else if (type === "MCRC") {
        return calculateMCRC(image);
    }else if (type === "BAI") {
        return calculateBAI(image);
    }else if (type === "BAI_HLS") {
        return calculateBAI_HLS(image);
    }
    else {
        throw new Error("Invalid index type: "+type );
    }
  }
};

var calculateGLCMIndex = function(type,div,kernel , glcmGrp) { 
                            //type - band, div - range      //glcmGrp - _asm , _contrast, _corr, _ent
  // 1. Capture the index calculation function for the specific type
  var indexFunction = calculateIndex(type);
  
  // 2. Return the wrapper function that Collection.map() expects
  return function(image) {
    // 3. Apply the captured index function to the current image
    var indexedImage = indexFunction(image);
    // 4. Do your additional steps here
    var band = indexedImage.select(type);
    var gray = band.divide(div).multiply(32).toInt();
    var glcm = gray.glcmTexture({size: kernel});
    var last = glcm.select(type+glcmGrp)
    
    // 5. Return the final modified image
    return indexedImage.addBands(last) ;
        
  };
};

var calculateIndex = function(type){
  print('Warning -- Thre function name in addSentinelIndices changed from calculateIndex to calculateSentinelIndex. You should call accordingly; this function will de defunt in the future.')

  return calculateSentinelIndex(type);
}

exports.calculateSentinelIndex = calculateSentinelIndex;
exports.calculateIndex = calculateIndex ;
exports.calculateGLCMIndex = calculateGLCMIndex;

