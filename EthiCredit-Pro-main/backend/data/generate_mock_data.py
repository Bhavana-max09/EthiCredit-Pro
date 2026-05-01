import pandas as pd
import numpy as np
import os

def generate_mock_data(num_samples=1000):
    np.random.seed(42)
    
    # 1. Demographics & Protected Attributes
    # Age: Let's assume applicants are between 20 and 70 (in days: approx -7300 to -25550)
    days_birth = np.random.randint(-25550, -7300, size=num_samples)
    
    # Gender: 'M' or 'F'
    code_gender = np.random.choice(['M', 'F'], size=num_samples, p=[0.45, 0.55])
    
    # 2. Financials & Non-Sensitive Proxies
    # Income (slightly correlated with Age and Gender to create potential bias)
    # Men might have slightly higher income on average in this mock dataset to simulate historical bias
    base_income = np.random.normal(150000, 50000, size=num_samples)
    income_multiplier_gender = np.where(code_gender == 'M', 1.1, 1.0)
    # Older people might have higher income
    income_multiplier_age = 1.0 + ((days_birth + 25550) / 18250) * 0.2
    
    amt_income_total = base_income * income_multiplier_gender * income_multiplier_age
    amt_income_total = np.clip(amt_income_total, 30000, 1000000)
    
    # Credit amount
    amt_credit = amt_income_total * np.random.uniform(1.0, 5.0, size=num_samples)
    
    # Zip Code (proxy for protected attributes)
    # E.g., zip codes 10001, 10002, 10003
    # Let's say 10001 has more elderly, 10002 more youth
    zip_code = np.where(days_birth < -18250, 
                        np.random.choice(['10001', '10003'], size=num_samples, p=[0.7, 0.3]),
                        np.random.choice(['10002', '10003'], size=num_samples, p=[0.6, 0.4]))
    
    # Education
    education_type = np.random.choice(['Secondary', 'Higher education', 'Incomplete higher'], size=num_samples, p=[0.5, 0.3, 0.2])

    # 3. External Sources (from Home Credit - usually predictive)
    ext_source_1 = np.random.uniform(0, 1, size=num_samples)
    ext_source_2 = np.random.uniform(0, 1, size=num_samples)
    ext_source_3 = np.random.uniform(0, 1, size=num_samples)
    
    # 4. Target Variable (0 = No Default, 1 = Default)
    # Create a hidden function that determines default probability
    # Bias: Making it slightly harder for 'F' or older applicants to show the bias auditor in action
    prob_default = 0.5 \
                   - (amt_income_total / 1000000) * 0.2 \
                   + (amt_credit / 5000000) * 0.1 \
                   - ext_source_2 * 0.3 \
                   - ext_source_3 * 0.3
                   
    # Inject Bias
    prob_default = np.where(code_gender == 'F', prob_default + 0.05, prob_default)
    prob_default = np.where(days_birth < -20000, prob_default + 0.05, prob_default) # Older applicants
    
    prob_default = np.clip(prob_default, 0.05, 0.95)
    
    target = np.random.binomial(1, prob_default)

    df = pd.DataFrame({
        'DAYS_BIRTH': days_birth,
        'CODE_GENDER': code_gender,
        'AMT_INCOME_TOTAL': amt_income_total,
        'AMT_CREDIT': amt_credit,
        'ZIP_CODE': zip_code,
        'NAME_EDUCATION_TYPE': education_type,
        'EXT_SOURCE_1': ext_source_1,
        'EXT_SOURCE_2': ext_source_2,
        'EXT_SOURCE_3': ext_source_3,
        'TARGET': target
    })
    
    output_path = os.path.join(os.path.dirname(__file__), 'mock_home_credit_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated {num_samples} samples at {output_path}")

if __name__ == "__main__":
    generate_mock_data(5000)
