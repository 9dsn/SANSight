import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import pickle
import sys
import os

# ── Config ──────────────────────────────────────────
IMG_SIZE = (224, 224)
CNN_MODEL_PATH = "sans_model.h5"
RF_MODEL_PATH = "models/sans_rf_model.pkl"
SCALER_PATH = "models/scaler.pkl"
FEATURE_COLS_PATH = "models/feature_cols.pkl"

# ── Load models ──────────────────────────────────────
cnn_model = tf.keras.models.load_model(CNN_MODEL_PATH)

with open(RF_MODEL_PATH, "rb") as f:
    rf_model = pickle.load(f)

with open(SCALER_PATH, "rb") as f:
    scaler = pickle.load(f)

with open(FEATURE_COLS_PATH, "rb") as f:
    feature_cols = pickle.load(f)

# ── Retinal Detection (binary + stage) ───────────────
def predict_retinal(img_path):
    img = image.load_img(img_path, target_size=IMG_SIZE)
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0
    score = float(cnn_model.predict(img_array)[0][0])

    if score < 0.2:
        detection = "✅ No SANS Detected"
        stage = None
    elif score < 0.35:
        detection = "⚠️ SANS Detected"
        stage = "Mild"
    elif score < 0.7:
        detection = "⚠️ SANS Detected"
        stage = "Moderate"
    elif score < 0.85:
        detection = "⚠️ SANS Detected"
        stage = "Severe"
    else:
        detection = "⚠️ SANS Detected"
        stage = "Proliferative"

    return {
        "score": score,
        "detection": detection,
        "stage": stage
    }

# ── Biometric Risk Prediction ────────────────────────
def predict_biometric(sodium, vitamin_d, calcium, magnesium):
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

# ── Main Prediction ──────────────────────────────────
def predict_sans_risk(img_path=None, sodium=None, vitamin_d=None, calcium=None, magnesium=None):
    # Retinal detection (independent)
    retinal = predict_retinal(img_path) if img_path else None

    # Biometric risk (only if nutrition data provided)
    if sodium is not None and vitamin_d is not None and calcium is not None and magnesium is not None:
        bio_score = predict_biometric(sodium, vitamin_d, calcium, magnesium)
        risk_percent = round(bio_score * 100, 2)

        if risk_percent < 30:
            level = "🟢 Low Risk"
        elif risk_percent < 60:
            level = "🟡 Moderate Risk"
        else:
            level = "🔴 High Risk"
    else:
        risk_percent = None
        level = None

    return {
        "retinal_detection": retinal["detection"] if retinal else "No scan provided",
        "retinal_stage": retinal["stage"] if retinal else None,
        "biometric_risk_percentage": risk_percent,
        "risk_level": level
    }

# ── Run from terminal ────────────────────────────────
if __name__ == "__main__":
    img_path = sys.argv[1] if len(sys.argv) > 1 else None
    sodium = float(sys.argv[2]) if len(sys.argv) > 2 else None
    vitamin_d = float(sys.argv[3]) if len(sys.argv) > 3 else None
    calcium = float(sys.argv[4]) if len(sys.argv) > 4 else None
    magnesium = float(sys.argv[5]) if len(sys.argv) > 5 else None

    result = predict_sans_risk(img_path, sodium, vitamin_d, calcium, magnesium)

    print(f"\n🔬 Retinal Detection: {result['retinal_detection']}")
    if result['retinal_stage']:
        print(f"📊 Stage: {result['retinal_stage']}")
    if result['retinal_confidence']:
        print(f"🎯 Confidence: {result['retinal_confidence']}%")
    if result['biometric_risk_percentage'] is not None:
        print(f"\n💊 Biometric SANS Risk: {result['biometric_risk_percentage']}%")
        print(f"⚡ Risk Level: {result['risk_level']}")
    print()