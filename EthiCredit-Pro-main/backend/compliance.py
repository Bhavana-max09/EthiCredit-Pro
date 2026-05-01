import pandas as pd
import os

class ComplianceModule:
    def __init__(self):
        self.data_path = os.path.join(os.path.dirname(__file__), 'data', 'mock_home_credit_data.csv')
        self.df = None
        if os.path.exists(self.data_path):
            self.df = pd.read_csv(self.data_path)
            
        # Mock Consent Mapping for Purpose Limitation
        self.purpose_mapping = {
            "Credit Scoring": ["AMT_INCOME_TOTAL", "AMT_CREDIT", "EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3"],
            "Identity Verification": ["DAYS_BIRTH", "CODE_GENDER", "ZIP_CODE", "NAME_EDUCATION_TYPE"],
            "Marketing": ["ZIP_CODE", "AMT_INCOME_TOTAL"]
        }
        
    def get_purpose_limitation(self):
        return {
            "Act": "DPDP Act 2023",
            "Principle": "Purpose Limitation",
            "Mapping": self.purpose_mapping
        }
        
    def simulate_right_to_erasure(self, user_index: int):
        if self.df is None or user_index >= len(self.df) or user_index < 0:
            return {"error": "Invalid user index"}
            
        # Simulate erasure by removing the row
        # In a real system, this would trigger database deletion and propagate to backups
        self.df = self.df.drop(index=user_index)
        
        # We won't save it back to disk to preserve the mock dataset for testing,
        # but we return success.
        
        return {
            "Act": "DPDP Act 2023",
            "Principle": "Right to Erasure",
            "Status": "Success",
            "Message": f"User record at index {user_index} successfully erased from active memory."
        }
