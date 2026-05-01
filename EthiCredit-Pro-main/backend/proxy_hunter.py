import pandas as pd
import numpy as np
import os
import scipy.stats as stats

class ProxyHunter:
    def __init__(self):
        self.data_path = os.path.join(os.path.dirname(__file__), 'data', 'mock_home_credit_data.csv')
        self.df = None
        if os.path.exists(self.data_path):
            self.df = pd.read_csv(self.data_path)
            
    def compute_correlations(self):
        if self.df is None:
            return {"error": "Data not found"}
            
        results = []
        
        # 1. ZIP_CODE vs DAYS_BIRTH (age proxy via residential area)
        groups = [self.df['DAYS_BIRTH'][self.df['ZIP_CODE'] == zip_val] for zip_val in self.df['ZIP_CODE'].unique()]
        f_stat, p_val = stats.f_oneway(*groups)
        
        proxy_integrity_score = round(100 - (abs(f_stat) * 5), 1)
        proxy_integrity_score = max(0, min(100, proxy_integrity_score))
        
        if p_val < 0.05:
            results.append({
                "Non_Sensitive_Feature": "ZIP_CODE",
                "Protected_Attribute": "Age / DAYS_BIRTH",
                "Correlation_Type": "ANOVA",
                "Value": round(float(p_val), 4),
                "Flag": "High Risk Proxy",
                "Proxy_Integrity_Score": proxy_integrity_score,
                "Recommendation": "ZIP_CODE correlates with age demographics due to housing market patterns. Apply Disparate Impact Remover or exclude from final model."
            })
            
        # 2. AMT_INCOME_TOTAL vs CODE_GENDER (income as gender proxy)
        gender_binary = np.where(self.df['CODE_GENDER'] == 'M', 1, 0)
        corr2, p_val2 = stats.pointbiserialr(gender_binary, self.df['AMT_INCOME_TOTAL'])
        integrity2 = round(100 - abs(corr2) * 100, 1)
        
        results.append({
            "Non_Sensitive_Feature": "AMT_INCOME_TOTAL",
            "Protected_Attribute": "Gender / CODE_GENDER",
            "Correlation_Type": "Point-Biserial",
            "Value": round(float(corr2), 4),
            "Flag": "Moderate Risk Proxy" if abs(corr2) > 0.1 else "Low Risk Proxy",
            "Proxy_Integrity_Score": integrity2,
            "Recommendation": "Income correlates with gender due to systemic pay gaps. Monitor but retain — income is a valid credit characteristic when used with fairness constraints."
        })

        # 3. EXT_SOURCE_2 vs DAYS_BIRTH (credit score as age proxy)
        corr3, p_val3 = stats.pearsonr(self.df['EXT_SOURCE_2'], self.df['DAYS_BIRTH'])
        integrity3 = round(100 - abs(corr3) * 100, 1)
        results.append({
            "Non_Sensitive_Feature": "EXT_SOURCE_2",
            "Protected_Attribute": "Age / DAYS_BIRTH",
            "Correlation_Type": "Pearson",
            "Value": round(float(corr3), 4),
            "Flag": "High Risk Proxy" if abs(corr3) > 0.3 else ("Moderate Risk Proxy" if abs(corr3) > 0.15 else "Low Risk Proxy"),
            "Proxy_Integrity_Score": integrity3,
            "Recommendation": "External credit scores may embed age-related historical biases. Validate that EXT_SOURCE_2 retains predictive power when conditioned on age groups."
        })

        # 4. Simulated alternative data proxies (from research paper)
        simulated_proxies = [
            {
                "Non_Sensitive_Feature": "Phone_Brand_Tier (simulated)",
                "Protected_Attribute": "Income / Socioeconomic Status",
                "Correlation_Type": "Simulated (Price Correlation)",
                "Value": 0.41,
                "Flag": "High Risk Proxy",
                "Proxy_Integrity_Score": 59.0,
                "Recommendation": "Phone brand is a strong proxy for income. If used in alternative data scoring, apply Optimized Preprocessing to remove socioeconomic signal."
            },
            {
                "Non_Sensitive_Feature": "Online_Shopping_Timing (simulated)",
                "Protected_Attribute": "Religion / Employment Status",
                "Correlation_Type": "Simulated (Behavioral Pattern)",
                "Value": 0.28,
                "Flag": "Moderate Risk Proxy",
                "Proxy_Integrity_Score": 72.0,
                "Recommendation": "Shopping patterns on weekends/holidays can proxy religious observance. Evaluate with demographic-conditional predictive power test."
            }
        ]
        results.extend(simulated_proxies)

        # Summary statistics
        high_risk = len([r for r in results if r['Flag'] == 'High Risk Proxy'])
        moderate_risk = len([r for r in results if r['Flag'] == 'Moderate Risk Proxy'])
        avg_integrity = round(np.mean([r['Proxy_Integrity_Score'] for r in results]), 1)

        return {
            "proxies": results,
            "summary": {
                "total_features_scanned": len(results),
                "high_risk_count": high_risk,
                "moderate_risk_count": moderate_risk,
                "average_proxy_integrity_score": avg_integrity,
                "overall_status": "ALERT" if high_risk > 0 else ("WARN" if moderate_risk > 0 else "PASS")
            }
        }
