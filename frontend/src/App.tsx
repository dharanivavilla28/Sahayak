import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, BookOpen, User, MessageSquare, Briefcase,
  Search, Send, X, ExternalLink, ChevronRight,
  CheckCircle, Star, Loader
} from "lucide-react";
import "./index.css";
import { fetchSchemes, fetchStates, checkEligibility, sendChatMessage } from "./api";

// ─── Types (inlined to avoid module resolution issues) ────────────────────────

type Gender = "male" | "female" | "all";

interface EligibilityCriteria {
  age_min: number | null;
  age_max: number | null;
  gender: Gender | null;
  income_required: boolean;
  income_limit: number | null;
  residency_required: boolean;
  residency_years: number | null;
  occupation: string[];
}

interface Scheme {
  id: string;
  name: string;
  category: "central" | "state";
  state: string | null;
  description: string;
  eligibility: EligibilityCriteria;
  benefits: string;
  source_url: string;
  application_link: string | null;
  icon: string;
}

interface Profile {
  id: string;
  name: string;
  state: string;
  age: number;
  gender: Gender;
  occupation: string[];
  income: number;
}

interface Application {
  id: string;
  schemeId: string;
  schemeName: string;
  status: "Opened" | "Applied" | "Wait" | "Reject";
  date: string;
  notes: string;
  applicationLink: string | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  message: string;
}

