# DiaPulse AI - Intelligent Diabetes Risk Assessment & Biometric Intelligence

DiaPulse AI is a modern, vibrant, and interactive machine learning web application built with **Flask**, **Scikit-Learn**, and **AWS Elastic Beanstalk**. It assesses patient diabetes and metabolic risks using clinical covariates from the Pima Indians Diabetes Database.

---

## ✨ Features & Interface Enhancements

- 🎨 **Vibrant Glassmorphic Interface**: Sleek dark aesthetic with ambient radial gradients, frosted glass cards, and neon accent highlights.
- 🎚️ **Dual-Synchronized Biomarker Controls**: Real-time synchronized numeric inputs and range sliders for all 8 clinical covariates:
  - Pregnancies (0 - 17)
  - Plasma Glucose (40 - 250 mg/dL) with oral GTT thresholds
  - Diastolic Blood Pressure (30 - 140 mm Hg)
  - Triceps Skin Fold Thickness (0 - 99 mm)
  - Serum Insulin (0 - 846 μU/mL)
  - Body Mass Index (BMI) (10.0 - 65.0 kg/m²)
  - Diabetes Pedigree Function (0.05 - 2.50)
  - Patient Age (18 - 100 years)
- 🏷️ **Real-Time Clinical Status Badges**: Dynamic indicators (Optimal, Pre-Diabetic, Elevated, Obese, Stage 1/2) that recalculate on the fly as you adjust sliders.
- ⚡ **One-Click Patient Presets**:
  - 🟢 **Healthy Adult**: Low glycemic and optimal metabolic profile.
  - 🟡 **Borderline / Pre-Diabetic**: Moderate glucose and overweight BMI.
  - 🔴 **High-Risk Case**: Elevated glucose, high adiposity, and genetic pedigree.
  - 📋 **Dataset Sample**: Pima Indians benchmark reference sample.
  - 🔄 **Reset**: Instantly restore baseline settings.
- 📊 **Animated Circular Risk Gauge**: Highlighting classification verdict, confidence percentage, and risk tier (Low, Moderate, High Risk).
- 🩺 **Biomarker Risk Evaluation & AI Recommendations**: Actionable lifestyle, dietary, and diagnostic next steps tailored to the individual's assessment.
- 📋 **Copy & Print Tools**: Instantly copy assessment summaries to clipboard or print clean clinical assessment summaries.
- 🌐 **Dual Support (AJAX + Fallback Form + REST API)**: Supports interactive zero-reload predictions via fetch, standard HTML form submission, and direct JSON POST calls at `/api/predict`.

---

## 🚀 Running Locally

1. **Activate your Python environment** (with `scikit-learn`, `flask`, `pandas`, `numpy` installed):
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Flask server**:
   ```bash
   python application.py
   ```

3. **Open in your browser**:
   ```
   http://127.0.0.1:5000/
   ```

---

## 📡 REST API Endpoint

You can also send direct JSON requests:
```bash
POST http://127.0.0.1:5000/api/predict
Content-Type: application/json

{
  "Pregnancies": 6,
  "Glucose": 148,
  "BloodPressure": 72,
  "SkinThickness": 35,
  "Insulin": 0,
  "BMI": 33.6,
  "DiabetesPedigreeFunction": 0.62,
  "Age": 59
}
```

Response:
```json
{
  "prediction": "Diabetic",
  "is_diabetic": true,
  "probability": 76.8,
  "status": "success"
}
```

---

## ☁️ AWS Elastic Beanstalk Deployment

The repository includes `.ebextensions/python.config` configured with:
```yaml
option_settings:
  "aws:elasticbeanstalk:container:python":
    WSGIPath: application:application
```
Deploy smoothly to AWS Elastic Beanstalk using the `eb-cli`:
```bash
eb init
eb create diapulse-env
eb deploy
```
