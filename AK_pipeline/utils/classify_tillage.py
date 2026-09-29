'''
In this scipt, I use regex to recognize and classify tillage operations using different strategies. 
The output can then be used as the independant variable in classfying tillage. 
'''
import numpy as np 
import pandas as pd
import geopandas as gpd



BASELINE_TRANSLATION  = {
    'Cultivation to a depth of 16-20 см. with application of dry fertilizers':'Conventional',
       'Cultivation to a depth of 16–20 cm with application of dry fertilizers':'Conventional',
       'Cultivation to a depth of 5-8 см.':'Conservation',
       'Cultivation to a depth of 5–8 cm':'Conservation',
       'Deep loosening (ripping)  to a depth 31-35 см.':'Conventional',
       'Deep loosening (ripping)  to a depth of 31–35 cm with application of dry fertilizers':'Conventional',
       'Deep loosening (ripping) to a depth of 20–25 cm':'Conventional',
       'Deep loosening (ripping) to a depth of 26-30 см.':'Conventional',
       'Deep loosening (ripping) to a depth of 36–40 cm with application of dry fertilizers':'Conventional',
       'Deep ripping to a depth of 20-25 см.':'Conventional',
       'Deep ripping to a depth of 26-30 см.':'Conventional',
       'Deep ripping to a depth of 26-30 см. with application of dry fertilizers':'Conventional',
       'Deep ripping to a depth of 31-35 см.':'Conventional',
       'Deep ripping to a depth of 31-35 см. with application of dry fertilizers':'Conventional',
       'Discing the field edges':'Conservation',
        'Discing to a depth of 13–15 cm':'Other',
       'Discing to a depth of 5–8 cm':'Conservation',
       'Discing to a depth of 5–8 cm with sowing of cover crops':'Conservation',
       'Discing to a depth of 9–12 cm':'Conservation',
       'Disking to a depth of  13-15 см.':'Other',
       'Disking to a depth of  16-20 см.':'Conventional',
       'Disking to a depth of  5-8 см.':'Conservation',
       'Disking to a depth of  5-8 см. з посівом сидератів':'Conservation',
       'Disking to a depth of  9-12 см.':'Conservation',
        'Field harrowing':'Other',
        'Harrowing':'Other',
       'Harrowing after sprouting':'Other',
        'Harrowing по сходах':'Other',
       'Inter-row cultivation':'Other',
       'Inter-row cultivation with application of liquid fertilizers':'Other',
       'Inter-row cultivation with liquid fertilizer application':'Other',
       'Plowing to a depth of more than 28 cm':'Conventional'}

SUSTAINABILITY_CONVERSION = {
'No_Till' :0 ,  'Mulching':0,
'Rolling':1, 'Harrowing':4, 
'Pre_Emerge_Harrowing':4, 'Crop_Harrowing':3,
'Soil_Cultivation' :4,
'Inter-Row_Soil_Cultivation':3, 
'Mini_till' :4,
'Vertical_tillage' :2, 
'Strip_Till' :2, 
'Disking':5, 
'Deep_Ripping' :6, 
'Plowing' :7}
ALEX_SUSTAINABILITY_TRANSLATION = {
    'Cultivation to a depth of 16-20 см. with application of dry fertilizers':4,
       'Cultivation to a depth of 16–20 cm with application of dry fertilizers':4,
       'Cultivation to a depth of 5-8 см.':4,
       'Cultivation to a depth of 5–8 cm':4,
       'Deep loosening (ripping)  to a depth 31-35 см.':6,
       'Deep loosening (ripping)  to a depth of 31–35 cm with application of dry fertilizers':6,
       'Deep loosening (ripping) to a depth of 20–25 cm':6,
       'Deep loosening (ripping) to a depth of 26-30 см.':6,
       'Deep loosening (ripping) to a depth of 36–40 cm with application of dry fertilizers':6,
       'Deep ripping to a depth of 20-25 см.':6,
       'Deep ripping to a deALEX_SUSTAINABILITY_TRANSLATIONpth of 26-30 см.':6,
       'Deep ripping to a depth of 26-30 см. with application of dry fertilizers':6,
       'Deep ripping to a depth of 31-35 см.':6,
       'Deep ripping to a depth of 31-35 см. with application of dry fertilizers':6,
       'Discing the field edges':5,
        'Discing to a depth of 13–15 cm':5,
       'Discing to a depth of 5–8 cm':5,
       'Discing to a depth of 5–8 cm with sowing of cover crops':5,
       'Discing to a depth of 9–12 cm':5,
       'Disking to a depth of  13-15 см.':5,
       'Disking to a depth of  16-20 см.':5,
       'Disking to a depth of  5-8 см.':5,
       'Disking to a depth of  5-8 см. з посівом сидератів':5,
       'Disking to a depth of  9-12 см.':5,
        'Field harrowing':4,
        'Harrowing':4,
       'Harrowing after sprouting':4,
        'Harrowing по сходах':4,
       'Inter-row cultivation':3,
       'Inter-row cultivation with application of liquid fertilizers':3,
       'Inter-row cultivation with liquid fertilizer application':3,
       'Plowing to a depth of more than 28 cm':7}

