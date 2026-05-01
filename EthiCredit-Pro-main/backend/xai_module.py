import shap
import pandas as pd
import numpy as np
import os

class XAIModule:
    def __init__(self, model, feature_names):
        self.model = model
        self.feature_names = feature_names
        self.explainer = None
        self.train_data = None
        self.expected_value = 0.5
        
        self._initialize()
        
    def _initialize(self):
        data_path = os.path.join(os.path.dirname(__file__), 'data', 'mock_home_credit_data.csv')
        if os.path.exists(data_path):
            df = pd.read_csv(data_path)
            df = pd.get_dummies(df, columns=['CODE_GENDER', 'NAME_EDUCATION_TYPE', 'ZIP_CODE'])
            
            for c in self.feature_names:
                if c not in df.columns:
                    df[c] = 0
            self.train_data = df[self.feature_names]
            
            self.explainer = shap.TreeExplainer(self.model)
            try:
                self.expected_value = float(self.explainer.expected_value)
            except:
                self.expected_value = 0.5

    def get_local_shap(self, input_data: pd.DataFrame):
        input_data = input_data[self.feature_names]
        shap_values = self.explainer.shap_values(input_data)
        
        importance = []
        for i, col in enumerate(self.feature_names):
            importance.append({"feature": col, "value": float(shap_values[0][i])})
            
        importance.sort(key=lambda x: abs(x["value"]), reverse=True)
        top10 = importance[:10]

        # Cumulative for waterfall chart
        running = self.expected_value
        for item in top10:
            item["base_value"] = float(self.expected_value)
            item["cumulative_start"] = running
            running += item["value"]
            item["cumulative_end"] = running
        
        return top10

    def generate_counterfactuals(self, input_data: pd.DataFrame):
        """Returns detailed, quantifiable counterfactual paths."""
        input_aligned = input_data[self.feature_names]
        base_prob = float(self.model.predict_proba(input_aligned)[0][1])
        
        if base_prob <= 0.5:
            return {
                "status": "Approved",
                "base_probability": base_prob,
                "paths": []
            }
        
        cf_paths = []
        
        # Scenario 1: Increase Income by 50%
        cf1 = input_aligned.copy()
        if 'AMT_INCOME_TOTAL' in cf1.columns:
            orig_income = float(cf1['AMT_INCOME_TOTAL'].iloc[0])
            cf1['AMT_INCOME_TOTAL'] = orig_income * 1.5
            new_prob1 = float(self.model.predict_proba(cf1)[0][1])
            if new_prob1 < base_prob:
                cf_paths.append({
                    "action": f"Increase total annual income by 50% (from ${orig_income:,.0f} to ${orig_income * 1.5:,.0f})",
                    "new_probability": new_prob1,
                    "probability_change": round((base_prob - new_prob1) * 100, 1),
                    "icon": "📈",
                    "category": "income"
                })

        # Scenario 2: Reduce Credit by 30%
        cf2 = input_aligned.copy()
        if 'AMT_CREDIT' in cf2.columns:
            orig_credit = float(cf2['AMT_CREDIT'].iloc[0])
            cf2['AMT_CREDIT'] = orig_credit * 0.7
            new_prob2 = float(self.model.predict_proba(cf2)[0][1])
            if new_prob2 < base_prob:
                cf_paths.append({
                    "action": f"Reduce requested loan amount by 30% (from ${orig_credit:,.0f} to ${orig_credit * 0.7:,.0f})",
                    "new_probability": new_prob2,
                    "probability_change": round((base_prob - new_prob2) * 100, 1),
                    "icon": "💳",
                    "category": "credit"
                })

        # Scenario 3: Improve External Source 2 score
        cf3 = input_aligned.copy()
        if 'EXT_SOURCE_2' in cf3.columns:
            orig_ext2 = float(cf3['EXT_SOURCE_2'].iloc[0])
            cf3['EXT_SOURCE_2'] = min(orig_ext2 + 0.3, 1.0)
            new_prob3 = float(self.model.predict_proba(cf3)[0][1])
            if new_prob3 < base_prob:
                cf_paths.append({
                    "action": f"Improve credit bureau score (EXT_SOURCE_2) from {orig_ext2:.2f} to {min(orig_ext2+0.3,1.0):.2f} by reducing outstanding debt",
                    "new_probability": new_prob3,
                    "probability_change": round((base_prob - new_prob3) * 100, 1),
                    "icon": "⭐",
                    "category": "credit_score"
                })

        # Scenario 4: Combined improvement
        cf4 = input_aligned.copy()
        changed = False
        if 'AMT_INCOME_TOTAL' in cf4.columns:
            cf4['AMT_INCOME_TOTAL'] = float(cf4['AMT_INCOME_TOTAL'].iloc[0]) * 1.25
            changed = True
        if 'AMT_CREDIT' in cf4.columns:
            cf4['AMT_CREDIT'] = float(cf4['AMT_CREDIT'].iloc[0]) * 0.85
            changed = True
        if changed:
            new_prob4 = float(self.model.predict_proba(cf4)[0][1])
            if new_prob4 < base_prob:
                cf_paths.append({
                    "action": "Increase income by 25% AND reduce loan amount by 15% (combined optimization)",
                    "new_probability": new_prob4,
                    "probability_change": round((base_prob - new_prob4) * 100, 1),
                    "icon": "🎯",
                    "category": "combined"
                })

        if not cf_paths:
            cf_paths.append({
                "action": "Significant improvement in all external credit scores required. Consider credit counseling and debt consolidation.",
                "new_probability": base_prob,
                "probability_change": 0,
                "icon": "💡",
                "category": "general"
            })
            
        return {
            "status": "Rejected",
            "base_probability": base_prob,
            "paths": cf_paths
        }

    def generate_narrative(self, input_data: pd.DataFrame):
        """Generates a plain-language AI narrative summary of the decision."""
        shap_data = self.get_local_shap(input_data)
        input_aligned = input_data[self.feature_names]
        prob = float(self.model.predict_proba(input_aligned)[0][1])
        decision = "rejected" if prob > 0.5 else "approved"

        top_negative = [x for x in shap_data if x['value'] > 0][:2]  # pushing toward reject
        top_positive = [x for x in shap_data if x['value'] < 0][:2]  # pushing toward approve

        def friendly_name(feature):
            mapping = {
                'EXT_SOURCE_2': 'external credit bureau score',
                'EXT_SOURCE_3': 'third-party credit rating',
                'EXT_SOURCE_1': 'supplementary credit score',
                'AMT_INCOME_TOTAL': 'total annual income',
                'AMT_CREDIT': 'requested loan amount',
                'DAYS_BIRTH': 'applicant age profile',
            }
            for k, v in mapping.items():
                if k in feature:
                    return v
            return feature.lower().replace('_', ' ')

        narrative_parts = []
        if decision == "rejected":
            narrative_parts.append(f"⚠️ The model flagged this application for rejection with a {prob*100:.1f}% default risk score.")
            if top_negative:
                factors = " and ".join([f"the applicant's **{friendly_name(x['feature'])}**" for x in top_negative])
                narrative_parts.append(f"The primary drivers of this decision were {factors}, which significantly elevated the risk profile.")
            if top_positive:
                upsides = " and ".join([f"**{friendly_name(x['feature'])}**" for x in top_positive])
                narrative_parts.append(f"Partially offsetting factors include {upsides}, which demonstrate financial responsibility.")
            narrative_parts.append("💡 **Recommendation**: This case warrants human review. Consider requesting updated income documentation and recent bank statements.")
        else:
            narrative_parts.append(f"✅ The model approved this application with a low default risk score of {prob*100:.1f}%.")
            if top_positive:
                factors = " and ".join([f"**{friendly_name(x['feature'])}**" for x in top_positive])
                narrative_parts.append(f"Key approval drivers were {factors}, which demonstrate strong creditworthiness.")
            narrative_parts.append("📋 **Note**: Standard document verification recommended before final disbursement.")

        return {
            "decision": decision.capitalize(),
            "risk_score": round(prob * 100, 1),
            "narrative": " ".join(narrative_parts),
            "top_reject_factors": [{"feature": friendly_name(x["feature"]), "impact": round(x["value"], 4)} for x in top_negative],
            "top_approve_factors": [{"feature": friendly_name(x["feature"]), "impact": round(abs(x["value"]), 4)} for x in top_positive]
        }
