from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import pickle
import os
from PIL import Image
import io

app = Flask(__name__)

# config
IMG_SIZE = (224, 224)
CNN_MODEL_PATH = "sans_model.h5"
RF_MODEL_PATH = "models/sans_rf_model.pkl"
SCALER_PATH = "models/scaler.pkl"
FEATURE_COLS_PATH = "models/feature_cols.pkl"

CNN_WEIGHT = 0.6
BIO_WEIGHT = 0.4

#loading models
cnn_model = tf.keras.models.load_model(CNN_MODEL_PATH)

with open(RF_MODEL_PATH, "rb") as f:
    rf_model = pickle.load(f)

with open(SCALER_PATH, "rb") as f:
    scaler = pickle.load(f)

with open(FEATURE_COLS_PATH, "rb") as f:
    feature_cols = pickle.load(f)

# app routing
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    # Get biometrics from request
    sodium = float(data.get("sodium", 2300))
    vitamin_d = float(data.get("vitamin_d", 10))
    calcium = float(data.get("calcium", 1000))
    magnesium = float(data.get("magnesium", 310))

    # Get retinal image (base64 or URL)
    image_url = data.get("image_url")

    # Load image from URL
    import requests as req
    response = req.get(image_url)
    img = Image.open(io.BytesIO(response.content)).resize(IMG_SIZE)
    img_array = np.expand_dims(np.array(img) / 255.0, axis=0)

    # Retinal score
    retinal_score = float(cnn_model.predict(img_array)[0][0])

    # Biometric score
    input_dict = {
        "sodium": sodium,
        "vitamin_d": vitamin_d,
        "calcium": calcium,
        "magnesium": magnesium
    }
    input_array = np.array([[input_dict[col] for col in feature_cols]])
    input_scaled = scaler.transform(input_array)
    bio_score = float(rf_model.predict_proba(input_scaled)[0][1])

    # Fusion
    final_score = (retinal_score * CNN_WEIGHT) + (bio_score * BIO_WEIGHT)
    risk_percent = round(final_score * 100, 2)

    if risk_percent < 30:
        level = "Low Risk"
    elif risk_percent < 60:
        level = "Moderate Risk"
    else:
        level = "High Risk"

    return jsonify({
        "risk_score": final_score,
        "retinal_score": round(retinal_score * 100, 2),
        "biometric_score": round(bio_score * 100, 2),
        "final_risk_percentage": risk_percent,
        "risk_level": level
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)