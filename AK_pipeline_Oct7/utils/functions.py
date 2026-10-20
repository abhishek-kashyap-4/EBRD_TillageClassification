
def aggregate_band(df , bandname):
    '''
    I wonder if this function can implement both aggregations at the same time. 
    '''

    # Map aggregation string directly to your function reference
    AGG_MAP = {
        'min': get_min,
        'max': get_max,
        'median': get_median,
    }

def run_aggregations(ds, agg_list):
    results = {}
    for agg_name in agg_list:
        if agg_name in AGG_MAP:
            results[agg_name] = AGG_MAP[agg_name](ds)
        else:
            raise ValueError(f"Unsupported aggregation: {agg_name}")
    return results
    print(bandname)
    bandcols = [col for col in df.columns if bandname in col]
    #assert not df[bandcols].isna().any().any(), f"DataFrame band {bandname} contains NaNs!"
    if(df[bandcols].isna().any().any()):
        warnings.warn(f"DataFrame band {bandname} contains NaNs!")
    #If you have, nanargmax is a thing, use it. 

    # Extract NDVI columns
    req_cols = [col for col in df.columns if col.startswith(f'{bandname}__')]
    
    # Sort NDVI columns numerically by extracting the timestep
    req_cols_sorted = sorted(req_cols, key=lambda x: int(re.search(fr'{bandname}__(\d+)', x).group(1)))
    
    # Get timestep numbers
    timesteps = np.array([int(re.search(fr'{bandname}__(\d+)', col).group(1)) for col in req_cols_sorted])
    
    # Extract the NDVI data in sorted order
    band_data = df[req_cols_sorted].values  # shape: (n_samples, n_timesteps)
    
    # Compute differences for gradient
    gradients = np.diff(band_data, axis=1)
    
    # Aggregated metrics
    mean_vals = np.nanmean(band_data, axis=1)
    median_vals = np.nanmedian(band_data, axis=1)
    max_vals = np.nanmax(band_data, axis=1)
    argmax_vals = np.nanargmax(band_data, axis=1)
    min_vals = np.nanmin(band_data, axis=1)
    auc_vals = np.trapz(band_data, x=timesteps, axis=1)
    max_grad_vals = np.nanmax(np.abs(gradients), axis=1)
    max_grad_indices = np.nanargmax(np.abs(gradients), axis=1)
    max_grad_timesteps = timesteps[1:][max_grad_indices]  # Timestep where max gradient occurred 
    
    small_grad_vals = np.nanmin(np.abs(gradients), axis=1)
    small_grad_indices = np.nanargmin(np.abs(gradients), axis=1)
    small_grad_timesteps = timesteps[1:][small_grad_indices]  # Timestep where max gradient occurred 
    
    # Max positive gradient
    max_pos_grad_vals = np.nanmax(gradients, axis=1)
    max_pos_indices = np.nanargmax(gradients, axis=1)
    max_pos_grad_timesteps = timesteps[1:][max_pos_indices]
    # Max negative gradient
    max_neg_grad_vals = np.nanmin(gradients, axis=1)
    max_neg_indices = np.nanargmin(gradients, axis=1)
    max_neg_grad_timesteps = timesteps[1:][max_neg_indices]
    
    #AUC After peak
    ## Peak can be assumed at  argmax vals 
    ## A_K__ come back to this.
    

    # Create output DataFrame
    result_df = pd.DataFrame({
        f'Mean__{bandname}': mean_vals,
        f'Median__{bandname}': median_vals,
        f'Max__{bandname}': max_vals,
        f'ArgMax__{bandname}': argmax_vals,
        f'Min__{bandname}': min_vals,
        f'AUC__{bandname}': auc_vals,
        f'Max_Gradient__{bandname}': max_grad_vals,
        f'T_Max_Gradient__{bandname}': max_grad_timesteps,
        f'Small_Gradient__{bandname}': small_grad_vals,
        f'T_Small_Gradient__{bandname}': small_grad_timesteps,
        f'Max_Pos_Gradient__{bandname}': max_pos_grad_vals,
        f'T_Max_Pos_Gradient__{bandname}': max_pos_grad_timesteps,
        f'Max_Neg_Gradient__{bandname}': max_neg_grad_vals,
        f'T_Max_Neg_Gradient__{bandname}': max_neg_grad_timesteps,
        
        
    })

    return result_df