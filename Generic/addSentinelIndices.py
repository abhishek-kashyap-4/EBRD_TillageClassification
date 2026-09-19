import numpy as np


"Dataframe version of GEE code"
def calculateSentinelIndex(df, index):

    # //////////////////////Indexes
    if index == "NDVI":
        # NIR band: B8, Red band: B4
        df["NDVI"] = (df["B8"] - df["B4"]) / (df["B8"] + df["B4"])

    elif index == "NRFI":
        # Green: B3, SWIR: B11
        df["NRFI"] = (df["B3"] - df["B11"]) / (df["B3"] + df["B11"])

    elif index == "NRFI2":
        # Green: B3, SWIR: B12
        df["NRFI2"] = (df["B3"] - df["B12"]) / (df["B3"] + df["B12"])

    elif index == "NIR":
        # Scale B8 reflectance
        df["NIR"] = df["B8"] / 10000.0

    elif index == "RENDVI":
        # NIR band: B8A, Red band: B5
        df["RENDVI"] = (df["B8A"] - df["B5"]) / (df["B8A"] + df["B5"])

    elif index == "NDRE":
        # NIR band: B8, Red band: B5
        df["NDRE"] = (df["B8"] - df["B5"]) / (df["B8"] + df["B5"])

    elif index == "NDWI":
        # NIR band: B8, SWIR band: B11
        df["NDWI"] = (df["B8"] - df["B11"]) / (df["B8"] + df["B11"])

    # /////////// Yellow Indices -- NDYI , YI , YI2 , YFI , SYR
    elif index == "NDYI":
        # Green: B3, Blue: B2
        df["NDYI"] = (df["B3"] - df["B2"]) / (df["B3"] + df["B2"])

    elif index == "YI":
        # Red: B4, Green: B3
        df["YI"] = df["B4"] / df["B3"]

    elif index == "YI2":
        # Red: B4, Green: B3, Blue: B2
        df["YI2"] = (df["B4"] - df["B2"]) / df["B3"]

    elif index == "YFI":
        # Green: B3, Red Edge: B5
        df["YFI"] = (df["B3"] - df["B5"]) / (df["B3"] + df["B5"])

    elif index == "SYR":
        # Green: B3, Red: B4, Blue: B2
        df["SYR"] = (df["B3"] + df["B4"]) / (df["B2"] + df["B2"])

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
        df["SRNDI"] = (df["B12"] - df["B4"]) / (df["B4"] + df["B12"])

    elif index == "NDI5":
        # NIR865: B8A, SWIR1610: B11
        df["NDI5"] = (df["B8A"] - df["B11"]) / (df["B8A"] + df["B11"])

    elif index == "NDSVI":
        # SWIR1610: B11, Red: B4
        df["NDSVI"] = (df["B11"] - df["B4"]) / (df["B4"] + df["B11"])

    elif index == "MCRC":
        # SWIR1610: B11, Green: B3
        df["MCRC"] = (df["B11"] - df["B3"]) / (df["B3"] + df["B11"])

    # ///////// BAI
    elif index == "BAI":
        # Sentinel-2 Central Wavelengths (in nanometers)
        # Red (B4) = 665 nm, NIR (B8) = 842 nm, SWIR2 (B12) = 2190 nm

        # x1 = wav(NIR - Red) = (842 - 665) / 2500
        x1 = (842 - 665) / 2500
        # x2 = wav(SWIR2 - NIR) = (2190 - 842) / 2500
        x2 = (2190 - 842) / 2500

        y1 = df["B8"] - df["B4"]  # Ref_NIR - Ref_Red
        y2 = df["B12"] - df["B8"]  # Ref_SWIR2 - Ref_NIR

        df["BAI"] = 180 - np.arctan(y1 / x1) + np.arctan(y2 / x2)

    elif index == "BAI_HLS":
        # For hls, just use B8A instead of B8
        # Sentinel 2 Central Wavelengths (in nanometers)
        # Red (B4) = 665 nm, NIR (B8A) = 865 nm, SWIR2 (B12) = 2190 nm

        # x1 = wav(NIR - Red) = (842 - 665) / 2500
        x1 = (865 - 665) / 2500
        # x2 = wav(SWIR2 - NIR) = (2190 - 842) / 2500
        x2 = (2190 - 865) / 2500

        y1 = df["B8A"] - df["B4"]  # Ref_NIR - Ref_Red
        y2 = df["B12"] - df["B8A"]  # Ref_SWIR2 - Ref_NIR

        df["BAI_HLS"] = 180 - np.arctan(y1 / x1) + np.arctan(y2 / x2)

    # // Functions that do nothing; for automation of code to work.
    elif index == "VH":
        # SHould already have VH
        pass

    elif index == "VV":
        # SHould already have VV
        pass

    elif index == "VVVH":
        df["VVVH"] = df["VV"] / df["VH"]

    return df