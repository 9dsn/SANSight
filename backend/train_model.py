import pandas as pd
import numpy as np
import os

# Load all CSVs from your raw data folder and combine them
data_folder = "SANSight/RandomForestData"

all_files = [f for f in os.listdir(data_folder) if f.endswith(".csv")]
print("Files found:", all_files)

dataframes = []
for file in all_files:
    df = pd.read_csv(os.path.join(data_folder, file))
    df["source_file"] = file  # track which file each row came from
    dataframes.append(df)

df_combined = pd.concat(dataframes, ignore_index=True)

print("Combined shape:", df_combined.shape)
print(df_combined.head())
print(df_combined.columns.tolist())  # print ALL column names so you can see what you have

# These thresholds are based on known SANS risk factors
# Adjust values if your data uses different units

def label_sans_risk(row):
    risk_points = 0

    # High sodium → increases intracranial pressure
    if "sodium" in row and row["sodium"] > 2300:          # mg (recommended max is 2300mp)
        risk_points += 2

    # Low vitamin D → associated with SANS
    if "vitamin_d" in row and row["vitamin_d"] < 10:     # mcg (deficient below 10mcg)
        risk_points += 2

    # Low calcium → bone/fluid regulation issues
    if "calcium" in row and row["calcium"] < 1000:        # mg (recommended min 1000mg)
        risk_points += 1

    # Low magnesium → neurological risk
    if "magnesium" in row and row["magnesium"] < 310:    # mg (recommended min 310mg)
        risk_points += 1

    # High risk if 3 or more risk points
    return 1 if risk_points >= 3 else 0

# Rename columns to standard names — edit left side to match your actual column names
df_combined = df_combined.rename(columns={
    "Sodium": "sodium",
    "Vitamin D": "vitamin_d",
    "Calcium": "calcium",
    "Magnesium": "magnesium",
})

# Convert to numbers in case they loaded as text
for col in ["sodium", "vitamin_d", "calcium", "magnesium"]:
    if col in df_combined.columns:
        df_combined[col] = pd.to_numeric(df_combined[col], errors="coerce")

# Fill missing values with column mean
df_combined = df_combined.fillna(df_combined.mean(numeric_only=True))

# Drop duplicates
df_combined = df_combined.drop_duplicates()

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Only use columns that exist in your data
feature_cols = [col for col in ["sodium", "vitamin_d", "calcium", "magnesium"] 
                if col in df_combined.columns]

X = df_combined[feature_cols]
y = df_combined["sans_risk"]

# Split 80% training, 20% testing
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Normalize
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV

rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    class_weight="balanced",  # handles uneven high/low risk counts
    random_state=42,
    n_jobs=-1
)

calibrated_model = CalibratedClassifierCV(rf_model, cv=3)
calibrated_model.fit(X_train_scaled, y_train)

from sklearn.metrics import classification_report, roc_auc_score

y_pred = calibrated_model.predict(X_test_scaled)
y_prob = calibrated_model.predict_proba(X_test_scaled)[:, 1]

import pickle
import os

os.makedirs("../models", exist_ok=True)

with open("../models/sans_rf_model.pkl", "wb") as f:
    pickle.dump(calibrated_model, f)

with open("../models/scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

with open("../models/feature_cols.pkl", "wb") as f:
    pickle.dump(feature_cols, f)