interface EligibilityResult {
  scheme: Scheme;
  match_score: number;
  eligible: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

const OCCUPATIONS = [
  "farmer","student","worker","self-employed","unemployed",
  "government employee","business","daily wager","artisan","fisherman"
];

const defaultProfile: Profile = {
  id: "user-1", name: "", state: "", age: 25, gender: "male", occupation: [], income: 0,
};

const statusColor: Record<string, string> = {
  "Opened": "badge-blue",
  "Applied": "badge-green",
  "Wait": "badge-saffron",
  "Reject": "badge-red",
};

function getMatchClass(score: number) {
  if (score >= 70) return "high";
  if (score >= 40) return "mid";
  return "low";
}

// ─── SchemeModal ──────────────────────────────────────────────────────────────

function SchemeModal({ scheme, onClose, onApply }: {
  scheme: Scheme; onClose: () => void; onApply: (s: Scheme) => void;
}) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 36 }}>{scheme.icon}</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{scheme.name}</h3>
              <div className="flex gap-2" style={{ marginTop: 6 }}>
                <span className={`badge ${scheme.category === "central" ? "badge-saffron" : "badge-blue"}`}>
                  {scheme.category === "central" ? "Central" : scheme.state}
                </span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>{scheme.description}</p>
          <div className="divider" />
          <h4 style={{ fontWeight: 700, marginBottom: 8, fontSize: 14, color: "var(--saffron)" }}>Benefits</h4>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 14, marginBottom: 20 }}>{scheme.benefits}</p>
          <div className="divider" />
          <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Eligibility Criteria</h4>
          <div className="grid-2" style={{ fontSize: 13 }}>
            {scheme.eligibility.age_min !== null && (
              <div><span style={{ color: "var(--text-muted)" }}>Min Age</span><br /><strong>{scheme.eligibility.age_min} yrs</strong></div>
            )}
            {scheme.eligibility.age_max !== null && (
              <div><span style={{ color: "var(--text-muted)" }}>Max Age</span><br /><strong>{scheme.eligibility.age_max} yrs</strong></div>
            )}
            {scheme.eligibility.gender && scheme.eligibility.gender !== "all" && (
              <div><span style={{ color: "var(--text-muted)" }}>Gender</span><br /><strong style={{ textTransform: "capitalize" }}>{scheme.eligibility.gender}</strong></div>
            )}
            {scheme.eligibility.income_limit && (
              <div><span style={{ color: "var(--text-muted)" }}>Income Limit</span><br /><strong>₹{scheme.eligibility.income_limit.toLocaleString("en-IN")}/yr</strong></div>
            )}
            {scheme.eligibility.occupation?.length > 0 && (
              <div style={{ gridColumn: "1/-1" }}>
                <span style={{ color: "var(--text-muted)" }}>Occupation</span><br />
                <strong style={{ textTransform: "capitalize" }}>{scheme.eligibility.occupation.join(", ")}</strong>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <a href={scheme.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            <ExternalLink size={14} /> Source
          </a>
          <button className="btn btn-success btn-sm" onClick={() => onApply(scheme)}>
            <CheckCircle size={14} /> Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page: Home ───────────────────────────────────────────────────────────────

function HomePage({ profile, onNavigate }: { profile: Profile; onNavigate: (p: string) => void }) {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [eligibleCount, setEligibleCount] = useState(0);

  useEffect(() => { fetchSchemes().then(setSchemes); }, []);

  useEffect(() => {
    if (profile.name && profile.state) {
      checkEligibility(profile).then((res: EligibilityResult[]) =>
        setEligibleCount(res.filter(r => r.eligible).length)
      );
    }
  }, [profile]);

  return (
    <>
      <div className="hero">
        <div className="tricolor-bar" style={{ maxWidth: 80 }} />
        <h1 className="hero-title">
          Your Gateway to<br /><span>Indian Government Schemes</span>
        </h1>
        <p className="hero-subtitle">
          Discover welfare programmes you are eligible for — from agriculture, education, health, housing and more. Powered by AI.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => onNavigate("schemes")}>
            <BookOpen size={16} /> Browse Schemes
          </button>
          <button className="btn btn-ghost" onClick={() => onNavigate("chatbot")}>
            <MessageSquare size={16} /> Ask Sahayak AI
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="grid-4" style={{ marginBottom: 32 }}>
          {[
            { cls: "orange", icon: "🏛️", num: `${schemes.length}+`, label: "Total Schemes", iconBg: "rgba(255,153,51,0.15)", iconClr: "var(--saffron)" },
            { cls: "green",  icon: "✅", num: eligibleCount.toString(), label: "You're Eligible For", iconBg: "rgba(19,136,8,0.15)", iconClr: "#4ade80" },
            { cls: "blue",   icon: "🗺️", num: "28+", label: "States Covered", iconBg: "rgba(99,102,241,0.15)", iconClr: "#818cf8" },
            { cls: "purple", icon: "🤖", num: "AI",  label: "Powered Chatbot", iconBg: "rgba(147,51,234,0.15)", iconClr: "#c084fc" },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <div className="stat-icon" style={{ background: s.iconBg, color: s.iconClr }}>{s.icon}</div>
              <div className="stat-number">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="section-title">Popular Schemes</h2>
        <div className="grid-3">
          {schemes.slice(0, 6).map(s => (
            <div className="scheme-card" key={s.id} onClick={() => onNavigate("schemes")}>
              <div className="scheme-icon">{s.icon}</div>
              <div className="scheme-name">{s.name}</div>
              <p className="scheme-description">{s.description}</p>
              <div className="scheme-meta">
                <span className={`badge ${s.category === "central" ? "badge-saffron" : "badge-blue"}`}>
                  {s.category === "central" ? "Central" : s.state}
                </span>
              </div>
            </div>
          ))}
        </div>

        {!profile.name && (
          <div className="card" style={{ marginTop: 32, background: "linear-gradient(135deg,rgba(255,153,51,0.08),rgba(19,136,8,0.08))", borderColor: "rgba(255,153,51,0.2)" }}>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 32 }}>👤</span>
              <div>
                <strong>Set up your profile for personalised recommendations</strong>
                <p className="text-sm text-muted" style={{ marginTop: 4 }}>Add your age, state, occupation and income to see schemes you qualify for.</p>
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} onClick={() => onNavigate("profile")}>
                Set Up <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Page: Schemes ────────────────────────────────────────────────────────────

function SchemesPage({ profile, onAddApplication }: {
  profile: Profile; onAddApplication: (a: Application) => void;
}) {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [eligible, setEligible] = useState<EligibilityResult[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [view, setView] = useState<"all" | "eligible">("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Scheme | null>(null);
  const [states, setStates] = useState<string[]>([]);

  useEffect(() => { fetchStates().then(setStates); }, []);

  useEffect(() => {
    setLoading(true);
    fetchSchemes(query || undefined, stateFilter || undefined, category || undefined)
      .then(setSchemes).finally(() => setLoading(false));
  }, [query, stateFilter, category]);

  useEffect(() => {
    if (profile.name && profile.state) checkEligibility(profile).then(setEligible);
  }, [profile]);

  const displayed = view === "eligible" ? eligible : schemes.map(s => ({ scheme: s, match_score: null as number | null, eligible: false }));

  function handleApply(s: Scheme) {
    const app: Application = {
      id: Date.now().toString(), schemeId: s.id, schemeName: s.name,
      status: "Opened", date: new Date().toLocaleDateString("en-IN"), notes: "", applicationLink: s.application_link,
    };
    onAddApplication(app);
    if (s.application_link) window.open(s.application_link, "_blank");
    setSelected(null);
  }

  return (
    <>
      <div className="page-header">
        <h2>Government Schemes</h2>
        <p>Browse and discover welfare schemes you may qualify for</p>
      </div>
      <div className="page-body">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
            <Search className="search-icon" size={16} />
            <input className="search-input" placeholder="Search schemes…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <select className="input" style={{ width: 180 }} value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="filter-pills">
            {(["", "central", "state"] as const).map(c => (
              <button key={c} className={`pill ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
                {c === "" ? "All" : c === "central" ? "Central" : "State"}
              </button>
            ))}
          </div>
          {profile.name && (
            <div className="filter-pills">
              <button className={`pill ${view === "all" ? "active" : ""}`} onClick={() => setView("all")}>All</button>
              <button className={`pill ${view === "eligible" ? "active" : ""}`} onClick={() => setView("eligible")}>
                <Star size={12} /> For You
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🔍</div><p>No schemes found.</p></div>
        ) : (
          <div className="grid-3">
            {displayed.map(item => {
              const res = item as EligibilityResult;
              const s = res.scheme;
              const score = res.match_score;
              const elig = res.eligible;
              return (
                <div className="scheme-card" key={s.id} onClick={() => setSelected(s)}>
                  <div className="scheme-icon">{s.icon}</div>
                  <div className="scheme-name">{s.name}</div>
                  <p className="scheme-description">{s.description}</p>
                  <div className="scheme-meta">
                    <span className={`badge ${s.category === "central" ? "badge-saffron" : "badge-blue"}`}>
                      {s.category === "central" ? "Central" : s.state}
                    </span>
                    {elig && <span className="badge badge-green">✓ Eligible</span>}
                  </div>
                  {score !== null && (
                    <>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>Match: {score}%</div>
                      <div className="match-bar-bg">
                        <div className={`match-bar-fill ${getMatchClass(score)}`} style={{ width: `${score}%` }} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {selected && <SchemeModal scheme={selected} onClose={() => setSelected(null)} onApply={handleApply} />}
    </>
  );
}

// ─── Page: Profile ────────────────────────────────────────────────────────────

function ProfilePage({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Profile) => void }) {
  const [form, setForm] = useState<Profile>(profile);
  const [occInput, setOccInput] = useState("");
  const [saved, setSaved] = useState(false);

  function addOcc() {
    const v = occInput.trim().toLowerCase();
    if (v && !form.occupation.includes(v)) setForm({ ...form, occupation: [...form.occupation, v] });
    setOccInput("");
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <div className="page-header">
        <h2>My Profile</h2>
        <p>Complete your profile to get personalised scheme recommendations</p>
      </div>
      <div className="page-body">
        <div style={{ maxWidth: 680 }}>
          <form onSubmit={save}>
            <div className="card">
              {(!profile.name || !profile.state) && (
                <div style={{
                  background: "linear-gradient(135deg, rgba(255, 153, 51, 0.08), rgba(19, 136, 8, 0.08))",
                  border: "1px dashed var(--saffron)",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  marginBottom: "24px",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <span style={{ fontSize: 24 }}>👋</span>
                  <div>
                    <strong>Welcome to Sahayak!</strong> Please complete your profile details first to unlock all AI chatbot features and scheme recommendation matching.
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3" style={{ marginBottom: 28 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,var(--saffron),var(--green))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                  {form.name ? form.name[0].toUpperCase() : "👤"}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{form.name || "Your Name"}</div>
                  <div className="text-muted text-sm">{form.state || "State not set"}</div>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="input" placeholder="Enter your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} required>
                    <option value="">Select State</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="input" type="number" min={1} max={120} value={form.age} onChange={e => setForm({ ...form, age: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as Gender })}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="all">Prefer not to say</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Annual Income (₹)</label>
                  <input className="input" type="number" min={0} step={1000} placeholder="e.g. 150000" value={form.income || ""} onChange={e => setForm({ ...form, income: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Occupation(s)</label>
                <div className="tag-input-wrap">
                  <select className="input" style={{ flex: 1 }} value={occInput} onChange={e => setOccInput(e.target.value)}>
                    <option value="">Select occupation…</option>
                    {OCCUPATIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addOcc}>Add</button>
                </div>
                {form.occupation.length > 0 && (
                  <div className="tags-display">
                    {form.occupation.map(o => (
                      <span className="tag" key={o}>
                        {o.charAt(0).toUpperCase() + o.slice(1)}
                        <span className="tag-remove" onClick={() => setForm({ ...form, occupation: form.occupation.filter(x => x !== o) })}>×</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center", marginTop: 8 }}>
                {saved && <span style={{ color: "#4ade80", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={16} /> Saved!</span>}
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Page: Chatbot ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "What schemes are available for farmers?",
  "Show me education scholarships",
  "I am from BPL family, what help can I get?",
  "Housing schemes in Maharashtra",
];

function ChatbotPage({ profile }: { profile: Profile }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "welcome", role: "bot",
    message: "Namaste 🙏 I'm Sahayak AI, your guide to Indian government schemes!\n\nI can help you discover welfare programmes, check eligibility, and guide you through applications.\n\nTell me about yourself or ask anything — in English or Hindi!",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", message: msg }]);
    setLoading(true);
    const context = profile.name
      ? `User: name=${profile.name}, state=${profile.state}, age=${profile.age}, gender=${profile.gender}, occupation=${profile.occupation.join(",")}, income=₹${profile.income}/yr. Question: ${msg}`
      : msg;
    const reply = await sendChatMessage(context);
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "bot", message: reply }]);
    setLoading(false);
  }, [input, loading, profile]);

  return (
    <>
      <div className="page-header">
        <h2>Sahayak AI Chatbot</h2>
        <p>Ask anything about government schemes in English or Hindi</p>
      </div>
      <div className="chat-shell">
        <div className="chat-messages">
          {messages.length <= 1 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {QUICK_PROMPTS.map(q => (
                <button key={q} className="pill" style={{ fontSize: 13 }} onClick={() => send(q)}>{q}</button>
              ))}
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`chat-bubble-row ${m.role}`}>
              <div className={`chat-avatar ${m.role === "bot" ? "avatar-bot" : "avatar-user"}`}>{m.role === "bot" ? "🤖" : "👤"}</div>
              <div className={`chat-bubble ${m.role === "bot" ? "bubble-bot" : "bubble-user"}`}>
                {m.message.split("\n").map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble-row">
              <div className="chat-avatar avatar-bot">🤖</div>
              <div className="chat-bubble bubble-bot">
                <div className="typing-indicator">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-area">
          <div className="chat-input-wrap">
            <input className="chat-input" placeholder="Ask about schemes, eligibility, benefits…"
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={loading}
            />
          </div>
          <button className="send-btn" onClick={() => send()} disabled={!input.trim() || loading}>
            {loading ? <Loader size={18} style={{ animation: "spin 0.7s linear infinite" }} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Page: Applications ───────────────────────────────────────────────────────

function ApplicationsPage({ applications, onUpdateStatus }: {
  applications: Application[];
  onUpdateStatus: (id: string, status: Application["status"]) => void;
}) {
  return (
    <>
      <div className="page-header">
        <h2>My Applications</h2>
        <p>Track your scheme application progress</p>
      </div>
      <div className="page-body">
        {applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No applications yet. Browse schemes and click "Apply Now"!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {applications.map(app => (
              <div className="card" key={app.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{app.schemeName}</div>
                    <div className="text-sm text-muted">Created on {app.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <select className="input" style={{ width: 140, padding: "8px 12px" }} value={app.status}
                      onChange={e => onUpdateStatus(app.id, e.target.value as Application["status"])}>
                      {(["Opened", "Applied", "Wait", "Reject"] as Application["status"][]).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <span className={`badge ${statusColor[app.status]}`}>{app.status}</span>
                    {app.applicationLink && (
                      <a href={app.applicationLink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                        <ExternalLink size={14} /> Open Link
                      </a>
                    )}
                  </div>
                </div>

                {app.status === "Opened" && (
                  <div style={{
                    padding: "12px 16px",
                    background: "rgba(255, 153, 51, 0.05)",
                    borderRadius: "8px",
                    border: "1px dashed rgba(255, 153, 51, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12
                  }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      📋 Update this application status:
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onUpdateStatus(app.id, "Applied")} style={{ borderColor: "rgba(74, 222, 128, 0.3)", color: "#4ade80" }}>
                        Mark as Applied
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => onUpdateStatus(app.id, "Wait")} style={{ borderColor: "rgba(255, 153, 51, 0.3)", color: "var(--saffron)" }}>
                        Mark as Wait
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => onUpdateStatus(app.id, "Reject")} style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "#f87171" }}>
                        Mark as Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: "home", label: "Home", Icon: Home },
  { id: "schemes", label: "Schemes", Icon: BookOpen },
  { id: "chatbot", label: "Sahayak AI", Icon: MessageSquare },
  { id: "applications", label: "Applications", Icon: Briefcase },
  { id: "profile", label: "Profile", Icon: User },
];

function Sidebar({ page, onNavigate, isLocked }: { page: string; onNavigate: (p: string) => void; isLocked: boolean }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-badge">
          <div className="logo-icon">🇮🇳</div>
          <div className="logo-text">
            <h1>Sahayak</h1>
            <p>Scheme Discovery Portal</p>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV.map(({ id, label, Icon }) => {
          const locked = isLocked && id !== "profile";
          return (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => !locked && onNavigate(id)}
              style={locked ? { opacity: 0.4, cursor: "not-allowed" } : {}}
              title={locked ? "Complete profile to unlock" : ""}
            >
              <Icon className="nav-icon" size={18} /> {label} {locked && "🔒"}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="tricolor-bar" />
        <div className="text-sm text-muted" style={{ textAlign: "center" }}>
          Sahayak © 2025<br />Government Scheme Portal
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

const PROFILE_KEY = "sahayak_profile_web";
const APPS_KEY = "sahayak_applications_web";

export default function App() {
  const [profile, setProfile] = useState<Profile>(() => {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null") || defaultProfile; }
    catch { return defaultProfile; }
  });
  const [applications, setApplications] = useState<Application[]>(() => {
    try { return JSON.parse(localStorage.getItem(APPS_KEY) || "[]"); }
    catch { return []; }
  });

  const isProfileIncomplete = !profile.name || !profile.state;
  const [page, setPage] = useState(() => {
    return isProfileIncomplete ? "profile" : "home";
  });

  useEffect(() => {
    if (isProfileIncomplete) {
      setPage("profile");
    }
  }, [isProfileIncomplete]);

  function updateProfile(p: Profile) {
    setProfile(p);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  }
  
  function addApplication(app: Application) {
    const updated = [app, ...applications];
    setApplications(updated);
    localStorage.setItem(APPS_KEY, JSON.stringify(updated));
  }
  
  function updateAppStatus(id: string, status: Application["status"]) {
    const updated = applications.map(a => a.id === id ? { ...a, status } : a);
    setApplications(updated);
    localStorage.setItem(APPS_KEY, JSON.stringify(updated));
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} isLocked={isProfileIncomplete} />
      <main className="main-content">
        {page === "home"         && <HomePage profile={profile} onNavigate={setPage} />}
        {page === "schemes"      && <SchemesPage profile={profile} onAddApplication={addApplication} />}
        {page === "chatbot"      && <ChatbotPage profile={profile} />}
        {page === "applications" && <ApplicationsPage applications={applications} onUpdateStatus={updateAppStatus} />}
        {page === "profile"      && <ProfilePage profile={profile} onUpdate={updateProfile} />}
      </main>
    </div>
  );
}
