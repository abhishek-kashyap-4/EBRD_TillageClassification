#!/usr/bin/env python
"""Read the EBRD tillage `field_daily` tables: one row per field, sensor and acquisition.

Standalone - needs only pandas and pyarrow, and nothing else from this repository.

    python read_field_daily.py --dir /path/to/field_daily --list
    python read_field_daily.py --dir /path/to/field_daily --field 40cc54342840ec
    python read_field_daily.py --dir /path/to/field_daily --field 40cc54342840ec \
        --sensor S2 --clear-only --start 2023-03-01 --end 2023-11-30 --out field.csv
    python read_field_daily.py --dir /path/to/field_daily --all --sensor S1 --out all_s1.parquet

Or from your own code:

    from read_field_daily import read_field, read_many
    df = read_field("/path/to/field_daily", "40cc54342840ec", sensor="S2", clear_only=True)

WHAT THE TABLES ARE
-------------------
One parquet per field, named `<field_id>.parquet`, on the `rise_data` datastore under
`JosefWagner/EBRD_tillage/data/field_daily/` (Beta-Agro's parcels are in
`.../data/beta_agro_stable/field_daily/`). Each row is one satellite acquisition over
one field: the pixels whose centres fall inside the field polygon are sampled, then
summarised to a median, 25th and 75th percentile. Pixels are never averaged across
acquisitions, so a row is a real overpass, not a daily composite - despite the name.
A typical field has a few thousand rows spanning 2017-2025.

COLUMNS
-------
Identity and timing
    field_id           the field's Geom_id (same as the file name)
    sensor             "S2" (optical) or "S1" (radar)
    datetime           acquisition time, ISO 8601 UTC (string in the file)
    date               acquisition date
    platform           "Sentinel-2A"/"2B", or "SENTINEL-1A"/"1B"
    item_id            the source STAC item on Microsoft Planetary Computer

Coverage (how much of the field this acquisition actually saw)
    n_pixels_total     10 m pixels inside the polygon
    n_pixels_valid     of those, how many survived masking
    valid_frac         n_pixels_valid / n_pixels_total. For S2 this is the clear
                       fraction: cloud, shadow, snow and cirrus are masked out by SCL
                       and OmniCloudMask, so valid_frac = 0 means a fully clouded
                       scene, and the band columns are NaN. For S1 it is normally 1.0.

Sentinel-2 values, each as _median, _p25 and _p75
    B2 B3 B4 B8 B11 B12    surface reflectance (blue, green, red, NIR, SWIR1, SWIR2),
                           processing-baseline offset already removed
    ndvi gndvi savi        vegetation indices
    ndti sti ndsvi         tillage / residue indices (NDTI and STI use the two SWIR
                           bands and are the ones that respond to bare soil)
    bsi bi                 bare-soil and brightness indices
    ndwi                   water index
    eo_cloud_cover         scene-level cloud cover reported by the provider (%),
                           not field-level - use valid_frac for that
    mgrs_tile              the S2 tile
    s2_baseline_harmonized whether the offset correction was applied

Sentinel-1 values (gamma0 RTC, linear power, not dB)
    vv_median vh_median    and _p25 / _p75 for each
    orbit_state            "ascending" or "descending"
    relative_orbit         track number - backscatter is only comparable within one
                           track, since the viewing geometry differs between tracks
    instrument_mode        "IW"

NOTES AND GOTCHAS
-----------------
* Optical and radar rows sit in the same table; split on `sensor` before plotting,
  since the value columns of the other sensor are NaN.
* S1 backscatter is linear power. For dB use 10 * log10(vv_median).
* Keep tracks apart when comparing S1 over time: group by `relative_orbit`.
* A field with no S1 scene has no S1 columns at all, so select columns defensively
  (this script does).
* `datetime` is a string in the file; it is parsed to UTC timestamps here.
"""
from __future__ import annotations

import argparse
import os
from concurrent.futures import ThreadPoolExecutor

import pandas as pd
import pyarrow.parquet as pq

S2_INDICES = ["ndvi", "gndvi", "savi", "ndti", "sti", "ndsvi", "bsi", "ndwi", "bi"]
S2_BANDS = ["B2", "B3", "B4", "B8", "B11", "B12"]


def field_ids(folder):
    """Every field id available in the folder."""
    return sorted(f[:-len(".parquet")] for f in os.listdir(folder) if f.endswith(".parquet"))


