import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import API from '../config';

const SAMPLE = {
  DAYS_BIRTH: -15000, CODE_GENDER: 'F', AMT_INCOME_TOTAL: 60000,
  AMT_CREDIT: 200000, ZIP_CODE: '10002', NAME_EDUCATION_TYPE: 'Higher education',
  EXT_SOURCE_1: 0.35, EXT_SOURCE_2: 0.28, EXT_SOURCE_3: 0.3
};

const AGENT_ACTIONS = [
  { icon: '📧', title: 'Request Income Documentation', desc: 'Autonomously email applicant to submit latest pay stubs and tax returns.', status: 'pending' },
  { icon: '🔍', title: 'Initiate Third-Party Credit Verification', desc: 'Trigger EXT_SOURCE_2 refresh via bureau API to get updated score.', status: 'pending' },
  { icon: '⚖️', title: 'Flag for Manual Review', desc: 'Escalate borderline case (risk 45–65%) to senior underwriter queue.', status: 'done' },
  { icon: '🗂️', title: 'Run Document Completeness Check', desc: 'Verify all required KYC documents are uploaded and OCR-validated.', status: 'done' },
];

const UnderwriterView = () => {
  const [shap, setShap] = useState([]);
  const [stress, setStress] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [loadingXai, setLoadingXai] = useState(true);
  const [loadingStress, setLoadingStress] = useState(true);
  const [loadingNarrative, setLoadingNarrative] = useState(true);
  const [errXai, setErrXai] = useState(null);
  const [errStress, setErrStress] = useState(null);
  const [errNarrative, setErrNarrative] = useState(null);
  const [activeTab, setActiveTab] = useState('xai');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    // ── Fetch SHAP explanation independently ──
    setLoadingXai(true); setErrXai(null);
    try {
      const res = await axios.post(`${API}/explain`, SAMPLE);
      setShap(res.data.shap_importance || []);
    } catch (e) {
      setErrXai('Could not load SHAP data. Backend may be waking up.');
    }
    setLoadingXai(false);

    // ── Fetch stress test independently ──
    setLoadingStress(true); setErrStress(null);
    try {
      const res = await axios.post(`${API}/stress_test`, SAMPLE);
      setStress(res.data);
    } catch (e) {
      setErrStress('Stress test endpoint unavailable.');
    }
    setLoadingStress(false);

    // ── Fetch narrative independently ──
    setLoadingNarrative(true); setErrNarrative(null);
    try {
      const res = await axios.post(`${API}/explain/narrative`, SAMPLE);
      setNarrative(res.data);
    } catch (e) {
      setErrNarrative('Narrative endpoint unavailable.');
    }
    setLoadingNarrative(false);
  };

  const chartData = shap.map(s => ({
    name: s.feature.replace('AMT_', '').replace('EXT_SOURCE', 'EXT').substring(0, 14),
    full: s.feature,
    value: parseFloat(s.value.toFixed(4)),
  }));

  const waterfallData = shap.slice(0, 8).map(s => ({
    name: s.feature.replace('AMT_', '').replace('EXT_SOURCE', 'EXT').substring(0, 14),
    value: parseFloat(s.value.toFixed(4)),
    abs: Math.abs(s.value),
  }));

  const stablePct = stress ? (stress.Stability_Score * 100).toFixed(0) : 0;
  const stableColor = stress?.Status === 'Stable' ? 'var(--success)' : stress?.Status === 'Borderline' ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">The Underwriter</h1>
        <p className="page-subtitle">AI-powered analysis with generative narratives and agentic workflow automation.</p>
        <span className="page-tag">🤖 Agentic AI · SHAP Force Plot · Data Narratives</span>
      </div>

      <div className="tab-row">
        {['xai', 'narrative', 'stress', 'agent'].map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'xai' ? '📊 XAI Analysis' : t === 'narrative' ? '🗣️ AI Narrative' : t === 'stress' ? '⚡ Stress Test' : '🤖 Agentic Actions'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={fetchAll} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>🔄 Refresh Data</button>
      </div>

      {/* ── XAI ANALYSIS ── */}
      {activeTab === 'xai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loadingXai && <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>⚙️ Loading SHAP Analysis...</div>}
          {errXai && <div className="glass-card" style={{ color: 'var(--warning)', padding: '1rem' }}>⚠️ {errXai}</div>}
          {!loadingXai && !errXai && shap.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="grid-2">
                <div className="glass-card">
                  <h2>🔍 Local SHAP Explanation</h2>
                  <div style={{ height: '300px', marginTop: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical">
                        <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} />
                        <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} width={100} />
                        <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                        <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="value">
                          {chartData.map((e, i) => <Cell key={i} fill={e.value > 0 ? '#ef4444' : '#10b981'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="glass-card">
                  <h2>⚡ SHAP Force Plot</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
                    {waterfallData.map((d, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                          <span style={{ color: d.value > 0 ? 'var(--danger)' : 'var(--success)' }}>{d.value > 0 ? '+' : ''}{d.value.toFixed(4)}</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(Math.abs(d.value)*200, 100)}%`, height: '100%', background: d.value > 0 ? '#ef4444' : '#10b981' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="glass-card">
                <h2>📋 Decision Factor Summary</h2>
                <div className="grid-2" style={{ marginTop: '1rem', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>Factors Pushing Toward Rejection</h3>
                    {shap.filter(s => s.value > 0).slice(0, 3).map((s, i) => (
                      <div key={i} style={{ background: 'rgba(239,68,68,0.05)', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.4rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{s.feature.substring(0, 20)}</span>
                        <strong>+{s.value.toFixed(3)}</strong>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--success)', marginBottom: '0.5rem' }}>Factors Supporting Approval</h3>
                    {shap.filter(s => s.value < 0).slice(0, 3).map((s, i) => (
                      <div key={i} style={{ background: 'rgba(16,185,129,0.05)', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.4rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{s.feature.substring(0, 20)}</span>
                        <strong>{s.value.toFixed(3)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AI NARRATIVE ── */}
      {activeTab === 'narrative' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loadingNarrative && <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>🗣️ Generating AI Narrative...</div>}
          {errNarrative && <div className="glass-card" style={{ color: 'var(--warning)', padding: '1rem' }}>⚠️ {errNarrative}</div>}
          {!loadingNarrative && !errNarrative && narrative && (
            <>
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>🗣️ Generative AI Narrative</h2>
                  <span className="badge info">{narrative.narrative_source}</span>
                </div>
                <div className="narrative-card" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {narrative.narrative}
                </div>
              </div>
              <div className="grid-2">
                <div className="glass-card">
                  <h3>⚠️ Risk Factors</h3>
                  {(narrative.top_reject_factors || []).map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span>{f.feature}</span>
                      <span className="badge danger">+{f.impact.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="glass-card">
                  <h3>✅ Mitigating Factors</h3>
                  {(narrative.top_approve_factors || []).map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span>{f.feature}</span>
                      <span className="badge success">-{f.impact.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STRESS TEST ── */}
      {activeTab === 'stress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loadingStress && <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>⚡ Running Stress Test...</div>}
          {errStress && <div className="glass-card" style={{ color: 'var(--warning)', padding: '1rem' }}>⚠️ {errStress}</div>}
          {!loadingStress && !errStress && stress && (
            <div className="grid-2">
              <div className="glass-card">
                <h2>⚡ Adversarial Stability</h2>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '4rem', fontWeight: 800, color: stableColor }}>{stablePct}%</div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Decision Stability</div>
                  <div className={`badge ${stress.Status === 'Stable' ? 'success' : 'danger'}`} style={{ marginTop: '1rem' }}>{stress.Status}</div>
                </div>
                <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${stablePct}%`, height: '100%', background: stableColor }} />
                </div>
              </div>
              <div className="glass-card">
                <h2>📐 Robustness Summary</h2>
                <p style={{ marginTop: '1rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {stress.Message || `Model stability is ${stablePct}%. This indicates how consistent the decision remains when small amounts of noise are injected into the input data.`}
                </p>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
                  <div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stress.Tests}</div><div>Total Tests</div></div>
                  <div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{stress.Flips}</div><div>Decision Flips</div></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AGENTIC ACTIONS ── */}
      {activeTab === 'agent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <h2>🤖 Agentic Workflow Queue</h2>
            <div style={{ marginTop: '1.5rem' }}>
              {AGENT_ACTIONS.map((a, i) => (
                <div key={i} className="agent-action" style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{a.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.desc}</div>
                  </div>
                  <div className={`badge ${a.status === 'done' ? 'success' : 'info'}`}>{a.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnderwriterView;
