import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
import os

def train_and_save_model():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'mock_home_credit_data.csv')
    df = pd.read_csv(data_path)
    
    # Preprocessing
    # Convert categorical 'CODE_GENDER' and 'NAME_EDUCATION_TYPE' to numeric/dummy
    df = pd.get_dummies(df, columns=['CODE_GENDER', 'NAME_EDUCATION_TYPE', 'ZIP_CODE'])
    
    X = df.drop('TARGET', axis=1)
    y = df['TARGET']
    
    # Save the feature names for later use in API/Frontend
    with open(os.path.join(os.path.dirname(__file__), 'feature_names.txt'), 'w') as f:
        f.write(','.join(X.columns.tolist()))
        
    # We will use all data for training for the mock to have a simple pipeline
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss')
    model.fit(X_train, y_train)
    
    model_path = os.path.join(os.path.dirname(__file__), 'xgboost_model.json')
    model.save_model(model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()