def read_field(folder, field_id, sensor=None, columns=None, clear_only=False,
               min_valid_frac=0.5, start=None, end=None):
    """One field's acquisitions as a DataFrame, sorted by time.

    sensor         "S2", "S1" or None for both
    columns        subset to keep (missing ones are ignored); None keeps all
    clear_only     drop S2 rows with valid_frac < min_valid_frac (S1 rows are kept)
    start, end     inclusive date bounds, anything pandas can parse
    """
    path = os.path.join(folder, f"{field_id}.parquet")
    available = set(pq.read_schema(path).names)
    if columns is not None:
        columns = [c for c in columns if c in available]
    df = pd.read_parquet(path, columns=columns)
    df["datetime"] = pd.to_datetime(df["datetime"], format="ISO8601", utc=True)
    if "field_id" not in df.columns:
        df["field_id"] = field_id
    if sensor is not None:
        df = df[df["sensor"] == sensor]
    if clear_only and "valid_frac" in df.columns:
        df = df[(df["sensor"] != "S2") | (df["valid_frac"] >= min_valid_frac)]
    if start is not None:
        df = df[df["datetime"] >= pd.Timestamp(start, tz="UTC")]
    if end is not None:
        df = df[df["datetime"] <= pd.Timestamp(end, tz="UTC") + pd.Timedelta(days=1)]
    return df.sort_values("datetime").reset_index(drop=True)


def read_many(folder, ids=None, workers=16, **kwargs):
    """Several fields at once (threads: the work is file reading, not computation)."""
    ids = ids if ids is not None else field_ids(folder)
    with ThreadPoolExecutor(workers) as ex:
        parts = list(ex.map(lambda f: read_field(folder, f, **kwargs), ids))
    return pd.concat(parts, ignore_index=True)


def summarise(df):
    """A short description of what was read."""
    out = [f"{len(df):,} rows, {df.field_id.nunique()} field(s), "
           f"{df.datetime.min():%Y-%m-%d} to {df.datetime.max():%Y-%m-%d}"]
    for sensor, s in df.groupby("sensor"):
        line = f"  {sensor}: {len(s):,} acquisitions"
        if sensor == "S2" and "valid_frac" in s:
            line += (f", {(s.valid_frac >= 0.5).mean():.0%} at least half clear"
                     f", {(s.valid_frac == 0).mean():.0%} fully masked")
        if sensor == "S1" and "relative_orbit" in s:
            tracks = sorted(int(t) for t in s.relative_orbit.dropna().unique())
            line += f", tracks {tracks}"
        out.append(line)
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--dir", required=True, help="the field_daily folder")
    ap.add_argument("--field", help="one field id (the file name without .parquet)")
    ap.add_argument("--all", action="store_true", help="read every field in the folder")
    ap.add_argument("--list", action="store_true", help="list the field ids and exit")
    ap.add_argument("--sensor", choices=["S1", "S2"], help="keep only this sensor")
    ap.add_argument("--clear-only", action="store_true", help="drop cloudy S2 acquisitions")
    ap.add_argument("--min-valid-frac", type=float, default=0.5)
    ap.add_argument("--start")
    ap.add_argument("--end")
    ap.add_argument("--out", help="write the result to .csv or .parquet")
    args = ap.parse_args()

    ids = field_ids(args.dir)
    if args.list:
        print(f"{len(ids)} fields in {args.dir}")
        print("\n".join(ids))
        return
    if not args.field and not args.all:
        ap.error("give --field <id>, or --all, or --list")

    kwargs = dict(sensor=args.sensor, clear_only=args.clear_only,
                  min_valid_frac=args.min_valid_frac, start=args.start, end=args.end)
    df = read_many(args.dir, **kwargs) if args.all else read_field(args.dir, args.field, **kwargs)

    print(summarise(df))
    cols = [c for c in ["field_id", "sensor", "datetime", "platform", "valid_frac",
                        "ndvi_median", "ndti_median", "bsi_median", "vv_median", "vh_median",
                        "relative_orbit"] if c in df.columns]
    print("\nfirst rows:")
    print(df[cols].head(10).to_string(index=False))

    if args.out:
        if args.out.endswith(".parquet"):
            df.to_parquet(args.out, index=False)
        else:
            df.to_csv(args.out, index=False)
        print(f"\nwrote {args.out}")


if __name__ == "__main__":
    main()
