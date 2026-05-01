import xgboost as xgb
import pandas as pd
import os

class CoreEngine:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), 'xgboost_model.json')
        self.feature_names_path = os.path.join(os.path.dirname(__file__), 'feature_names.txt')
        self.model = None
        self.feature_names = []
        self._load_model()
        
    def _load_model(self):
        if os.path.exists(self.model_path):
            self.model = xgb.XGBClassifier()
            self.model.load_model(self.model_path)
        if os.path.exists(self.feature_names_path):
            with open(self.feature_names_path, 'r') as f:
                self.feature_names = f.read().split(',')
                
    def predict(self, input_data: pd.DataFrame):
        if self.model is None:
            raise ValueError("Model not trained or loaded.")
        # Ensure columns match
        missing_cols = set(self.feature_names) - set(input_data.columns)
        for c in missing_cols:
            input_data[c] = 0
        input_data = input_data[self.feature_names]
        
        prob = self.model.predict_proba(input_data)[:, 1]
        default_prob = float(prob[0])
        
        return {
            "default_probability": default_prob,
            "decision": "Approve" if default_prob < 0.5 else "Reject",
            "approved": default_prob < 0.5
        }
