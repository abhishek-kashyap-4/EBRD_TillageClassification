import numpy as np


"Dataframe version of GEE code"
def calculateSentinelIndex(df, index):

    # //////////////////////Indexes
    if index == "NDVI":
        # NIR band: B8, Red band: B4
        df["NDVI"] = (df["B08"] - df["B04"]) / (df["B08"] + df["B04"])

    elif index == "NRFI":
        # Green: B3, SWIR: B11
        df["NRFI"] = (df["B03"] - df["B11"]) / (df["B03"] + df["B11"])

    elif index == "NRFI2":
        # Green: B3, SWIR: B12
        df["NRFI2"] = (df["B03"] - df["B12"]) / (df["B03"] + df["B12"])

    elif index == "NIR":
        # Scale B8 reflectance
        df["NIR"] = df["B08"] / 10000.0

    elif index == "RENDVI":
        # NIR band: B8A, Red band: B5
        df["RENDVI"] = (df["B8A"] - df["B05"]) / (df["B8A"] + df["B05"])

    elif index == "NDRE":
        # NIR band: B8, Red band: B5
        df["NDRE"] = (df["B08"] - df["B05"]) / (df["B08"] + df["B05"])

    elif index == "NDWI":
        # NIR band: B8, SWIR band: B11
        df["NDWI"] = (df["B08"] - df["B11"]) / (df["B08"] + df["B11"])

    # /////////// Yellow Indices -- NDYI , YI , YI2 , YFI , SYR
    elif index == "NDYI":
        # Green: B3, Blue: B2
        df["NDYI"] = (df["B03"] - df["B02"]) / (df["B03"] + df["B02"])

    elif index == "YI":
        # Red: B4, Green: B3
        df["YI"] = df["B04"] / df["B03"]

    elif index == "YI2":
        # Red: B4, Green: B3, Blue: B2
        df["YI2"] = (df["B04"] - df["B02"]) / df["B03"]

    elif index == "YFI":
        # Green: B3, Red Edge: B5
        df["YFI"] = (df["B03"] - df["B05"]) / (df["B03"] + df["B05"])

    elif index == "SYR":
        # Green: B3, Red: B4, Blue: B2
        df["SYR"] = (df["B03"] + df["B04"]) / (df["B02"] + df["B02"])

    # ///// Tillage Indices -  NDTI , STI ,NDI7 ,SRNDI ,  NDI5, NDSVI , MCRC
    # ////https://www.sciencedirect.com/science/article/pii/S0167198722000915
    elif index == "NDTI":
        # SWIR1610: B11, SWIR2190: B12
        df["NDTI"] = (df["B11"] - df["B12"]) / (df["B11"] + df["B12"])

    elif index == "STI":
        # SWIR1610: B11, SWIR2190: B12
        df["STI"] = df["B11"] / df["B12"]

    elif index == "NDI7":
        # NIR865: B8A, SWIR2190: B12
        df["NDI7"] = (df["B8A"] - df["B12"]) / (df["B8A"] + df["B12"])

    elif index == "SRNDI":
        # SWIR2190: B12, Red: B4
        df["SRNDI"] = (df["B12"] - df["B04"]) / (df["B04"] + df["B12"])

    elif index == "NDI5":
        # NIR865: B8A, SWIR1610: B11
        df["NDI5"] = (df["B8A"] - df["B11"]) / (df["B8A"] + df["B11"])

    elif index == "NDSVI":
        # SWIR1610: B11, Red: B4
        df["NDSVI"] = (df["B11"] - df["B04"]) / (df["B04"] + df["B11"])

    elif index == "MCRC":
        # SWIR1610: B11, Green: B3
        df["MCRC"] = (df["B11"] - df["B03"]) / (df["B03"] + df["B11"])

    # ///////// BAI
    elif index == "BAI":
        # Sentinel-2 Central Wavelengths (in nanometers)
        # Red (B4) = 665 nm, NIR (B8) = 842 nm, SWIR2 (B12) = 2190 nm

        # x1 = wav(NIR - Red) = (842 - 665) / 2500
        x1 = (842 - 665) / 2500
        # x2 = wav(SWIR2 - NIR) = (2190 - 842) / 2500
        x2 = (2190 - 842) / 2500

        y1 = df["B08"] - df["B04"]  # Ref_NIR - Ref_Red
        y2 = df["B12"] - df["B08"]  # Ref_SWIR2 - Ref_NIR

        df["BAI"] = 180 - np.arctan(y1 / x1) + np.arctan(y2 / x2)

    elif index == "BAI_HLS":
        # For hls, just use B8A instead of B8
        # Sentinel 2 Central Wavelengths (in nanometers)
        # Red (B4) = 665 nm, NIR (B8A) = 865 nm, SWIR2 (B12) = 2190 nm

        # x1 = wav(NIR - Red) = (842 - 665) / 2500
        x1 = (865 - 665) / 2500
        # x2 = wav(SWIR2 - NIR) = (2190 - 842) / 2500
        x2 = (2190 - 865) / 2500

        y1 = df["B8A"] - df["B04"]  # Ref_NIR - Ref_Red
        y2 = df["B12"] - df["B8A"]  # Ref_SWIR2 - Ref_NIR

        df["BAI_HLS"] = 180 - np.arctan(y1 / x1) + np.arctan(y2 / x2)

    # // Functions that do nothing; for automation of code to work.
    elif index == "vh":
        # SHould already have VH
        pass

    elif index == "vv":
        # SHould already have VV
        pass

    elif index == "vvvh":
        df["vvvh"] = df["vv"] / df["vh"]

    elif index in df:
        pass 
    else: 
        raise Exception(f"Index {index} not recognized")

    return df


SENTINEL_INDEX_DEPENDENCIES = {
    "NDVI": ["B04", "B08"],
    "NRFI": ["B03", "B11"],
    "NRFI2": ["B03", "B12"],
    "NIR": ["B08"],
    "RENDVI": ["B05", "B8A"],
    "NDRE": ["B05", "B08"],
    "NDWI": ["B08", "B11"],
    "NDYI": ["B02", "B03"],
    "YI": ["B03", "B04"],
    "YI2": ["B02", "B03", "B04"],
    "YFI": ["B03", "B05"],
    "SYR": ["B02", "B03", "B04"],
    "NDTI": ["B11", "B12"],
    "STI": ["B11", "B12"],
    "NDI7": ["B8A", "B12"],
    "SRNDI": ["B04", "B12"],
    "NDI5": ["B8A", "B11"],
    "NDSVI": ["B04", "B11"],
    "MCRC": ["B03", "B11"],
    "BAI": ["B04", "B08", "B12"],
    "BAI_HLS": ["B04", "B8A", "B12"],
    "vh": [],
    "vv": [],
    "vvvh": ["vh", "vv"],
}