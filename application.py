from flask import Flask, request, render_template, jsonify, Response
import pickle
import numpy as np
import pandas as pd
import os

application = Flask(__name__)
app = application

# Load pre-trained model and scaler
MODEL_PATH = os.path.join(os.path.dirname(__file__), "Model", "modelForPrediction.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "Model", "standardScalar.pkl")

scaler = pickle.load(open(SCALER_PATH, "rb"))
model = pickle.load(open(MODEL_PATH, "rb"))

def evaluate_patient_biomarkers(data):
    """Generate clinical risk factors and recommendations based on biomarkers"""
    factors = []
    glucose = data.get('Glucose', 100)
    bmi = data.get('BMI', 25)
    bp = data.get('BloodPressure', 70)
    dpf = data.get('DiabetesPedigreeFunction', 0.3)
    insulin = data.get('Insulin', 80)
    age = data.get('Age', 30)

    # Glucose evaluation
    if glucose >= 126:
        factors.append({"name": "Fasting Plasma Glucose", "value": f"{glucose} mg/dL", "status": "Critical Elevation (>=126)"})
    elif glucose >= 100:
        factors.append({"name": "Fasting Plasma Glucose", "value": f"{glucose} mg/dL", "status": "Pre-Diabetic Range (100-125)"})
    else:
        factors.append({"name": "Fasting Plasma Glucose", "value": f"{glucose} mg/dL", "status": "Normal (<100)"})

    # BMI evaluation
    if bmi >= 30:
        factors.append({"name": "Body Mass Index (BMI)", "value": f"{bmi} kg/m²", "status": "Obese Range (>=30)"})
    elif bmi >= 25:
        factors.append({"name": "Body Mass Index (BMI)", "value": f"{bmi} kg/m²", "status": "Overweight (25-29.9)"})
    else:
        factors.append({"name": "Body Mass Index (BMI)", "value": f"{bmi} kg/m²", "status": "Normal (18.5-24.9)"})

    # Blood Pressure evaluation
    if bp >= 90:
        factors.append({"name": "Diastolic Blood Pressure", "value": f"{bp} mm Hg", "status": "Hypertensive (>=90)"})
    elif bp >= 80:
        factors.append({"name": "Diastolic Blood Pressure", "value": f"{bp} mm Hg", "status": "Pre-Hypertension (80-89)"})
    else:
        factors.append({"name": "Diastolic Blood Pressure", "value": f"{bp} mm Hg", "status": "Optimal (<80)"})

    # Genetic Pedigree
    if dpf >= 0.7:
        factors.append({"name": "Diabetes Pedigree Score", "value": f"{dpf}", "status": "High Familial Genetic Risk"})
    else:
        factors.append({"name": "Diabetes Pedigree Score", "value": f"{dpf}", "status": "Moderate/Low Genetic Risk"})

    return factors

def generate_recommendations(is_diabetic, data):
    """Personalized clinical lifestyle & diagnostic recommendations"""
    recs = []
    if is_diabetic:
        recs.append("Consult an endocrinologist or primary care physician for diagnostic confirmation (HbA1c & Fasting C-Peptide).")
        recs.append("Initiate low-glycemic dietary planning, restricting refined carbohydrates and high-fructose beverages.")
        recs.append("Incorporate 150+ minutes of weekly aerobic exercise combined with progressive resistance training to enhance insulin sensitivity.")
        recs.append("Establish routine daily self-monitoring of blood glucose (SMBG).")
    else:
        recs.append("Maintain optimal metabolic health with consistent hydration and nutrient-dense whole foods.")
        recs.append("Schedule routine annual wellness panels including fasting glucose and lipid profiles.")
        recs.append("Sustain active daily physical activity to maintain healthy BMI and cardiovascular elasticity.")
    return recs


## Route for homepage
@app.route('/')
def index():
    return render_template('home.html')

## Route for Single data point prediction
@app.route('/predictdata', methods=['GET', 'POST'])
def predict_datapoint():
    if request.method == 'POST':
        # Detect if payload is JSON or Form
        json_data = request.get_json(silent=True)
        is_ajax = (
            request.is_json
            or request.headers.get('X-Requested-With') == 'XMLHttpRequest'
            or 'application/json' in request.headers.get('Accept', '')
        )

        try:
            if json_data:
                pregnancies = int(float(json_data.get("Pregnancies", 0)))
                glucose = float(json_data.get('Glucose', 100))
                blood_pressure = float(json_data.get('BloodPressure', 70))
                skin_thickness = float(json_data.get('SkinThickness', 20))
                insulin = float(json_data.get('Insulin', 79))
                bmi = float(json_data.get('BMI', 25.0))
                pedigree = float(json_data.get('DiabetesPedigreeFunction', 0.35))
                age = float(json_data.get('Age', 30))
            else:
                pregnancies = int(float(request.form.get("Pregnancies", 0)))
                glucose = float(request.form.get('Glucose', 100))
                blood_pressure = float(request.form.get('BloodPressure', 70))
                skin_thickness = float(request.form.get('SkinThickness', 20))
                insulin = float(request.form.get('Insulin', 79))
                bmi = float(request.form.get('BMI', 25.0))
                pedigree = float(request.form.get('DiabetesPedigreeFunction', 0.35))
                age = float(request.form.get('Age', 30))

            patient_dict = {
                "Pregnancies": pregnancies,
                "Glucose": glucose,
                "BloodPressure": blood_pressure,
                "SkinThickness": skin_thickness,
                "Insulin": insulin,
                "BMI": bmi,
                "DiabetesPedigreeFunction": pedigree,
                "Age": age
            }

            feature_cols = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age']
            df_input = pd.DataFrame([[pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, pedigree, age]], columns=feature_cols)
            new_data = scaler.transform(df_input)
            predict = model.predict(new_data)
            is_diabetic = bool(predict[0] == 1)
            result = 'Diabetic' if is_diabetic else 'Non-Diabetic'

            # Calculate probability confidence if supported
            probability = 50.0
            if hasattr(model, 'predict_proba'):
                proba_arr = model.predict_proba(new_data)[0]
                # Index 1 corresponds to Diabetic class
                probability = round(float(proba_arr[1]) * 100, 1)
            else:
                probability = 85.0 if is_diabetic else 15.0

            # Determine risk tier
            if probability >= 60.0 or is_diabetic:
                risk_level = "High Risk"
            elif probability >= 35.0:
                risk_level = "Moderate Risk"
            else:
                risk_level = "Low Risk"

            risk_factors = evaluate_patient_biomarkers(patient_dict)
            recommendations = generate_recommendations(is_diabetic, patient_dict)

            response_data = {
                "prediction": result,
                "is_diabetic": is_diabetic,
                "probability": probability,
                "risk_level": risk_level,
                "patient_data": patient_dict,
                "risk_factors": risk_factors,
                "recommendations": recommendations,
                "status": "success"
            }

            if is_ajax:
                return jsonify(response_data)

            return render_template(
                'single_prediction.html',
                result=result,
                probability=probability,
                risk_level=risk_level,
                is_diabetic=is_diabetic,
                patient_data=patient_dict,
                risk_factors=risk_factors,
                recommendations=recommendations
            )

        except Exception as e:
            if is_ajax:
                return jsonify({"status": "error", "message": str(e)}), 400
            return render_template('single_prediction.html', result=f"Error: {str(e)}", probability=0, risk_level="Unknown")

    else:
        return render_template('home.html')

## Direct JSON API route
@app.route('/api/predict', methods=['POST'])
def api_predict():
    data = request.get_json(force=True)
    try:
        features = [
            float(data.get("Pregnancies", 0)),
            float(data.get("Glucose", 100)),
            float(data.get("BloodPressure", 70)),
            float(data.get("SkinThickness", 20)),
            float(data.get("Insulin", 79)),
            float(data.get("BMI", 25.0)),
            float(data.get("DiabetesPedigreeFunction", 0.35)),
            float(data.get("Age", 30))
        ]
        feature_cols = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age']
        df_input = pd.DataFrame([features], columns=feature_cols)
        transformed = scaler.transform(df_input)
        pred = model.predict(transformed)[0]
        prob = round(float(model.predict_proba(transformed)[0][1]) * 100, 1) if hasattr(model, 'predict_proba') else (80.0 if pred == 1 else 20.0)
        
        return jsonify({
            "prediction": "Diabetic" if pred == 1 else "Non-Diabetic",
            "is_diabetic": bool(pred == 1),
            "probability": prob,
            "status": "success"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)