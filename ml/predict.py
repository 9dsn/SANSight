import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import sys

# configuring
IMG_SIZE = (224, 224)
MODEL_PATH = "sans_model.h5"

# loading in the saved model
model = tf.keras.models.load_model(MODEL_PATH)

# actual prediction modelling
def predict_sans_risk(img_path):
    #loading and resizing the image
    img = image.load_img(img_path, target_size = IMG_SIZE)

    # converting to nums
    img_array = image.img_to_array(img)

    # add extra dimension
    img_array = np.expand_dims(img_array, axis=0)

    # nromaling the pixel values
    img_array = img_array / 255.0

    # running the model
    prediction = model.predict(img_array)[0][0]

    # percentage conversion
    risk_percent = round(float(prediction) * 100, 2)

    # Risk level label
    if risk_percent < 30:
        level = "🟢 Low Risk"
    elif risk_percent < 60:
        level = "🟡 Moderate Risk"
    else:
        level = "🔴 High Risk"
    
    return {
        "risk_percentage": risk_percent,
        "risk_level": level
    }

# Run from terminal
if __name__ == "__main__":
    img_path = sys.argv[1]
    result = predict_sans_risk(img_path)
    print(f"\nSANS Risk Score: {result['risk_percentage']}%")
    print(f"Risk Level: {result['risk_level']}\n")