MeritAI is an ethical AI orchestration layer designed to transform bank lending from an opaque "black-box" into a unified, unbiased decision engine. It directly implements the "Measure, Flag, and Fix" objective to ensure automated decisions are fair, transparent, and auditable.
🎯 Project Objective
Traditional loan processing often repeats historical discriminatory mistakes. MeritAI solves this by:
Inspecting datasets for hidden unfairness.
Fixing harmful bias before it impacts real-world applicants.
Explaining "black-box" rejections with actionable visual reports.
🚀 Key FeaturesActive Bias Mitigation: 
Uses the AIF360 toolkit to apply technical fixes like reweighing (pre-processing) and adversarial debiasing (in-processing).
Visual Explainability (XAI):
Generates individual SHAP Force Plots to show factor weights (e.g., Income $+0.3$ vs. Debt $-0.2$) for every decision.
Actionable Counterfactuals: 
Uses the DiCE framework to give rejected borrowers a roadmap for future approval (e.g., "If your income was $\$5,000$ higher, you would be approved") .
Historical Portfolio Analytics: 
A dashboard tracking the history of multiple loans (Sanctioned vs. Rejected) across demographic groups to verify zero bias over time .
🛠️ Tech Stack & ModelsMachine Learning:
XGBoost, LightGBM, Random Forest .
Fairness & XAI: 
AI Fairness 360 (AIF360), SHAP, DiCE .Backend: Python, FastAPI.
📊 Sample Output (PGM Input/Output)The tool generates two distinct visual reports:
Single Loan Graph: A visual "tug-of-war" of factor contributions for a single applicant.
History Graph:
A time-series dashboard tracking approval rates by demographic to ensure portfolio-wide equity.
🔮 Future RoadmapAgentic AI: 
Autonomous agents to resolve document discrepancies without human prompts .
Alternative Data:
Integrating utility and rent payments to expand inclusion for "credit-invisible" borrowers .
