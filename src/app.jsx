// app.jsx — shell, navigation, audit store, tweaks. Mounts to #root.
const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp } = React;

const ACCENTS = [
  { hex: '#2f6bf0', hue: 255 }, // solar blue (default)
  { hex: '#0e87b4', hue: 218 }, // azure
  { hex: '#15998c', hue: 186 }, // teal
  { hex: '#7a5ae0', hue: 292 }, // violet
  { hex: '#e08a1e', hue: 70  }, // sun amber
];
const FONTS = {
  grotesk: { display: "'Space Grotesk', sans-serif", ui: "'Plus Jakarta Sans', sans-serif" },
  jakarta: { display: "'Plus Jakarta Sans', sans-serif", ui: "'Plus Jakarta Sans', sans-serif" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#2f6bf0",
  "headingFont": "grotesk",
  "threshold": 80,
  "density": "regular",
  "style": "bold",
  "dark": false
}/*EDITMODE-END*/;

const ICONS = {
  summary: <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 16.5V8 M8 16.5V4 M12.5 16.5v-5 M3 16.5h13" /><circle cx="14.5" cy="6.5" r="2.2" /></g>,
  audit: <path d="M4 4.5A1.5 1.5 0 015.5 3H11l5 5v8.5A1.5 1.5 0 0114.5 18h-9A1.5 1.5 0 014 16.5v-12z M11 3v5h5 M7.5 11.5l1.6 1.6L13 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  analytics: <path d="M4 16V9 M9 16V5 M14 16v-4 M3 16.5h13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
  performance: <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7.5" r="3.2" /><path d="M4.5 16.5c0-3 2.6-4.7 5.5-4.7s5.5 1.7 5.5 4.7" strokeLinecap="round" /></g>,
  settings: <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="2.6" /><path d="M10 3.4v2 M10 14.6v2 M16.6 10h-2 M5.4 10h-2 M14.7 5.3l-1.4 1.4 M6.7 13.3l-1.4 1.4 M14.7 14.7l-1.4-1.4 M6.7 6.7L5.3 5.3" /></g>,
};
// Decorative identity color per nav item — reuses the section-color variables so the
// "vibrant"/"bold" style tweak lights up the sidebar too. Purely for visual variety;
// carries no pass/fail meaning.
const NAV_ACCENT = {
  summary: 'var(--sec-qualification)', audit: 'var(--sec-opening)',
  analytics: 'var(--sec-closing)', performance: 'var(--sec-selling)', settings: 'var(--sec-objection)',
};

const NAV_ALL = {
  summary: { key: 'summary', label: 'Summary', desc: 'City & TL overview' },
  audit: { key: 'audit', label: 'New Audit', desc: 'Score a call' },
  analytics: { key: 'analytics', label: 'Analytics', desc: 'Reporting & calibration' },
  performance: { key: 'performance', label: 'Team Performance', desc: "Your team's LRMs" },
  settings: { key: 'settings', label: 'Settings', desc: 'Admin only' },
};
// Which nav items each role sees, in order. LRM is locked to their own scorecard only;
// ZSM/ADOS oversee their downline (summary/analytics/team performance + new audit); TL/QA/
// Admin get the full set. Keys reference NAV_ALL above.
function navForRole(role, isAdmin) {
  if (role === 'LRM' && !isAdmin) return ['performance'];
  return isAdmin ? ['summary', 'audit', 'analytics', 'performance', 'settings'] : ['summary', 'audit', 'analytics', 'performance'];
}

function Sidebar({ active, onNav, count, session, onSignOut, signInEnabled, items, isAdmin }) {
  const who = (session && (session.name || session.email)) || 'Signed in';
  const role = (session && session.role) || ((session && session.email) ? window.QA.roleForEmail(session.email) : '');
  const sub = isAdmin ? 'Admin' : ((window.QA.ROLE_LABEL && window.QA.ROLE_LABEL[role]) || 'Team Lead');
  return (
    <aside className="ss-sidebar" style={{
      width: 252, flex: '0 0 252px', background: 'var(--surface)', borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '20px 20px 20px' }}>
        <img src="/solarsquare-logo.png" alt="SolarSquare" style={{ width: 124, height: 'auto', display: 'block' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 18, height: 2, borderRadius: 2, background: 'var(--primary)', flex: '0 0 auto' }} />
          <span style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Quality Systems</span>
        </div>
      </div>

      <nav className="ss-nav" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px', flex: 1 }}>
        {items.map(n => {
          const on = active === n.key;
          return (
            <button key={n.key} onClick={() => onNav(n.key)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              border: 'none', background: on ? 'var(--primary-soft)' : 'transparent', textAlign: 'left',
              color: on ? 'var(--primary-strong)' : 'var(--ink-2)', transition: 'background 0.15s, color 0.15s', width: '100%',
            }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{
                width: 26, height: 26, borderRadius: 8, flex: '0 0 auto', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                background: on ? `color-mix(in oklch, ${NAV_ACCENT[n.key]} 20%, transparent)` : 'transparent',
                color: on ? NAV_ACCENT[n.key] : 'var(--ink-3)', transition: 'background 0.15s, color 0.15s',
              }}>
                <svg width="18" height="18" viewBox="0 0 20 20">{ICONS[n.key]}</svg>
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>{n.label}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 500 }}>{n.desc}</span>
              </span>
              {n.key === 'analytics' && <Badge tone={on ? 'primary' : 'neutral'} mono>{count}</Badge>}
            </button>
          );
        })}
      </nav>

      <div className="ss-userbox" style={{ padding: 14, margin: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 11 }}>
        <Avatar name={who} size={34} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{who}</div>
          <div style={{ fontSize: 11, color: isAdmin ? 'var(--primary-strong)' : 'var(--ink-3)', fontWeight: isAdmin ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
        </div>
        {signInEnabled
          ? <button onClick={onSignOut} title="Sign out" aria-label="Sign out" style={{
              flex: '0 0 auto', width: 30, height: 30, display: 'grid', placeItems: 'center',
              border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--bad)'; e.currentTarget.style.borderColor = 'var(--bad)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-3)'; e.currentTarget.style.borderColor = 'var(--line)'; }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 5.5V4.5A1.5 1.5 0 019.5 3h5A1.5 1.5 0 0116 4.5v11a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 018 15.5v-1 M11 10H3.5 M6 7l-3 3 3 3" /></svg>
            </button>
          : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ok)', flex: '0 0 auto' }} title="Online" />}
      </div>
    </aside>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = useStateApp('summary');
  const [audits, setAudits] = useStateApp([]);
  const [meetings, setMeetings] = useStateApp([]);
  const [agents, setAgents] = useStateApp([]);
  const authApi = (window.QA && window.QA.auth) || { enabled: false, init: () => Promise.resolve(), isAuthorized: () => false };
  const [gated, setGated] = useStateApp(true); // fail closed until config resolves
  const [session, setSession] = useStateApp(authApi.session || { name: '', email: '' });

  // phase: 'booting' (resolving config) | 'login' | 'denied' | 'loading' | 'ready'
  const [phase, setPhase] = useStateApp('booting');
  const [busy, setBusy] = useStateApp(false);

  // 1) resolve the runtime auth config, THEN decide which gate (if any) to show
  useEffectApp(() => {
    let alive = true;
    (async () => {
      try { await (authApi.init ? authApi.init() : Promise.resolve()); } catch (e) { /* fail closed */ }
      if (!alive) return;
      // Admin's local QA-auditor override (if saved from Settings) wins over the server
      // default for this browser — applied after server config so it takes precedence.
      try {
        const saved = JSON.parse(localStorage.getItem('qa_auditor_emails_override') || 'null');
        if (Array.isArray(saved) && saved.length) window.QA.setQaAuditorEmails(saved);
      } catch (e) { /* ignore malformed override */ }
      const on = !!authApi.enabled;
      setGated(on);
      const sess = authApi.session;
      if (!on) setPhase('loading');
      else if (!sess) setPhase('login');
      else setPhase(authApi.isAuthorized(sess) ? 'loading' : 'denied');
    })();
    return () => { alive = false; };
  }, []);

  // 2) load data only once we're past the gate; a server 401/403 drops us to 'denied'
  useEffectApp(() => {
    if (phase !== 'loading') return;
    let alive = true;
    (async () => {
      const api = window.QA.api;
      try {
        const [user, emps, list, mtg] = await Promise.all([
          api.getCurrentUser(), api.getAllEmployees(), api.loadAudits(), api.loadMeetings(),
        ]);
        if (!alive) return;
        if (user && user.email) setSession({ ...user, role: window.QA.orgRoleForEmail(user.email, emps) });
        setAgents(emps); setAudits(list); setMeetings(mtg); setPhase('ready');
      } catch (err) {
        if (!alive) return;
        if (err && err.isAuth) setPhase('denied');
        else { console.error(err); setPhase('ready'); }
      }
    })();
    return () => { alive = false; };
  }, [phase]);

  const reload = async () => { setAudits(await window.QA.api.loadAudits()); };

  // ---- Role-based scope ----
  // Admin (a named allowlist) and QA Auditors see every team unrestricted. Everyone else —
  // LRM / TL / ZSM / ADOS — only sees their own reporting line, derived from the live
  // employee list so it tracks real EmployeeMaster data, not a hard-coded org chart.
  const isAdmin = window.QA.isAdminEmail(session && session.email);
  const myRole = (session && session.role) || 'TL';
  const hasIdentity = !!(session && session.email);
  const scopeEmails = (isAdmin || myRole === 'QA' || !hasIdentity) ? null : window.QA.agentEmailsForScope(myRole, session && session.email, agents);
  const scopedAgents = scopeEmails ? agents.filter(a => scopeEmails.has(a.email)) : agents;
  const scopedAudits = scopeEmails ? audits.filter(a => scopeEmails.has(a.agentEmail)) : audits;
  const scopedMeetings = scopeEmails ? meetings.filter(m => scopeEmails.has(m.lrmEmail)) : meetings;

  const navItems = navForRole(myRole, isAdmin).map(k => {
    const base = NAV_ALL[k];
    if (k === 'performance') {
      return myRole === 'LRM' && !isAdmin
        ? { ...base, label: 'My Performance', desc: 'Your scorecard' }
        : base;
    }
    return base;
  });

  // Keep `active` valid as role resolves (e.g. an LRM only ever has one tab).
  useEffectApp(() => {
    if (phase !== 'ready') return;
    if (!navItems.some(n => n.key === active)) setActive(navItems[0].key);
  }, [phase, myRole, isAdmin]);

  const hue = (ACCENTS.find(a => a.hex === t.accent) || ACCENTS[0]).hue;
  const fonts = FONTS[t.headingFont] || FONTS.grotesk;

  useEffectApp(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent-h', hue);
    r.style.setProperty('--font-display', fonts.display);
    r.style.setProperty('--font-ui', fonts.ui);
    r.setAttribute('data-density', t.density);
    r.setAttribute('data-theme', t.dark ? 'dark' : 'light');
    r.setAttribute('data-style', t.style || 'minimal');
  }, [hue, fonts.display, fonts.ui, t.density, t.dark, t.style]);

  const submitAudit = async (payload) => {
    setBusy(true);
    const res = await window.QA.api.saveAudit(payload);
    await reload(); setBusy(false);
    return res;
  };

  if (phase === 'booting') return <BootSplash />;
  if (gated && phase === 'login') return <LoginScreen authApi={authApi} />;
  if (gated && phase === 'denied') return <AccessDenied authApi={authApi} session={session} />;
  if (phase === 'loading') return <BootSplash />;

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }} className="ss-shell">
      <Sidebar active={active} onNav={setActive} count={scopedAudits.length} session={session} onSignOut={authApi.signOut} signInEnabled={gated} items={navItems} isAdmin={isAdmin} />
      <main className="ss-main" style={{ flex: 1, minWidth: 0, overflowY: 'auto', height: '100%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '34px clamp(20px, 4vw, 44px) 80px' }}>
          {active === 'summary' && <SummaryView audits={scopedAudits} meetings={scopedMeetings} threshold={t.threshold} />}
          {active === 'audit' && <AuditView agents={scopedAgents} meetings={scopedMeetings} audits={scopedAudits} onSubmit={submitAudit} threshold={t.threshold} session={session} busy={busy} />}
          {active === 'analytics' && <AnalyticsView audits={scopedAudits} threshold={t.threshold} />}
          {active === 'performance' && <PerformanceView audits={scopedAudits} agents={scopedAgents} threshold={t.threshold} session={session} />}
          {active === 'settings' && <SettingsView agents={agents} audits={audits} session={session} />}
        </div>
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={t.accent} options={ACCENTS.map(a => a.hex)} onChange={v => setTweak('accent', v)} />
        <TweakRadio label="Headings" value={t.headingFont} options={[{ value: 'grotesk', label: 'Grotesk' }, { value: 'jakarta', label: 'Jakarta' }]} onChange={v => setTweak('headingFont', v)} />
        <TweakSection label="Scoring" />
        <TweakSlider label="Pass threshold" value={t.threshold} min={50} max={95} step={5} unit="%" onChange={v => setTweak('threshold', v)} />
        <TweakSection label="Display" />
        <TweakRadio label="Density" value={t.density} options={['compact', 'regular', 'comfy']} onChange={v => setTweak('density', v)} />
        <TweakRadio label="Style" value={t.style} options={[{ value: 'minimal', label: 'Minimal' }, { value: 'vibrant', label: 'Vibrant' }, { value: 'bold', label: 'Bold' }]} onChange={v => setTweak('style', v)} />
        <TweakToggle label="Dark mode" value={t.dark} onChange={v => setTweak('dark', v)} />
      </TweaksPanel>

      <style>{RESPONSIVE_CSS}</style>
    </div>
  );
}

