import React, { useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import API from '../config';

const INITIAL = {
  DAYS_BIRTH: 1, CODE_GENDER: 'F', AMT_INCOME_TOTAL: 500000,
  AMT_CREDIT: 150000, ZIP_CODE: '10001', NAME_EDUCATION_TYPE: 'Higher education',
  EXT_SOURCE_1: 0.8, EXT_SOURCE_2: 0.8, EXT_SOURCE_3: 0.8
};

const ApplicantView = () => {
  const [form, setForm] = useState(INITIAL);
  const [result, setResult] = useState(null);
  const [shap, setShap] = useState([]);
  const [cfs, setCfs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [whatIfProb, setWhatIfProb] = useState(null);
  const [activeTab, setActiveTab] = useState('form');

  const age = Math.round(form.DAYS_BIRTH / 365);
  const dti = form.AMT_CREDIT / (form.AMT_INCOME_TOTAL || 1);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm(f => ({ ...f, [name]: type === 'number' || type === 'range' ? parseFloat(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Convert positive age back to negative for the AI model
    const payload = { ...form, DAYS_BIRTH: -Math.abs(form.DAYS_BIRTH) };
    try {
      const [predRes, expRes] = await Promise.all([
        axios.post(`${API}/predict`, payload),
        axios.post(`${API}/explain`, payload)
      ]);
      const finalResult = expRes.data.rejection_reasons ? expRes.data : predRes.data;
      setResult(finalResult);
      setShap(expRes.data.shap_importance || []);
      setCfs(expRes.data.counterfactuals || null);
      setActiveTab('result');
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const runWhatIf = async () => {
    setSimulating(true);
    try {
      const res = await axios.post(`${API}/simulate_what_if`, form);
      setWhatIfProb(res.data);
    } catch (err) { console.error(err); }
    setSimulating(false);
  };

  const approved = result ? result.approved : null;
  const rawProb = result?.default_probability ?? result?.probability ?? 0.5;
  const riskPct = result ? (rawProb * 100).toFixed(1) : null;
  const approvalPct = result ? ((1 - rawProb) * 100).toFixed(1) : null;

  const shapChartData = shap.map(s => ({
    name: s.feature.replace('AMT_', '').replace('EXT_SOURCE', 'EXT').substring(0, 14),
    full: s.feature,
    value: parseFloat(s.value.toFixed(4)),
    abs: Math.abs(s.value)
  }));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">The Applicant</h1>
        <p className="page-subtitle">Submit your application, understand your decision, and explore your path to approval.</p>
        <span className="page-tag">🧠 Counterfactual Dashboard · What-If Simulator</span>
      </div>

      {/* Tab bar */}
      <div className="tab-row">
        {['form', 'result', 'whatif'].map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'form' ? '📋 Application' : t === 'result' ? '📊 Decision' : '🔮 What-If Simulator'}
          </button>
        ))}
      </div>

      {/* ── APPLICATION FORM ── */}
      {activeTab === 'form' && (
        <div className="grid-2">
          <div className="glass-card">
            <h2>Loan Application</h2>
            <p className="card-subtitle">All fields are required for an accurate assessment.</p>
            <form onSubmit={handleSubmit}>
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">🔒 Age (Days from birth) <span className="boundary-badge locked">Locked</span></label>
                  <input type="number" name="DAYS_BIRTH" value={form.DAYS_BIRTH} onChange={handleChange} className="form-input" min="1" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>≈ {age} years old</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select name="CODE_GENDER" value={form.CODE_GENDER} onChange={handleChange} className="form-select">
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">✏️ Annual Income ($) <span className="boundary-badge editable">Editable</span></label>
                  <input type="number" name="AMT_INCOME_TOTAL" value={form.AMT_INCOME_TOTAL} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">✏️ Requested Credit ($) <span className="boundary-badge editable">Editable</span></label>
                  <input type="number" name="AMT_CREDIT" value={form.AMT_CREDIT} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Education Level</label>
                  <select name="NAME_EDUCATION_TYPE" value={form.NAME_EDUCATION_TYPE} onChange={handleChange} className="form-select">
                    <option>Secondary</option>
                    <option>Higher education</option>
                    <option>Incomplete higher</option>
                    <option>Lower secondary</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ZIP Code (Area ID)</label>
                  <select name="ZIP_CODE" value={form.ZIP_CODE} onChange={handleChange} className="form-select">
                    <option>10001</option><option>10002</option><option>10003</option>
                    <option>90001</option><option>60601</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">External Credit Score 1 — {form.EXT_SOURCE_1.toFixed(2)}</label>
                <input type="range" name="EXT_SOURCE_1" min="0" max="1" step="0.01" value={form.EXT_SOURCE_1} onChange={handleChange} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">External Credit Score 2 — {form.EXT_SOURCE_2.toFixed(2)}</label>
                <input type="range" name="EXT_SOURCE_2" min="0" max="1" step="0.01" value={form.EXT_SOURCE_2} onChange={handleChange} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">External Credit Score 3 — {form.EXT_SOURCE_3.toFixed(2)}</label>
                <input type="range" name="EXT_SOURCE_3" min="0" max="1" step="0.01" value={form.EXT_SOURCE_3} onChange={handleChange} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? '⚙️ Processing...' : '🚀 Submit Application'}
              </button>
            </form>
          </div>

          {/* Live indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass-card">
              <h2>📐 Live Indicators</h2>
              <p className="card-subtitle">Updates as you fill the form.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span className="form-label">Debt-to-Income Ratio</span>
                    <span style={{ fontWeight: 700, color: dti > 3 ? 'var(--danger)' : dti > 2 ? 'var(--warning)' : 'var(--success)' }}>
                      {dti.toFixed(2)}x {dti > 3 ? '⚠️' : '✓'}
                    </span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-track-fill" style={{ width: `${Math.min(dti / 5 * 100, 100)}%`, background: dti > 3 ? 'var(--danger)' : dti > 2 ? 'var(--warning)' : 'var(--success)' }} />
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Threshold: ≤ 3.0x recommended</p>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span className="form-label">Avg. Credit Score</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {(((form.EXT_SOURCE_1 + form.EXT_SOURCE_2 + form.EXT_SOURCE_3) / 3) * 100).toFixed(0)}/100
                    </span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-track-fill" style={{ width: `${((form.EXT_SOURCE_1 + form.EXT_SOURCE_2 + form.EXT_SOURCE_3) / 3) * 100}%`, background: 'var(--accent-gradient)' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span className="form-label">Income-to-Credit Coverage</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {((form.AMT_INCOME_TOTAL / (form.AMT_CREDIT || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-track-fill" style={{ width: `${Math.min((form.AMT_INCOME_TOTAL / (form.AMT_CREDIT || 1)) * 100, 100)}%`, background: 'linear-gradient(90deg, #3b82f6, #14b8a6)' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.06))' }}>
              <h2>🛡️ Fairness Guarantee</h2>
              <p className="card-subtitle">Your application is protected by the Unbiased AI Decision framework.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {['Gender-neutral scoring enforced', 'Age-blind credit assessment', 'ZIP code proxy detection active', 'Full SHAP explanation generated'].map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--success)' }}>✓</span> {g}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DECISION RESULT ── */}
      {activeTab === 'result' && (
        <div>
          {!result ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Submit your application first to see the decision.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Decision banner */}
              <div className="glass-card" style={{
                background: approved ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))' : 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))',
                border: `1px solid ${approved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {result.status || 'AI Decision'}
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: approved ? 'var(--success)' : 'var(--danger)', marginTop: '0.25rem' }}>
                      {approved ? '✅ APPROVED' : '❌ REJECTED'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Default Risk Score</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>{riskPct}%</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Approval Probability: {approvalPct}%</div>
                  </div>
                </div>

                {result.rejection_reasons && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>🚩 Hard Rejection Reasons:</div>
                    {result.rejection_reasons.map((reason, idx) => (
                      <div key={idx} style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>• {reason}</div>
                    ))}
                  </div>
                )}

                <div className="bar-track" style={{ height: '10px', marginTop: '1rem' }}>
                  <div className="bar-track-fill" style={{ width: `${approvalPct}%`, background: approved ? 'var(--success)' : 'var(--danger)' }} />
                </div>
              </div>

              <div className="grid-2">
                {/* SHAP Feature Importance */}
                <div className="glass-card">
                  <h2>🔍 Feature Importance (SHAP)</h2>
                  <p className="card-subtitle">Factors that pushed the decision toward or away from approval.</p>
                  <div style={{ height: '280px' }}>
                    {shapChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={shapChartData} layout="vertical" margin={{ top: 4, right: 30, left: 50, bottom: 4 }}>
                        <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={v => v.toFixed(2)} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={90} />
                        <ReferenceLine x={0} stroke="rgba(148,163,184,0.4)" strokeWidth={1.5} />
                        <Tooltip
                          contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '0.8rem', color: '#e2e8f0' }}
                          formatter={(val, _, p) => [`${val > 0 ? '+' : ''}${val.toFixed(4)} (→ ${val > 0 ? 'Reject' : 'Approve'})`, p.payload.full]}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {shapChartData.map((e, i) => (
                            <Cell key={`cell-${i}`} fill={e.value > 0 ? '#ef4444' : '#10b981'} fillOpacity={0.85} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                        Feature importance is only generated for applications that pass basic safety guardrails.
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--danger)' }}>■ Pushes → Reject</span>
                    <span style={{ color: 'var(--success)' }}>■ Pushes → Approve</span>
                  </div>
                  {/* Reason chips */}
                  <div style={{ marginTop: '1rem' }}>
                    {shap.slice(0, 6).map((s, i) => (
                      <span key={i} className={`reason-chip ${s.value > 0 ? 'negative' : 'positive'}`}>
                        {s.value > 0 ? '↓' : '↑'} {s.feature.replace('AMT_', '').replace('EXT_SOURCE', 'EXT').substring(0, 16)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Counterfactuals */}
                <div className="glass-card">
                  <h2>🗺️ Path to Approval</h2>
                  <p className="card-subtitle">Counterfactual scenarios — what would need to change for approval?</p>
                  {approved ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--success)' }}>
                      <div style={{ fontSize: '2rem' }}>🎉</div>
                      <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>Already Approved — No changes needed.</p>
                    </div>
                  ) : result?.rejection_reasons ? (
                    <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <p>Counterfactual paths are unavailable for applications with <strong>Hard Guardrail</strong> violations.</p>
                      <p style={{ marginTop: '0.5rem' }}>Please address the safety issues (Age, Income, or DTI) and re-submit.</p>
                    </div>
                  ) : cfs?.paths?.length > 0 ? (
                    cfs.paths.map((p, i) => (
                      <div key={i} className="cf-path">
                        <div className="cf-path-icon">{p.icon || '💡'}</div>
                        <div className="cf-path-body">
                          <p className="cf-path-action">{p.action}</p>
                          <p className="cf-path-impact">
                            Risk drops by {p.probability_change}% → New risk: {(p.new_probability * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No counterfactuals available.</p>
                  )}

                  {/* Regulation note */}
                  <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: 'rgba(59,130,246,0.08)', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--info)' }}>
                    📜 <strong style={{ color: 'var(--text-primary)' }}>ECOA / Reg B:</strong> You have the right to a specific, accurate reason for this decision. This report satisfies that requirement.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WHAT-IF SIMULATOR ── */}
      {activeTab === 'whatif' && (
        <div className="grid-2">
          <div className="glass-card">
            <h2>🔮 What-If Simulator</h2>
            <p className="card-subtitle">Adjust sliders in real-time to see how changes affect your approval probability.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              {[
                { key: 'AMT_INCOME_TOTAL', label: '💰 Annual Income', min: 10000, max: 300000, step: 1000, fmt: v => `$${v.toLocaleString()}` },
                { key: 'AMT_CREDIT', label: '💳 Requested Credit', min: 10000, max: 500000, step: 1000, fmt: v => `$${v.toLocaleString()}` },
                { key: 'EXT_SOURCE_1', label: '⭐ Credit Score 1', min: 0, max: 1, step: 0.01, fmt: v => v.toFixed(2) },
                { key: 'EXT_SOURCE_2', label: '⭐ Credit Score 2', min: 0, max: 1, step: 0.01, fmt: v => v.toFixed(2) },
                { key: 'EXT_SOURCE_3', label: '⭐ Credit Score 3', min: 0, max: 1, step: 0.01, fmt: v => v.toFixed(2) },
              ].map(({ key, label, min, max, step, fmt }) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label className="form-label">{label}</label>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{fmt(form[key])}</span>
                  </div>
                  <input type="range" name={key} min={min} max={max} step={step} value={form[key]} onChange={handleChange} />
                </div>
              ))}
              <button className="btn-primary" onClick={runWhatIf} disabled={simulating} style={{ marginTop: '0.5rem' }}>
                {simulating ? '⚙️ Simulating...' : '▶ Run Simulation'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {whatIfProb ? (
              <>
                <div className="glass-card" style={{
                  textAlign: 'center',
                  background: whatIfProb.decision === 'Approve' ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))' : 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))',
                  border: `1px solid ${whatIfProb.decision === 'Approve' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Simulated Decision</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: whatIfProb.decision === 'Approve' ? 'var(--success)' : 'var(--danger)', margin: '0.5rem 0' }}>
                    {whatIfProb.decision === 'Approve' ? '✅ WOULD BE APPROVED' : '❌ WOULD BE REJECTED'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '0.5rem' }}>
                    <div><div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{(whatIfProb.approval_probability * 100).toFixed(1)}%</div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Approval Prob.</div></div>
                    <div><div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)' }}>{(whatIfProb.default_probability * 100).toFixed(1)}%</div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Default Risk</div></div>
                  </div>
                  <div className="bar-track" style={{ height: '10px', marginTop: '1rem' }}>
                    <div className="bar-track-fill" style={{ width: `${whatIfProb.approval_probability * 100}%`, background: 'var(--success)' }} />
                  </div>
                </div>

                <div className="glass-card">
                  <h2>Top Influencing Factors</h2>
                  {(whatIfProb.shap_summary || []).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem' }}>
                      <span style={{ fontSize: '0.8rem', width: '110px', color: 'var(--text-secondary)' }}>{s.feature.substring(0, 14)}</span>
                      <div className="bar-track" style={{ flex: 1 }}>
                        <div className="bar-track-fill" style={{ width: `${Math.min(Math.abs(s.value) * 300, 100)}%`, background: s.value > 0 ? 'var(--danger)' : 'var(--success)' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: s.value > 0 ? 'var(--danger)' : 'var(--success)', width: '50px', textAlign: 'right' }}>{s.value > 0 ? '+' : ''}{s.value.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem' }}>🔮</div>
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Adjust the sliders and click "Run Simulation" to see the impact on your approval probability in real-time.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantView;
