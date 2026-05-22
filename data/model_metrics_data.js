const MODEL_METRICS = {
  "cv_r2": {
    "value": 0.91,
    "std": 0.03
  },
  "cv_rmse": {
    "value": 0.68,
    "unit": "mS/cm"
  },
  "holdout_r2": {
    "value": 0.89
  },
  "training_data": {
    "count": 4800,
    "source": "CALiSol-23 + Literature"
  },
  "model": {
    "type": "XGBoost",
    "features": 15,
    "n_estimators": 120,
    "max_depth": 6,
    "learning_rate": 0.08
  }
};