const RESPONSIVE_CSS = `
  @media (max-width: 1080px) {
    .audit-grid { grid-template-columns: 1fr !important; }
    .audit-rail { position: static !important; }
    .filter-trend-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 880px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .filter-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .perf-grid { grid-template-columns: 1fr !important; }
    .miss-grid { grid-template-columns: 1fr !important; }
    .profile-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 760px) {
    .ss-shell { flex-direction: column; }
    .ss-sidebar { width: 100% !important; flex: none !important; height: auto !important; border-right: none; border-bottom: 1px solid var(--line); }
    .ss-nav { flex-direction: row !important; overflow-x: auto; padding: 0 12px 12px !important; }
    .ss-nav button span span:last-child { display: none !important; }
    .ss-userbox { display: none !important; }
    .ss-main { height: auto !important; }
  }
  @media (max-width: 560px) {
    .kpi-grid { grid-template-columns: 1fr !important; }
    .profile-grid { grid-template-columns: 1fr !important; }
    .filter-grid { grid-template-columns: 1fr !important; }
  }
`;

function BootSplash() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--primary)', position: 'relative', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ position: 'absolute', top: 10, left: 10, width: 16, height: 16, borderRadius: '50%', background: 'var(--sun)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--ink-3)', fontSize: 13.5, fontWeight: 500 }}>
        <span style={{ width: 15, height: 15, border: '2px solid var(--line)', borderTopColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'ss-spin 0.7s linear infinite' }} />
        Loading quality data…
      </div>
      <style>{`@keyframes ss-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

// ---- Brand mark + access screens -------------------------------------------------
// SolarSquare brand blues (fixed to the logo, independent of the dashboard's accent tweak)
const BRAND = { navy: '#141a63', blue: '#2433b8', cyan: '#46b6ec' };

// Decorative grid of rounded squares echoing the solar-panel "sun" in the logo.
function PanelMotif({ cols = 6, rows = 5, cell = 30, gap = 9, style }) {
  const pattern = [0.9, 0.5, 0.22, 0.7, 0.35, 0.16];
  const cells = [];
  for (let i = 0; i < cols * rows; i++) {
    const op = pattern[(i * 7 + (i % rows) * 3) % pattern.length];
    cells.push(
      <span key={i} style={{ width: cell, height: cell, borderRadius: cell * 0.26, background: 'rgba(255,255,255,' + (op * 0.5).toFixed(2) + ')' }} />
    );
  }
  return (
    <div aria-hidden="true" style={{ position: 'absolute', display: 'grid', gridTemplateColumns: 'repeat(' + cols + ',' + cell + 'px)', gap, ...style }}>{cells}</div>
  );
}

function ScreenWrap({ children, tone = 'brand' }) {
  return (
    <div style={{
      height: '100%', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(120% 100% at 18% 0%, ' + BRAND.blue + ' 0%, ' + BRAND.navy + ' 58%, #0d1247 100%)',
    }}>
      <PanelMotif cols={6} rows={5} cell={34} gap={11} style={{ top: -46, right: -40, transform: 'rotate(12deg)', opacity: 0.9 }} />
      <PanelMotif cols={5} rows={4} cell={26} gap={9} style={{ bottom: -34, left: -30, transform: 'rotate(-8deg)', opacity: 0.7 }} />
      <div style={{
        position: 'relative', zIndex: 1, width: 'min(440px, 100%)', background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)', boxShadow: '0 30px 70px -20px rgba(8,12,55,0.55), 0 8px 24px -8px rgba(8,12,55,0.35)',
        padding: '42px 40px 34px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>{children}</div>
      <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', fontSize: 11.5, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.6)' }}>
        SolarSquare · Quality Systems
      </div>
    </div>
  );
}

function BrandLogo({ width = 150 }) {
  return <img src="/solarsquare-logo.png" alt="SolarSquare" style={{ width, height: 'auto', display: 'block' }} />;
}

function Eyebrow() {
  return (
    <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 999, background: 'var(--primary-softer)', border: '1px solid var(--line-soft)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND.cyan, flex: '0 0 auto' }} />
      <span style={{ fontSize: 10.5, color: 'var(--ink-2)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Quality Systems</span>
    </div>
  );
}

function LoginScreen({ authApi }) {
  const btnRef = useRefApp(null);
  useEffectApp(() => {
    if (btnRef.current) authApi.renderButton(btnRef.current, { size: 'large', width: 300 });
  }, []);
  return (
    <ScreenWrap>
      <BrandLogo width={156} />
      <Eyebrow />
      <h1 style={{ fontSize: 25, marginTop: 16, color: 'var(--ink)' }}>Sign in to continue</h1>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', margin: '9px 0 24px', maxWidth: 310 }}>
        The QA audit dashboard is private. Use your SolarSquare account to sign in.
      </p>
      <div ref={btnRef} style={{ minHeight: 44, display: 'grid', placeItems: 'center' }} />
      <div style={{ width: '100%', height: 1, background: 'var(--line-soft)', margin: '26px 0 16px' }} />
      <p style={{ fontSize: 11.5, color: 'var(--ink-3)', maxWidth: 310, lineHeight: 1.55 }}>
        Access is restricted to authorized <strong style={{ color: 'var(--ink-2)' }}>@{authApi.allowedDomain}</strong> accounts.
        If you can't get in, ask a Quality Systems admin to add you.
      </p>
    </ScreenWrap>
  );
}

function AccessDenied({ authApi, session }) {
  const email = (session && session.email) || '';
  return (
    <ScreenWrap>
      <BrandLogo width={132} />
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bad-soft)', display: 'grid', placeItems: 'center', color: 'var(--bad)', marginTop: 22 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="10" width="15" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>
      </div>
      <h1 style={{ fontSize: 22, marginTop: 16, color: 'var(--ink)' }}>Access not authorized</h1>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', margin: '9px 0 6px', maxWidth: 320 }}>
        {email
          ? <>The account <strong style={{ color: 'var(--ink)' }}>{email}</strong> isn't on the access list for this dashboard.</>
          : <>Your account isn't on the access list for this dashboard.</>}
      </p>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-3)', margin: '0 0 22px', maxWidth: 320 }}>
        Ask a Quality Systems admin to grant you access, then sign in again.
      </p>
      <button onClick={authApi.signOut} style={{
        padding: '11px 20px', borderRadius: 999, border: '1px solid var(--line)', background: 'var(--surface)',
        color: 'var(--ink)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
      }}>Sign in with a different account</button>
    </ScreenWrap>
  );
}
