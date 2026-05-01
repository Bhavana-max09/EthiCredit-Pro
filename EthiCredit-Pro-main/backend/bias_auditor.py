import pandas as pd
import numpy as np
import os
import scipy.stats as stats

class BiasAuditor:
    def __init__(self, model, feature_names):
        self.model = model
        self.feature_names = feature_names
        self.data_path = os.path.join(os.path.dirname(__file__), 'data', 'mock_home_credit_data.csv')
        self.df = None
        if os.path.exists(self.data_path):
            self.df = pd.read_csv(self.data_path)
            
    def calculate_fairness_metrics(self):
        if self.df is None:
            return {"error": "Data not found"}
            
        df_encoded = pd.get_dummies(self.df, columns=['CODE_GENDER', 'NAME_EDUCATION_TYPE', 'ZIP_CODE'])
        for c in self.feature_names:
            if c not in df_encoded.columns:
                df_encoded[c] = 0
        
        preds = self.model.predict(df_encoded[self.feature_names])
        df_eval = self.df.copy()
        df_eval['PRED'] = preds  # 1 = Default (Reject), 0 = No Default (Approve)
        
        # Gender Disparate Impact
        male_approvals = len(df_eval[(df_eval['CODE_GENDER'] == 'M') & (df_eval['PRED'] == 0)])
        male_total = len(df_eval[df_eval['CODE_GENDER'] == 'M'])
        male_rate = male_approvals / male_total if male_total > 0 else 0
        
        female_approvals = len(df_eval[(df_eval['CODE_GENDER'] == 'F') & (df_eval['PRED'] == 0)])
        female_total = len(df_eval[df_eval['CODE_GENDER'] == 'F'])
        female_rate = female_approvals / female_total if female_total > 0 else 0
        
        gender_di = female_rate / male_rate if male_rate > 0 else 0
        gender_spd = female_rate - male_rate

        # Age Disparate Impact (Older vs Younger)
        older_approvals = len(df_eval[(df_eval['DAYS_BIRTH'] < -18250) & (df_eval['PRED'] == 0)])
        older_total = len(df_eval[df_eval['DAYS_BIRTH'] < -18250])
        older_rate = older_approvals / older_total if older_total > 0 else 0
        
        younger_approvals = len(df_eval[(df_eval['DAYS_BIRTH'] >= -18250) & (df_eval['PRED'] == 0)])
        younger_total = len(df_eval[df_eval['DAYS_BIRTH'] >= -18250])
        younger_rate = younger_approvals / younger_total if younger_total > 0 else 0
        
        age_di = older_rate / younger_rate if younger_rate > 0 else 0
        age_spd = older_rate - younger_rate

        # Theil Index (inequality in approvals)
        approval_rates = [male_rate, female_rate, older_rate, younger_rate]
        mean_rate = np.mean([r for r in approval_rates if r > 0])
        theil_values = [(r / mean_rate) * np.log(r / mean_rate) if r > 0 and mean_rate > 0 else 0 for r in approval_rates]
        theil_index = float(np.mean(theil_values))

        # Equalized Odds check (True Positive Rate by group)
        true_positives_m = len(df_eval[(df_eval['CODE_GENDER'] == 'M') & (df_eval['PRED'] == 0) & (df_eval['TARGET'] == 0)])
        total_true_m = len(df_eval[(df_eval['CODE_GENDER'] == 'M') & (df_eval['TARGET'] == 0)])
        tpr_male = true_positives_m / total_true_m if total_true_m > 0 else 0

        true_positives_f = len(df_eval[(df_eval['CODE_GENDER'] == 'F') & (df_eval['PRED'] == 0) & (df_eval['TARGET'] == 0)])
        total_true_f = len(df_eval[(df_eval['CODE_GENDER'] == 'F') & (df_eval['TARGET'] == 0)])
        tpr_female = true_positives_f / total_true_f if total_true_f > 0 else 0

        equalized_odds_diff = abs(tpr_male - tpr_female)

        # Active Mitigation: suggest threshold adjustment
        lda_suggestions = []
        if gender_di < 0.8:
            lda_suggestions.append({
                "issue": "Gender Disparate Impact < 0.8",
                "lda": "Apply Reject Option Classification (ROC) – adjust approval threshold for Female applicants near the boundary (±5%) to improve parity.",
                "estimated_new_di": round(min(gender_di + 0.15, 1.0), 2)
            })
        if age_di < 0.8:
            lda_suggestions.append({
                "issue": "Age Disparate Impact < 0.8",
                "lda": "Apply Reweighing technique – up-weight older applicants in next training cycle to reduce historical underrepresentation.",
                "estimated_new_di": round(min(age_di + 0.12, 1.0), 2)
            })
        if not lda_suggestions:
            lda_suggestions.append({
                "issue": "No significant disparate impact detected",
                "lda": "Model is operating within fair lending thresholds. Continue monitoring with quarterly audits.",
                "estimated_new_di": None
            })

        # Data Heartbeat / Missingno simulation
        data_feeds = [
            {"feed": "Income Data Feed", "status": "healthy", "completeness": 98.2, "last_update": "2 mins ago"},
            {"feed": "Credit Bureau API", "status": "healthy", "completeness": 96.5, "last_update": "5 mins ago"},
            {"feed": "Employment Verification", "status": "warning", "completeness": 72.1, "last_update": "34 mins ago"},
            {"feed": "Alternative Data (Rent/Utilities)", "status": "healthy", "completeness": 89.3, "last_update": "8 mins ago"},
            {"feed": "Document OCR Feed", "status": "healthy", "completeness": 94.7, "last_update": "3 mins ago"},
            {"feed": "Fraud Screening API", "status": "error", "completeness": 0.0, "last_update": "2 hours ago"},
        ]

        return {
            "Gender_Disparate_Impact": float(gender_di),
            "Gender_SPD": float(gender_spd),
            "Age_Disparate_Impact": float(age_di),
            "Age_SPD": float(age_spd),
            "Theil_Index": float(theil_index),
            "Equalized_Odds_Diff": float(equalized_odds_diff),
            "TPR_Male": float(tpr_male),
            "TPR_Female": float(tpr_female),
            "Warning": "DI < 0.8 usually indicates potential bias against the unprivileged group.",
            "LDA_Suggestions": lda_suggestions,
            "Data_Heartbeat": data_feeds
        }
        
    def adversarial_stress_test(self, input_data: pd.DataFrame):
        original_pred = self.model.predict(input_data[self.feature_names])[0]
        
        flips = 0
        num_tests = 50
        
        for _ in range(num_tests):
            noisy_data = input_data.copy()
            if 'AMT_INCOME_TOTAL' in noisy_data.columns:
                noise = np.random.normal(0, 0.1 * noisy_data['AMT_INCOME_TOTAL'].values[0])
                noisy_data['AMT_INCOME_TOTAL'] += noise
            if 'AMT_CREDIT' in noisy_data.columns:
                noise = np.random.normal(0, 0.1 * noisy_data['AMT_CREDIT'].values[0])
                noisy_data['AMT_CREDIT'] += noise
                
            noisy_pred = self.model.predict(noisy_data[self.feature_names])[0]
            if noisy_pred != original_pred:
                flips += 1
                
        stability = (num_tests - flips) / num_tests
        
        return {
            "Stability_Score": float(stability),
            "Flips": int(flips),
            "Tests": int(num_tests),
            "Status": "Stable" if stability > 0.9 else ("Borderline" if stability > 0.7 else "Unstable")
        }
