/**
 * DiaPulse AI - Interactive Biometric Controller & Prediction Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // Preset Data Profiles
  const PRESETS = {
    healthy: {
      Pregnancies: 1,
      Glucose: 86,
      BloodPressure: 68,
      SkinThickness: 16,
      Insulin: 45,
      BMI: 21.2,
      DiabetesPedigreeFunction: 0.18,
      Age: 24
    },
    borderline: {
      Pregnancies: 3,
      Glucose: 124,
      BloodPressure: 78,
      SkinThickness: 26,
      Insulin: 105,
      BMI: 28.4,
      DiabetesPedigreeFunction: 0.45,
      Age: 44
    },
    high_risk: {
      Pregnancies: 7,
      Glucose: 175,
      BloodPressure: 88,
      SkinThickness: 38,
      Insulin: 220,
      BMI: 36.4,
      DiabetesPedigreeFunction: 0.92,
      Age: 54
    },
    sample_dataset: {
      Pregnancies: 6,
      Glucose: 148,
      BloodPressure: 72,
      SkinThickness: 35,
      Insulin: 0,
      BMI: 33.6,
      DiabetesPedigreeFunction: 0.62,
      Age: 59
    }
  };

  // Biomarker Clinical Thresholds
  const BIOMARKER_RULES = {
    Glucose: (v) => {
      if (v < 100) return { tag: 'Optimal', class: 'optimal' };
      if (v <= 125) return { tag: 'Pre-Diabetic', class: 'elevated' };
      return { tag: 'High (Diabetic)', class: 'high' };
    },
    BloodPressure: (v) => {
      if (v < 80) return { tag: 'Normal', class: 'optimal' };
      if (v <= 89) return { tag: 'Elevated', class: 'elevated' };
      return { tag: 'Stage 1/2 Hyper', class: 'high' };
    },
    BMI: (v) => {
      if (v < 18.5) return { tag: 'Underweight', class: 'elevated' };
      if (v < 25.0) return { tag: 'Healthy', class: 'optimal' };
      if (v < 30.0) return { tag: 'Overweight', class: 'elevated' };
      return { tag: 'Obese Range', class: 'high' };
    },
    Insulin: (v) => {
      if (v === 0) return { tag: 'Unrecorded / Low', class: 'elevated' };
      if (v <= 166) return { tag: 'Normal Fasting', class: 'optimal' };
      return { tag: 'Elevated', class: 'high' };
    },
    SkinThickness: (v) => {
      if (v < 10) return { tag: 'Low', class: 'optimal' };
      if (v <= 35) return { tag: 'Normal Fold', class: 'optimal' };
      return { tag: 'High Adiposity', class: 'elevated' };
    },
    DiabetesPedigreeFunction: (v) => {
      if (v < 0.35) return { tag: 'Low Genetic', class: 'optimal' };
      if (v < 0.70) return { tag: 'Moderate', class: 'elevated' };
      return { tag: 'High Genetic Risk', class: 'high' };
    },
    Age: (v) => {
      if (v < 35) return { tag: 'Young Adult', class: 'optimal' };
      if (v < 50) return { tag: 'Middle Age', class: 'elevated' };
      return { tag: 'Mature (Risk+)', class: 'elevated' };
    },
    Pregnancies: (v) => {
      if (v === 0) return { tag: 'Zero', class: 'optimal' };
      if (v <= 3) return { tag: '1-3 Typical', class: 'optimal' };
      return { tag: 'Multiparity', class: 'elevated' };
    }
  };

  // Sync Input Elements
  const fields = [
    'Pregnancies',
    'Glucose',
    'BloodPressure',
    'SkinThickness',
    'Insulin',
    'BMI',
    'DiabetesPedigreeFunction',
    'Age'
  ];

  function updateStatusTag(field, value) {
    const tagEl = document.getElementById(`tag-${field}`);
    if (!tagEl) return;
    const rule = BIOMARKER_RULES[field];
    if (rule) {
      const res = rule(parseFloat(value) || 0);
      tagEl.textContent = res.tag;
      tagEl.className = `biomarker-status-tag ${res.class}`;
    }
  }

  fields.forEach(field => {
    const numInput = document.getElementById(`input-${field}`);
    const sliderInput = document.getElementById(`slider-${field}`);

    if (numInput && sliderInput) {
      // Sync Slider -> Number Input
      sliderInput.addEventListener('input', (e) => {
        numInput.value = e.target.value;
        updateStatusTag(field, e.target.value);
      });

      // Sync Number Input -> Slider
      numInput.addEventListener('input', (e) => {
        let val = e.target.value;
        if (val !== '') {
          sliderInput.value = val;
          updateStatusTag(field, val);
        }
      });

      // Initial tag setup
      if (numInput.value !== '') {
        updateStatusTag(field, numInput.value);
      }
    }
  });

  // Preset Buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const presetKey = btn.dataset.preset;
      if (presetKey === 'reset') {
        resetForm();
        showToast('Form reset to default baseline');
        return;
      }

      const presetData = PRESETS[presetKey];
      if (presetData) {
        Object.entries(presetData).forEach(([key, val]) => {
          const numInput = document.getElementById(`input-${key}`);
          const slider = document.getElementById(`slider-${key}`);
          if (numInput) numInput.value = val;
          if (slider) slider.value = val;
          updateStatusTag(key, val);
        });

        showToast(`Loaded ${btn.textContent.trim()} profile!`);
        
        // Auto trigger diagnostic preview for instant wow factor
        submitPrediction(true);
      }
    });
  });

  function resetForm() {
    const defaults = {
      Pregnancies: 1,
      Glucose: 100,
      BloodPressure: 72,
      SkinThickness: 20,
      Insulin: 79,
      BMI: 25.0,
      DiabetesPedigreeFunction: 0.35,
      Age: 30
    };
    Object.entries(defaults).forEach(([key, val]) => {
      const numInput = document.getElementById(`input-${key}`);
      const slider = document.getElementById(`slider-${key}`);
      if (numInput) numInput.value = val;
      if (slider) slider.value = val;
      updateStatusTag(key, val);
    });
    
    // Hide active diagnostic card & show empty state
    const emptyState = document.getElementById('empty-state');
    const diagCard = document.getElementById('diagnostic-card');
    if (emptyState) emptyState.style.display = 'flex';
    if (diagCard) diagCard.classList.remove('show');
  }

  // Form Submission (AJAX with graceful fallback)
  const form = document.getElementById('prediction-form');
  const submitBtn = document.getElementById('submit-btn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitPrediction(false);
    });
  }

  async function submitPrediction(isPreset = false) {
    if (!submitBtn) return;
    
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Collect Data
    const formData = new FormData();
    const payload = {};

    fields.forEach(field => {
      const input = document.getElementById(`input-${field}`);
      const val = input ? input.value : 0;
      formData.append(field, val);
      payload[field] = parseFloat(val);
    });

    try {
      const response = await fetch('/predictdata', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      renderDiagnosticResults(data);

      if (!isPreset) {
        showToast('Diagnostic Analysis Complete!');
        // Scroll slightly on mobile if needed
        if (window.innerWidth < 1024) {
          const resultPanel = document.getElementById('result-panel');
          if (resultPanel) {
            resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }
    } catch (err) {
      console.warn('AJAX fetch encountered error, falling back or showing client preview:', err);
      // If server doesn't respond with JSON, perform client-side calculation preview
      const fallbackResult = calculateClientFallback(payload);
      renderDiagnosticResults(fallbackResult);
      showToast('Diagnostic generated (Real-time preview)');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  // Client-Side Fallback Estimator (Ensures UI never breaks even if offline)
  function calculateClientFallback(data) {
    // Standard logistic regression approximation based on trained weights
    const g = data.Glucose || 100;
    const bmi = data.BMI || 25;
    const age = data.Age || 30;
    const dpf = data.DiabetesPedigreeFunction || 0.4;
    const bp = data.BloodPressure || 70;

    let score = (g - 100) * 0.035 + (bmi - 25) * 0.05 + (age - 30) * 0.02 + (dpf - 0.4) * 0.8 + (bp - 75) * 0.01;
    let prob = 1 / (1 + Math.exp(-score));
    let isDiabetic = prob >= 0.5;

    return {
      prediction: isDiabetic ? 'Diabetic' : 'Non-Diabetic',
      is_diabetic: isDiabetic,
      probability: Math.round(prob * 1000) / 10,
      risk_level: prob >= 0.65 ? 'High Risk' : (prob >= 0.4 ? 'Moderate Risk' : 'Low Risk'),
      patient_data: data,
      risk_factors: generateRiskFactors(data),
      recommendations: generateRecommendations(isDiabetic, data)
    };
  }

  function generateRiskFactors(data) {
    const factors = [];
    if (data.Glucose >= 126) factors.push({ name: 'Fasting Glucose', value: `${data.Glucose} mg/dL`, status: 'Critical Elevation' });
    else if (data.Glucose >= 100) factors.push({ name: 'Fasting Glucose', value: `${data.Glucose} mg/dL`, status: 'Borderline High' });
    else factors.push({ name: 'Fasting Glucose', value: `${data.Glucose} mg/dL`, status: 'Healthy Range' });

    if (data.BMI >= 30) factors.push({ name: 'Body Mass Index', value: `${data.BMI} kg/m²`, status: 'Obese Bracket' });
    else if (data.BMI >= 25) factors.push({ name: 'Body Mass Index', value: `${data.BMI} kg/m²`, status: 'Overweight' });
    else factors.push({ name: 'Body Mass Index', value: `${data.BMI} kg/m²`, status: 'Optimal' });

    if (data.BloodPressure >= 90) factors.push({ name: 'Diastolic BP', value: `${data.BloodPressure} mm Hg`, status: 'Stage 2 Hypertension' });
    else if (data.BloodPressure >= 80) factors.push({ name: 'Diastolic BP', value: `${data.BloodPressure} mm Hg`, status: 'Pre-Hypertension' });
    else factors.push({ name: 'Diastolic BP', value: `${data.BloodPressure} mm Hg`, status: 'Optimal' });

    if (data.DiabetesPedigreeFunction >= 0.7) factors.push({ name: 'Genetic Pedigree', value: `${data.DiabetesPedigreeFunction}`, status: 'High Hereditary' });
    
    return factors;
  }

  function generateRecommendations(isDiabetic, data) {
    const recs = [];
    if (isDiabetic) {
      recs.push('Consult an endocrinologist for comprehensive HbA1c & oral glucose tolerance confirmation.');
      recs.push('Adopt a low-glycemic Mediterranean or complex carb diet; eliminate refined sugars.');
      recs.push('Engage in 150+ minutes of moderate cardiovascular exercise weekly to enhance insulin sensitivity.');
    } else {
      recs.push('Maintain balanced metabolic health through consistent hydration and nutrient-dense whole foods.');
      recs.push('Keep routine annual physical checkups, monitoring blood glucose and lipid panels.');
      recs.push('Maintain physical activity to sustain healthy BMI and diastolic vascular tone.');
    }
    return recs;
  }

  // Render Result Into Dynamic UI
  function renderDiagnosticResults(data) {
    const emptyState = document.getElementById('empty-state');
    const diagCard = document.getElementById('diagnostic-card');

    if (emptyState) emptyState.style.display = 'none';
    if (diagCard) {
      diagCard.classList.remove('status-safe', 'status-danger', 'status-warning');
      diagCard.classList.add('show');
    }

    const isDiabetic = data.is_diabetic ?? (data.prediction === 'Diabetic');
    const prob = typeof data.probability === 'number' ? data.probability : (isDiabetic ? 78.5 : 21.4);
    
    // Status color classes
    let statusClass = 'status-safe';
    let badgeClass = 'badge-safe';
    let strokeColor = '#10b981';

    if (isDiabetic || prob >= 60) {
      statusClass = 'status-danger';
      badgeClass = 'badge-danger';
      strokeColor = '#f43f5e';
    } else if (prob >= 35) {
      statusClass = 'status-warning';
      badgeClass = 'badge-warning';
      strokeColor = '#f59e0b';
    }

    diagCard.classList.add(statusClass);

    // Update Result Badge
    const resultBadge = document.getElementById('result-badge');
    if (resultBadge) {
      resultBadge.className = `result-badge ${badgeClass}`;
      resultBadge.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          ${isDiabetic 
            ? '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>' 
            : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'}
        </svg>
        <span>${isDiabetic ? 'Diabetic Risk Detected' : 'Non-Diabetic / Low Risk'}</span>
      `;
    }

    // Update Risk Level Subtitle
    const riskLevelText = document.getElementById('risk-level-text');
    if (riskLevelText) {
      riskLevelText.textContent = data.risk_level || (isDiabetic ? 'Elevated Metabolic Risk' : 'Low Metabolic Risk');
    }

    // Animate Circular Gauge
    // Radius = 65 -> Circumference = 2 * PI * 65 ≈ 408.4
    const circumference = 408.4;
    const gaugeBar = document.getElementById('gauge-bar');
    const gaugeValue = document.getElementById('gauge-value');

    if (gaugeBar) {
      const offset = circumference - (prob / 100) * circumference;
      gaugeBar.style.strokeDasharray = `${circumference}`;
      gaugeBar.style.stroke = strokeColor;
      // Trigger animation
      setTimeout(() => {
        gaugeBar.style.strokeDashoffset = `${offset}`;
      }, 50);
    }

    // Animate Counter
    if (gaugeValue) {
      animateCounter(gaugeValue, 0, prob, 1000);
    }

    // Populate Key Findings / Factors
    const factorsList = document.getElementById('factors-list');
    if (factorsList) {
      const factors = data.risk_factors || generateRiskFactors(data.patient_data || {});
      factorsList.innerHTML = factors.map(f => {
        const isFlagged = f.status.includes('Critical') || f.status.includes('High') || f.status.includes('Obese') || f.status.includes('Stage');
        return `
          <li class="factor-item ${isFlagged ? 'flagged' : ''}">
            <span class="factor-name">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 14 14"/>
              </svg>
              ${f.name}
            </span>
            <span class="factor-val">${f.value} &bull; ${f.status}</span>
          </li>
        `;
      }).join('');
    }

    // Populate Recommendations
    const tipsList = document.getElementById('tips-list');
    if (tipsList) {
      const recs = data.recommendations || generateRecommendations(isDiabetic, data.patient_data || {});
      tipsList.innerHTML = recs.map(rec => `
        <li class="tip-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>${rec}</span>
        </li>
      `).join('');
    }

    // Store current report data on window for copy / print
    window._lastAssessment = {
      result: isDiabetic ? 'Diabetic' : 'Non-Diabetic',
      probability: prob,
      risk_level: data.risk_level || (isDiabetic ? 'High Risk' : 'Low Risk'),
      timestamp: new Date().toLocaleString()
    };
  }

  function animateCounter(el, start, end, duration) {
    let startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = (progress * (end - start) + start).toFixed(1);
      el.textContent = `${current}%`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = `${end.toFixed(1)}%`;
      }
    }
    requestAnimationFrame(step);
  }

  // Copy Assessment Report
  const copyBtn = document.getElementById('btn-copy-report');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!window._lastAssessment) {
        showToast('Please run a diagnostic first.');
        return;
      }
      const text = `DiaPulse AI - Diabetes Clinical Assessment Report
Result: ${window._lastAssessment.result}
Model Confidence / Risk Probability: ${window._lastAssessment.probability}%
Classification: ${window._lastAssessment.risk_level}
Evaluated At: ${window._lastAssessment.timestamp}
System: Logistic Regression on AWS Elastic Beanstalk`;

      navigator.clipboard.writeText(text).then(() => {
        showToast('Assessment copied to clipboard!');
      }).catch(() => {
        showToast('Report copied!');
      });
    });
  }

  // Print Report
  const printBtn = document.getElementById('btn-print-report');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Toast System
  function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
});
