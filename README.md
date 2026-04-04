# 🛸 SANSight — Spaceflight-Associated Neuro-Ocular Syndrome Risk Monitor

**An AI-powered health monitoring system that detects early warning signs of SANS in astronauts.**

> Built at Catapult · April 2025

---

## What is SANS?

SANS (Spaceflight-Associated Neuro-Ocular Syndrome) is a serious condition affecting astronauts in microgravity. Without gravity, fluids shift toward the head, increasing intracranial pressure and causing **vision changes, eye shape distortion, and potential permanent blindness**.

SANS is one of the most significant unresolved health risks of long-duration spaceflight — this project aims to catch it early.

---

## What SANSight Does

SANSight takes in an astronaut's biometric data and outputs a **personalized risk percentage** for developing SANS. It is not a diagnostic tool — it is an early warning system.

**Inputs:**
- 📷 Retinal scan image (uploaded by user)
- 🧂 Sodium / salt intake levels
- 💊 Vitamin D, Calcium, Magnesium levels

**Output:**
- A SANS risk score (0–100%)
- Key risk factors driving the score
- Trend tracking over time

---

## How It Works

```
User Input (retinal scan + biometrics)
        │
        ├──► CNN Model     ← analyzes retinal scan image
        │         └── Retinal Risk Score
        │
        ├──► Random Forest Model   ← analyzes tabular health data
        │         └── Biometric Risk Score
        │
        └──► TensorFlow
                  └── Final SANS Risk %  ──► Displayed to User
```

### ML Models

| Model | Input | Purpose |
|---|---|---|
| CNN | Retinal scan image | Detects structural eye changes associated with SANS |
| Random Forest | Vitamins and Sodium | Identifies biometric risk patterns |
| Weighted Average Fusion | Both scores | Combines into a single interpretable risk percentage |

> The CNN uses **transfer learning** from ImageNet weights, fine-tuned on retinal disease datasets. The tabular model is trained on NASA astronaut health and nutrition data.

---

## Datasets Used

| Dataset | Source | Used For |
|---|---|---|
| Astronaut Health Dataset | [Kaggle](https://www.kaggle.com/datasets/khushichhabadia/astronaut-health-dataset) | General astronaut health baselines |
| Eye Diseases Classification | [Kaggle](https://www.kaggle.com/datasets/gunavenkatdoddi/eye-diseases-classification) | Retinal scan CNN training |
| NASA Nutrition Data (Vitamin D, Ca, Mg, Na) | [NASA LSDA](https://nlsp.nasa.gov/view/lsdapub/lsda_dataset/bd251656-b948-512e-86a7-03a67add6d60) | Biometric model features |
| NASA Open Science Data | [data.gov](https://catalog.data.gov/dataset/?q=elderly+health+data&organization=nasa-gov) | Supplementary health data |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React / Next.js |
| Backend API | FastAPI (Python) |
| ML – Tabular | Random Forest |
| ML – Vision | CNN |
| ML Training | TesnorFlow |
| Authentication | [World ID](https://docs.world.org/world-id/overview) |
| Data Processing | pandas, NumPy |

---

## Features

- 🔐 **World ID Login** — privacy-preserving authentication using World ID
- 📤 **Retinal Scan Upload** — user submits an eye scan for AI analysis
- 📋 **Manual Biometric Input** — log sodium intake and vitamin levels
- 📊 **Risk Dashboard** — visual risk score with breakdown of contributing factors
- 📈 **Trend Tracking** — monitor risk changes over time

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip, npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/your-team/sans-monitor.git
cd sans-monitor

# Backend setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend setup
cd ../frontend
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in `/backend`:
```
WORLD_ID_APP_ID=your_world_id_app_id
MODEL_PATH=./models/
```


## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze/retinal` | Upload retinal scan, returns vision risk score |
| `POST` | `/analyze/biometrics` | Submit health data JSON, returns biometric risk score |
| `GET` | `/risk-summary` | Returns fused SANS risk percentage |
| `POST` | `/exercise/log` | Log an exercise session |
| `GET` | `/exercise/history` | Retrieve saved exercise history |

---

## Important Disclaimer

> **SANS is not a medical diagnostic tool.** It is a research-grade risk indicator system built for a hackathon. Results should not be used for clinical decision-making. Always consult a qualified medical professional for health assessments.

---

## References

- [SANS — EyeWiki](https://eyewiki.org/Spaceflight-Associated_Neuro-Ocular_Syndrome_(SANS)#Risk_Factors)
- [NASA Biological & Physical Sciences Data](https://science.nasa.gov/biological-physical/data/)
- [World ID Docs](https://docs.world.org/world-id/overview)
