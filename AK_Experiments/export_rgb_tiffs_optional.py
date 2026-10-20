from pathlib import Path
import geopandas as gpd
import numpy as np
import pystac
import planetary_computer
from download_s2_pc import load_cached_scene_jobs, load_scene, estimate_utm_crs

# 1. Load config/paths
output_dir = Path("/home/azureuser/EBRD_Tillage/data/output")
tiff_output_dir = output_dir / "true_color_tiffs"
tiff_output_dir.mkdir(parents=True, exist_ok=True)

# 2. Load fields and STAC inventory created during 'inventory' step
fields = gpd.read_file("/home/azureuser/EBRD_Tillage/data/interim/sample.geojson").to_crs("EPSG:4326")
scene_jobs = load_cached_scene_jobs(output_dir)

# 3. Process scenes into True Color GeoTIFFs
for job in scene_jobs:
    item = pystac.Item.from_dict(job["item_dict"])
    item = planetary_computer.sign(item)
    
    # Filter field geometry
    fields_proj = fields.to_crs(estimate_utm_crs(fields))
    minx, miny, maxx, maxy = fields_proj.total_bounds
    
    # Load RGB bands (B4, B3, B2)
    ds = load_scene(
        item=item,
        crs=fields_proj.crs,
        x_bounds=(minx - 20, maxx + 20),
        y_bounds=(miny - 20, maxy + 20),
        assets=["B04", "B03", "B02"],  # Red, Green, Blue
        resolution=10
    )
    
    # Extract RGB and normalize reflectance scale (0-3000 to 0-1)
    rgb = ds[["B4", "B3", "B2"]].to_array(dim="band")
    
    # Write to GeoTIFF using rioxarray
    date_str = item.properties["datetime"].split("T")[0]
    output_filename = tiff_output_dir / f"{item.id}_{date_str}_RGB.tif"
    
    rgb.rio.to_raster(output_filename)
    print(f"Saved: {output_filename}")