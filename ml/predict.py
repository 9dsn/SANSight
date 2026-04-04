import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import pickle
import sys
import os

# configuration
IMG_SIZE = (224, 224)
CNN_MODEL_PATH = "ml/sans_model.h5"
RF_MODEL_PATH = "ml/models/sans_rf_model.pkl"
SCALER_PATH = "ml/models/scaler.pkl"
FEATURE_COLS_PATH = "ml/models/feature_cols.pkl"

# fusion 
CNN_WEIGHT = 0.6
BIO_WEIGHT = 0.4

# loading models
cnn_model = tf.keras.models.load_model(CNN_MODEL_PATH)

with open(RF_MODEL_PATH, "rb") as f:
    rf_model = pickle.load(f)

with open(SCALER_PATH, "rb") as f:
    scaler = pickle.load(f)

with open(FEATURE_COLS_PATH, "rb") as f:
    feature_cols = pickle.load(f)

# retinal prediciton
def predict_retinal(img_path):
    img = image.load_img(img_path, target_size=IMG_SIZE)
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0
    score = cnn_model.predict(img_array)[0][0]
    return float(score)

# biometric prediction
def predict_biometric(sodium, vitamin_d, calcium, magnesium):
    # Build input in the same order as feature_cols
    input_dict = {
        "sodium": sodium,
        "vitamin_d": vitamin_d,
        "calcium": calcium,
        "magnesium": magnesium
    }
    input_array = np.array([[input_dict[col] for col in feature_cols]])
    input_scaled = scaler.transform(input_array)
    score = rf_model.predict_proba(input_scaled)[0][1]
    return float(score)

# fusion
def predict_sans_risk(img_path, sodium, vitamin_d, calcium, magnesium):
    retinal_score = predict_retinal(img_path)
    bio_score = predict_biometric(sodium, vitamin_d, calcium, magnesium)

    # Weighted average fusion
    final_score = (retinal_score * CNN_WEIGHT) + (bio_score * BIO_WEIGHT)
    risk_percent = round(final_score * 100, 2)

    if risk_percent < 30:
        level = "🟢 Low Risk"
    elif risk_percent < 60:
        level = "🟡 Moderate Risk"
    else:
        level = "🔴 High Risk"

    return {
        "retinal_score": round(retinal_score * 100, 2),
        "biometric_score": round(bio_score * 100, 2),
        "final_risk_percentage": risk_percent,
        "risk_level": level
    }

# ── Run from terminal ────────────────────────────────
if __name__ == "__main__":
    # Example usage: python3 predict.py retinal.jpg 2300 9 1000 400
    img_path = sys.argv[1]
    sodium = float(sys.argv[2])
    vitamin_d = float(sys.argv[3])
    calcium = float(sys.argv[4])
    magnesium = float(sys.argv[5])

    result = predict_sans_risk(img_path, sodium, vitamin_d, calcium, magnesium)

    print(f"\nRetinal Score:   {result['retinal_score']}%")
    print(f"Biometric Score: {result['biometric_score']}%")
    print(f"Final SANS Risk: {result['final_risk_percentage']}%")
    print(f"Risk Level:      {result['risk_level']}\n")