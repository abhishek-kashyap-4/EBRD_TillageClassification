import numpy as np 
import pandas as pd
import matplotlib.pyplot as plt 
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import ConfusionMatrixDisplay, confusion_matrix , accuracy_score, f1_score
from sklearn.model_selection import train_test_split



def RFC(merged_df , trainables,plots=True):
    X = merged_df[trainables]
    y = merged_df.Target
    class_names = list(np.unique(merged_df.Target)) 

    #
    X["extra_noise"] = np.random.RandomState(42).normal(0, 1, X.shape[0])

    # 2. Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y)

    # 3. Train Random Forest Classifier
    rf_clf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_clf.fit(X_train, y_train)

    # 4. Predict
    y_pred = rf_clf.predict(X_test)


    # 5. Display Full Confusion Matrix
    fig, ax = plt.subplots(figsize=(6, 6))
    cm = confusion_matrix(y_test, y_pred)

    if(plots):
        disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=class_names)
        disp.plot(cmap=plt.cm.Blues, ax=ax)
        plt.title("Confusion Matrix")
        plt.show()

    # 6. Extract and Print Top 5 Feature Importances
    importances = pd.Series(
        rf_clf.feature_importances_, index=X.columns
    ).sort_values(ascending=False)

    top_5_features = importances.head(5)

    print("\n--- Top 5 Important Features ---")
    for rank, (feature_name, score) in enumerate(top_5_features.items(), start=1):
        print(f"{rank}. {feature_name}: {score:.4f}")    
    accuracy = accuracy_score(y_test, y_pred)
    f1_weighted = f1_score(y_test, y_pred, average='weighted') ## I am using weighted for both binary and multiclass
    return accuracy, f1_weighted 
    # For multiclass, specify average mode ('macro', 'weighted', or 'micro')
    #f1_macro = f1_score(y_test, y_pred, average='macro')
    