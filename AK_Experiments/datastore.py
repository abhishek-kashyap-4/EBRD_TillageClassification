import geopandas as gpd
from azure.identity import DefaultAzureCredential
from azure.ai.ml import MLClient

# 1. Connect to your Azure ML Workspace
# DefaultAzureCredential uses your compute instance's logged-in identity automatically
ml_client = MLClient.from_config(credential=DefaultAzureCredential())

# 2. Formulate the datastore path to your GeoJSON file
# Format: azureml://datastores/<DATASTORE_NAME>/paths/<RELATIVE_PATH_TO_FILE>
datastore_name = "rise_data"
relative_file_path = "shared/s2/your_file.geojson" # replace with your exact filename

datastore_uri = f"azureml://datastores/{datastore_name}/paths/{relative_file_path}"

# 3. Read directly into a GeoPandas GeoDataFrame
gdf = gpd.read_file(datastore_uri)

# Verify
print(gdf.head())
print(f"CRS: {gdf.crs}")