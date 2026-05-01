import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import API from '../config';
const TT_STYLE = { background: 'rgba(10,12,20,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '0.8rem' };

const RegulatorView = () => {
  const [metrics, setMetrics] = useState(null);
  const [proxies, setProxies] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erasureIdx, setErasureIdx] = useState(10);
  const [erasureMsg, setErasureMsg] = useState('');
  const [activeTab, setActiveTab] = useState('portfolio');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mRes, pRes, portRes] = await Promise.all([
        axios.get(`${API}/bias_metrics`),
        axios.get(`${API}/proxy_hunter`),
        axios.get(`${API}/portfolio/history`),
      ]);
      setMetrics(mRes.data);
      setProxies(pRes.data);
      setPortfolio(portRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleErasure = async () => {
    try {
      const res = await axios.post(`${API}/compliance/erasure/${erasureIdx}`);
      setErasureMsg(res.data.Message || 'Data erased successfully.');
    } catch { setErasureMsg('Erasure failed.'); }
  };

  const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">The Regulator</h1>
        <p className="page-subtitle">Portfolio analytics, bias auditing, proxy detection, and DPDP Act 2023 compliance.</p>
        <span className="page-tag">📊 Portfolio Dashboard · ⚖️ Fair Lending · 🔍 Proxy Hunter</span>
      </div>

      <div className="tab-row">
        {['portfolio', 'bias', 'proxy', 'compliance'].map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'portfolio' ? '📊 Portfolio' : t === 'bias' ? '⚖️ Bias Audit' : t === 'proxy' ? '🔍 Proxy Hunter' : '🏛️ Compliance'}
          </button>
        ))}
      </div>

      {loading && <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>⚙️ Loading regulatory data...</div>}

      {/* ── PORTFOLIO DASHBOARD ── */}
      {!loading && activeTab === 'portfolio' && portfolio && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI Cards */}
          <div className="grid-4">
            {[
              { icon: '📋', label: 'Total Applications', value: portfolio.kpis.total_applications.toLocaleString(), sub: 'Last 12 months' },
              { icon: '✅', label: 'Approval Rate', value: `${portfolio.kpis.overall_approval_rate}%`, sub: `${portfolio.kpis.total_approved.toLocaleString()} approved` },
              { icon: '💰', label: 'Total Funded', value: `$${(portfolio.kpis.total_funded_m / 1000).toFixed(1)}B`, sub: 'Across all regions' },
              { icon: '⚡', label: 'Avg. Decision Time', value: `${portfolio.kpis.avg_decision_time_ms}ms`, sub: `STP Rate: ${portfolio.kpis.straight_through_processing_rate}%` },
            ].map((k, i) => (
              <div key={i} className="kpi-card">
                <div className="kpi-icon">{k.icon}</div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value">{k.value}</div>
                <div className="kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Timeline + Donut */}
          <div className="grid-2">
            <div className="glass-card">
              <h2>📈 Approval Trend (12 Months)</h2>
              <p className="card-subtitle">Monthly approved vs rejected applications.</p>
              <div style={{ height: '240px', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portfolio.timeline} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
                    <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={10} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                    <Bar dataKey="approved" name="Approved" fill="#10b981" fillOpacity={0.85} radius={[3,3,0,0]} />
                    <Bar dataKey="rejected" name="Rejected" fill="#ef4444" fillOpacity={0.7} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card">
              <h2>🍩 Portfolio Status</h2>
              <p className="card-subtitle">Distribution of loan outcomes across the full portfolio.</p>
              <div style={{ height: '240px', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={portfolio.portfolio_status} dataKey="percentage" nameKey="status" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3}>
                      {portfolio.portfolio_status.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} fillOpacity={0.85} />)}
                    </Pie>
                    <Tooltip contentStyle={TT_STYLE} formatter={(v) => `${v}%`} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Funding Line + Credit Bands */}
          <div className="grid-2">
            <div className="glass-card">
              <h2>💵 Monthly Funded Amount</h2>
              <p className="card-subtitle">Total disbursement trend (in $M).</p>
              <div style={{ height: '200px', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={portfolio.timeline} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
                    <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={10} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v) => [`$${v.toFixed(0)}M`, 'Funded']} />
                    <Line type="monotone" dataKey="funded_amount_m" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card">
              <h2>📊 Approval by Credit Score Band</h2>
              <p className="card-subtitle">Approval rates across FICO score ranges.</p>
              <div style={{ height: '200px', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portfolio.credit_score_bands} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
                    <XAxis dataKey="band" stroke="var(--text-secondary)" fontSize={10} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <Bar dataKey="approved" name="Approved" fill="#10b981" fillOpacity={0.8} radius={[3,3,0,0]} />
                    <Bar dataKey="rejected" name="Rejected" fill="#ef4444" fillOpacity={0.7} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Regional */}
          <div className="glass-card">
            <h2>🗺️ Regional Distribution</h2>
            <p className="card-subtitle">Loan approvals and funded amounts by region.</p>
            <table className="data-table" style={{ marginTop: '0.75rem' }}>
              <thead><tr><th>Region</th><th>Approved</th><th>Rejected</th><th>Approval Rate</th><th>Funded ($M)</th><th>Status</th></tr></thead>
              <tbody>
                {portfolio.regional_data.map((r, i) => {
                  const rate = ((r.approved / (r.approved + r.rejected)) * 100).toFixed(1);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>📍 {r.region}</td>
                      <td style={{ color: 'var(--success)' }}>{r.approved.toLocaleString()}</td>
                      <td style={{ color: 'var(--danger)' }}>{r.rejected.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="bar-track" style={{ width: '60px' }}>
                            <div className="bar-track-fill" style={{ width: `${rate}%`, background: parseFloat(rate) > 75 ? 'var(--success)' : 'var(--warning)' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem' }}>{rate}%</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>${(r.funded_m / 1000).toFixed(1)}B</td>
                      <td><span className={`badge ${parseFloat(rate) > 75 ? 'success' : 'warning'}`}>{parseFloat(rate) > 75 ? 'Strong' : 'Monitor'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BIAS AUDIT ── */}
      {!loading && activeTab === 'bias' && metrics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Metrics Grid */}
          <div className="grid-4">
            {[
              { label: 'Gender DI', value: metrics.Gender_Disparate_Impact.toFixed(3), ok: metrics.Gender_Disparate_Impact >= 0.8 },
              { label: 'Age DI', value: metrics.Age_Disparate_Impact.toFixed(3), ok: metrics.Age_Disparate_Impact >= 0.8 },
              { label: 'Theil Index', value: metrics.Theil_Index.toFixed(4), ok: Math.abs(metrics.Theil_Index) < 0.05 },
              { label: 'Eq. Odds Diff', value: metrics.Equalized_Odds_Diff.toFixed(3), ok: metrics.Equalized_Odds_Diff < 0.1 },
            ].map((m, i) => (
              <div key={i} className="kpi-card" style={{ border: `1px solid ${m.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                <div className="kpi-label">{m.label}</div>
                <div className="kpi-value" style={{ backgroundImage: m.ok ? 'linear-gradient(135deg,#10b981,#34d399)' : 'linear-gradient(135deg,#ef4444,#f87171)' }}>{m.value}</div>
                <span className={`badge ${m.ok ? 'success' : 'danger'}`} style={{ marginTop: '0.5rem' }}>{m.ok ? '✓ PASS' : '✗ ALERT'}</span>
              </div>
            ))}
          </div>

          {/* DI Bars */}
          <div className="grid-2">
            <div className="glass-card">
              <h2>⚖️ Disparate Impact Analysis</h2>
              <p className="card-subtitle">DI &lt; 0.8 indicates potential discrimination. Gender and Age groups.</p>
              {[
                { label: 'Gender DI (Female vs Male)', val: metrics.Gender_Disparate_Impact, spd: metrics.Gender_SPD },
                { label: 'Age DI (Older vs Younger)', val: metrics.Age_Disparate_Impact, spd: metrics.Age_SPD },
                { label: 'TPR — Male', val: metrics.TPR_Male, spd: null },
                { label: 'TPR — Female', val: metrics.TPR_Female, spd: null },
              ].map((r, i) => (
                <div key={i} style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    <span>{r.label}</span>
                    <span style={{ fontWeight: 700, color: r.val < 0.8 ? 'var(--danger)' : 'var(--success)' }}>{r.val.toFixed(3)}</span>
                  </div>
                  <div className="bar-track" style={{ height: '10px' }}>
                    <div className="bar-track-fill" style={{ width: `${Math.min(r.val * 100, 100)}%`, background: r.val < 0.8 ? 'var(--danger)' : 'var(--success)' }} />
                  </div>
                  {r.spd !== null && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>SPD: {r.spd.toFixed(4)} {Math.abs(r.spd) > 0.1 ? '⚠️' : '✓'}</div>}
                </div>
              ))}
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.07)', borderLeft: '3px solid var(--danger)', borderRadius: '0 8px 8px 0', fontSize: '0.8rem' }}>
                ⚠️ {metrics.Warning}
              </div>
            </div>

            {/* Active Mitigation - LDA */}
            <div className="glass-card">
              <h2>🛠️ Active Mitigation (LDA)</h2>
              <p className="card-subtitle">Less Discriminatory Alternatives suggested by the engine — not just detection, but fixes.</p>
              {(metrics.LDA_Suggestions || []).map((lda, i) => (
                <div key={i} style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 600, marginBottom: '0.4rem' }}>Issue: {lda.issue}</div>
                  <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>💡 {lda.lda}</div>
                  {lda.estimated_new_di && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--success)' }}>
                      Estimated DI after mitigation: <strong>{lda.estimated_new_di}</strong> {lda.estimated_new_di >= 0.8 ? '✅' : '⚠️'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Heartbeat */}
          <div className="glass-card">
            <h2>💓 Data Heartbeat (Missingno Matrix)</h2>
            <p className="card-subtitle">Real-time monitoring of data feeds. Failed feeds cause model collapse and erratic decisions.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              {(metrics.Data_Heartbeat || []).map((feed, i) => (
                <div key={i} className="heartbeat-row">
                  <div className={`heartbeat-dot ${feed.status}`} />
                  <span className="heartbeat-name">{feed.feed}</span>
                  <div className="bar-track" style={{ width: '120px', height: '6px' }}>
                    <div className="bar-track-fill" style={{ width: `${feed.completeness}%`, background: feed.status === 'healthy' ? 'var(--success)' : feed.status === 'warning' ? 'var(--warning)' : 'var(--danger)' }} />
                  </div>
                  <span className="heartbeat-pct">{feed.completeness}%</span>
                  <span className={`badge ${feed.status === 'healthy' ? 'success' : feed.status === 'warning' ? 'warning' : 'danger'}`} style={{ fontSize: '0.7rem' }}>
                    {feed.status === 'healthy' ? '✓ OK' : feed.status === 'warning' ? '⚠ Slow' : '✗ DOWN'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '100px', textAlign: 'right' }}>Last: {feed.last_update}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROXY HUNTER ── */}
      {!loading && activeTab === 'proxy' && proxies && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary */}
          <div className="grid-4">
            {[
              { icon: '🔬', label: 'Features Scanned', value: proxies.summary.total_features_scanned },
              { icon: '🚨', label: 'High Risk Proxies', value: proxies.summary.high_risk_count, danger: true },
              { icon: '⚠️', label: 'Moderate Risk', value: proxies.summary.moderate_risk_count, warn: true },
              { icon: '🏅', label: 'Avg Integrity Score', value: `${proxies.summary.average_proxy_integrity_score}` },
            ].map((s, i) => (
              <div key={i} className="kpi-card" style={{ border: s.danger ? '1px solid rgba(239,68,68,0.25)' : s.warn ? '1px solid rgba(245,158,11,0.25)' : '1px solid var(--glass-border)' }}>
                <div className="kpi-icon">{s.icon}</div>
                <div className="kpi-label">{s.label}</div>
                <div className="kpi-value" style={{ backgroundImage: s.danger ? 'linear-gradient(135deg,#ef4444,#f87171)' : s.warn ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : undefined }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="glass-card">
            <h2>🔍 Proxy Integrity Analysis</h2>
            <p className="card-subtitle">Variables that lose predictive power when conditioned on demographic attributes are flagged as proxies for protected characteristics.</p>
            <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
              <table className="data-table">
                <thead><tr><th>Feature</th><th>Protected Attribute</th><th>Test Type</th><th>Correlation</th><th>Integrity Score</th><th>Flag</th><th>Recommendation</th></tr></thead>
                <tbody>
                  {(proxies.proxies || []).map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.Non_Sensitive_Feature}</td>
                      <td>{p.Protected_Attribute}</td>
                      <td><span className="badge info" style={{ fontSize: '0.7rem' }}>{p.Correlation_Type}</span></td>
                      <td style={{ fontWeight: 600 }}>{p.Value}</td>
                      <td>
                        <div className="proxy-score-bar">
                          <div className="bar-track" style={{ flex: 1, height: '8px' }}>
                            <div className="bar-track-fill" style={{ width: `${p.Proxy_Integrity_Score}%`, background: p.Proxy_Integrity_Score > 80 ? 'var(--success)' : p.Proxy_Integrity_Score > 60 ? 'var(--warning)' : 'var(--danger)' }} />
                          </div>
                          <span className="proxy-score-num" style={{ color: p.Proxy_Integrity_Score > 80 ? 'var(--success)' : p.Proxy_Integrity_Score > 60 ? 'var(--warning)' : 'var(--danger)' }}>{p.Proxy_Integrity_Score}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${p.Flag.includes('High') ? 'danger' : p.Flag.includes('Moderate') ? 'warning' : 'success'}`} style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{p.Flag}</span></td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '220px' }}>{p.Recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPLIANCE ── */}
      {!loading && activeTab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-2">
            <div className="glass-card">
              <h2>🗑️ Right to Erasure (DPDP 2023)</h2>
              <p className="card-subtitle">Simulate deletion of a data principal's records as required under the Digital Personal Data Protection Act.</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <input type="number" value={erasureIdx} onChange={e => setErasureIdx(e.target.value)} className="form-input" style={{ width: '120px' }} placeholder="User ID" />
                <button onClick={handleErasure} className="btn-primary" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}>🗑️ Erase Data</button>
              </div>
              {erasureMsg && <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--success)' }}>✅ {erasureMsg}</div>}
            </div>

            <div className="glass-card">
              <h2>🔒 Purpose Limitation Check</h2>
              <p className="card-subtitle">Verifying protected attributes are not consumed by marketing models.</p>
              {[
                { check: 'Credit model uses no protected attributes directly', status: true },
                { check: 'Marketing model segregated from lending data', status: true },
                { check: 'Proxy variable scan last run < 24 hours ago', status: true },
                { check: 'AML screening model isolated', status: true },
                { check: 'Fraud detection uses behavioral signals only', status: true },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem', marginTop: '0.6rem' }}>
                  <span style={{ color: c.status ? 'var(--success)' : 'var(--danger)' }}>{c.status ? '✓' : '✗'}</span>
                  <span>{c.check}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h2>📜 Regulatory Framework Compliance</h2>
            <p className="card-subtitle">Current compliance status against global AI lending regulations.</p>
            <table className="data-table" style={{ marginTop: '0.75rem' }}>
              <thead><tr><th>Regulation</th><th>Jurisdiction</th><th>Requirement</th><th>Status</th></tr></thead>
              <tbody>
                {[
                  { reg: 'ECOA / Reg B', jur: '🇺🇸 USA', req: 'Specific adverse action reasons required', ok: true },
                  { reg: 'EU AI Act', jur: '🇪🇺 EU', req: 'High-risk AI — strict data governance + human oversight', ok: true },
                  { reg: 'GDPR Art. 22', jur: '🇪🇺 EU', req: 'Right to explanation for automated decisions', ok: true },
                  { reg: 'FCRA', jur: '🇺🇸 USA', req: 'Credit score disclosures on adverse action', ok: true },
                  { reg: 'DPDP Act 2023', jur: '🇮🇳 India', req: 'Right to erasure, purpose limitation, consent', ok: true },
                  { reg: 'Fair Housing Act', jur: '🇺🇸 USA', req: 'No discrimination in mortgage lending', ok: true },
                ].map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.reg}</td>
                    <td>{r.jur}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{r.req}</td>
                    <td><span className={`badge ${r.ok ? 'success' : 'danger'}`}>{r.ok ? '✓ Compliant' : '✗ Gap'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegulatorView;