NOMINAL_TRANSLATION =  {
    'Cultivation to a depth of 16-20 см. with application of dry fertilizers':"Cultivation",
       'Cultivation to a depth of 16–20 cm with application of dry fertilizers':"Cultivation",
       'Cultivation to a depth of 5-8 см.':"Cultivation",
       'Cultivation to a depth of 5–8 cm':"Cultivation",
       'Deep loosening (ripping)  to a depth 31-35 см.':"Ripping",
       'Deep loosening (ripping)  to a depth of 31–35 cm with application of dry fertilizers':"Ripping",
       'Deep loosening (ripping) to a depth of 20–25 cm':"Ripping",
       'Deep loosening (ripping) to a depth of 26-30 см.':"Ripping",
       'Deep loosening (ripping) to a depth of 36–40 cm with application of dry fertilizers':"Ripping",
       'Deep ripping to a depth of 20-25 см.':"Ripping",
       'Deep ripping to a deALEX_SUSTAINABILITY_TRANSLATIONpth of 26-30 см.':"Ripping",
       'Deep ripping to a depth of 26-30 см. with application of dry fertilizers':"Ripping",
       'Deep ripping to a depth of 31-35 см.':"Ripping",
       'Deep ripping to a depth of 31-35 см. with application of dry fertilizers':"Ripping",
       'Discing the field edges':"Discking",
        'Discing to a depth of 13–15 cm':"Discking",
       'Discing to a depth of 5–8 cm':"Discking",
       'Discing to a depth of 5–8 cm with sowing of cover crops':"Discking",
       'Discing to a depth of 9–12 cm':"Discking",
       'Disking to a depth of  13-15 см.':"Discking",
       'Disking to a depth of  16-20 см.':"Discking",
       'Disking to a depth of  5-8 см.':"Discking",
       'Disking to a depth of  5-8 см. з посівом сидератів':"Discking",
       'Disking to a depth of  9-12 см.':"Discking",
        'Field harrowing':"Harrowing",
        'Harrowing':"Harrowing",
       'Harrowing after sprouting':"Harrowing",
        'Harrowing по сходах':"Harrowing",
       'Inter-row cultivation':"Inter Row",
       'Inter-row cultivation with application of liquid fertilizers':"Inter Row",
       'Inter-row cultivation with liquid fertilizer application':"Inter Row",
       'Plowing to a depth of more than 28 cm':"Plowing"}
def filtering_for_tillage_notnulls(df,control_group=-1):
    null_operations = df[df.operation_.isna()]
    operations = df[~df.operation_.isna()]
    tillage_df = operations[operations['operation_'].str.contains('illage')].reset_index()

    return tillage_df


def classify_tillage(gdf,method_to_use): 
    if( method_to_use in ['baseline','baseline_other' 'Classifica']): 
        print('what the')
        tillage_df =  filtering_for_tillage_notnulls(gdf)
        unique_text_list = np.unique(tillage_df.Operation.values)
        tillage_df["Target"] = gdf["Operation"].map(BASELINE_TRANSLATION) # I previously saved this as a shapefile, which cut the column name to 10 characters. I am following the same here. 
        if(method_to_use in ['baseline', 'Classifica']): 
            tillage_df = tillage_df[(tillage_df.Target == 'Conservation') | (tillage_df.Target == 'Conventional')]
        return tillage_df 
    elif(method_to_use in ['alex','alex_binary']): 
        tillage_df = filtering_for_tillage_notnulls(gdf)
        tillage_df["Target"] = gdf["Operation"].map(ALEX_SUSTAINABILITY_TRANSLATION)
        return tillage_df
    elif(method_to_use == 'Nominal'): 
        tillage_df = filtering_for_tillage_notnulls(gdf)
        tillage_df["Target"] = gdf["Operation"].map(NOMINAL_TRANSLATION)
        return tillage_df
    elif(method_to_use == 'other'): 
        raise NotImplementedError 
    else: 
        raise Exception(f'Method {method_to_use} not recognized in classify_tillage.')
    