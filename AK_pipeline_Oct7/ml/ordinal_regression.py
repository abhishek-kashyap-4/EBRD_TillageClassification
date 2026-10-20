import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    cohen_kappa_score,
    confusion_matrix,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split


def RFR(merged_df, trainables, plots=True):
    X = merged_df[trainables].copy()
    y = merged_df.Target

    # 1. Add noise feature for importance benchmarking
    X["extra_noise"] = np.random.RandomState(42).normal(0, 1, X.shape[0])

    # 2. Train / Test Split
    # For discrete ordinal levels, stratify directly on y.
    # If y is continuous float, stratify on binned quantile classes.
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )
    except ValueError:
        # Fallback for continuous float targets: stratify using quantile bins
        bins = pd.qcut(y, q=5, labels=False, duplicates="drop")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=bins
        )

    # 3. Train Random Forest Regressor
    rf_reg = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_reg.fit(X_train, y_train)

    # 4. Predict continuous values
    y_pred_cont = rf_reg.predict(X_test)

    # Round predictions to nearest ordinal discrete integer for confusion matrix / Kappa
    y_pred_discrete = np.round(y_pred_cont)

    # 5. Display Confusion Matrix & Plots
    if plots:
        class_names = sorted(list(np.unique(np.concatenate([y_test, y_pred_discrete]))))
        cm = confusion_matrix(y_test, y_pred_discrete, labels=class_names)

        fig, ax = plt.subplots(figsize=(6, 6))
        disp = ConfusionMatrixDisplay(
            confusion_matrix=cm, display_labels=class_names
        )
        disp.plot(cmap=plt.cm.Blues, ax=ax)
        plt.title("Ordinal Confusion Matrix (Rounded Predictions)")
        plt.show()

    # 6. Extract and Print Top 5 Feature Importances
    importances = pd.Series(
        rf_reg.feature_importances_, index=X.columns
    ).sort_values(ascending=False)

    top_5_features = importances.head(5)

    print("\n--- Top 5 Important Features ---")
    for rank, (feature_name, score) in enumerate(
        top_5_features.items(), start=1
    ):
        print(f"{rank}. {feature_name}: {score:.4f}")

    # 7. Calculate Metrics
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_cont))
    mae = mean_absolute_error(y_test, y_pred_cont)
    r2 = r2_score(y_test, y_pred_cont)

    # Quadratic Weighted Kappa measures agreement accounting for ordinal distance
    # (Penalizes off-by-2 errors much more heavily than off-by-1)
    qwk = cohen_kappa_score(
        y_test.astype(int),
        y_pred_discrete.astype(int),
        weights="quadratic",
    )

    print(f"\n--- Model Performance Metrics ---")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE:  {mae:.4f}")
    print(f"R²:   {r2:.4f}")
    print(f"QWK:  {qwk:.4f}")

    return rmse, mae, r2, qwk