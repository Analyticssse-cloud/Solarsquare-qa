// settings.jsx — Admin-only screen: access lists + org directory + scoring config.
// Read-mostly: the emails that grant Admin/QA access are code/env-configured (see CLAUDE.md),
// not editable from here — this screen exists so an Admin can SEE and audit who has access
// and how the org chart resolves, without digging through the sheet or source.
const { useState: useStateSet, useMemo: useMemoSet } = React;

function CopyEmail({ email }) {
  const [copied, setCopied] = useStateSet(false);
  const copy = () => { try { navigator.clipboard.writeText(email); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1000); };
  return (
    <button type="button" onClick={copy} title="Copy email" style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', background: 'none',
      color: copied ? 'var(--ok)' : 'var(--ink-2)', fontSize: 13, fontFamily: 'var(--font-mono)', padding: '2px 0',
    }}>{copied ? '✓ copied' : email}</button>
  );
}

function SettingsView({ agents = [], audits = [], session }) {
  const Q = window.QA;
  const [q, setQ] = useStateSet('');
  const [qaList, setQaList] = useStateSet(() => Q.getQaAuditorEmails());
  const [newEmail, setNewEmail] = useStateSet('');
  const [savedFlash, setSavedFlash] = useStateSet(false);

  const persistQaList = (list) => {
    setQaList(list);
    Q.setQaAuditorEmails(list.length ? list : ['__none__']); // never let the runtime list go empty/unset
    try { localStorage.setItem('qa_auditor_emails_override', JSON.stringify(list)); } catch (e) {}
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1600);
  };
  const addEmail = () => {
    const e = newEmail.trim().toLowerCase();
    if (!e || qaList.includes(e)) { setNewEmail(''); return; }
    persistQaList([...qaList, e]); setNewEmail('');
  };
  const removeEmail = (e) => persistQaList(qaList.filter(x => x !== e));

  const dir = useMemoSet(() => {
    const tl = new Map(), zsm = new Map(), ados = new Map();
    agents.forEach(a => {
      if (a.tlEmail) tl.set(a.tlEmail, { name: a.tlName, email: a.tlEmail, n: (tl.get(a.tlEmail)?.n || 0) + 1 });
      if (a.mgrEmail) zsm.set(a.mgrEmail, { name: a.mgrName, email: a.mgrEmail, n: (zsm.get(a.mgrEmail)?.n || 0) + 1 });
      if (a.adosEmail) ados.set(a.adosEmail, { name: a.adosName, email: a.adosEmail, n: (ados.get(a.adosEmail)?.n || 0) + 1 });
    });
    return { tl: [...tl.values()], zsm: [...zsm.values()], ados: [...ados.values()] };
  }, [agents]);

  const rows = useMemoSet(() => {
    const roleRows = [
      ...dir.ados.map(p => ({ ...p, role: 'ADOS', scope: agents.filter(a => a.adosEmail === p.email).length })),
      ...dir.zsm.map(p => ({ ...p, role: 'ZSM', scope: agents.filter(a => a.mgrEmail === p.email).length })),
      ...dir.tl.map(p => ({ ...p, role: 'TL', scope: agents.filter(a => a.tlEmail === p.email).length })),
      ...agents.map(a => ({ name: a.name, email: a.email, role: 'LRM', scope: 1 })),
    ];
    const needle = q.trim().toLowerCase();
    return needle ? roleRows.filter(r => r.name?.toLowerCase().includes(needle) || r.email?.toLowerCase().includes(needle)) : roleRows;
  }, [dir, agents, q]);

  const roleTone = { ADOS: 'primary', ZSM: 'ok', TL: 'warn', LRM: 'neutral' };

  return (
    <div>
      <ViewHeader title="Settings" sub="Admin-only. Access lists and the resolved org chart — who sees what, and why." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)', marginBottom: 'var(--gap)' }} className="kpi-grid">
        <Card title="Admin access" subtitle="Unrestricted — sees every team, every screen, regardless of org position.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Q.ADMIN_EMAILS.map(e => (
              <div key={e} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <CopyEmail email={e} />
                {session && session.email && e === session.email.toLowerCase() && <Badge tone="primary">You</Badge>}
              </div>
            ))}
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Fixed in code (data.js → ADMIN_EMAILS). Changing this list needs a redeploy.
          </p>
        </Card>

        <Card title="QA Auditors" subtitle="Independently re-audit any lead across every team.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {qaList.map(e => (
              <div key={e} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <CopyEmail email={e} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {session && session.email && e === session.email.toLowerCase() && <Badge tone="primary">You</Badge>}
                  <button type="button" onClick={() => removeEmail(e)} title="Remove" style={{
                    width: 24, height: 24, borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)',
                    color: 'var(--ink-3)', fontSize: 13, lineHeight: 1,
                  }}>×</button>
                </div>
              </div>
            ))}
            {qaList.length === 0 && <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>No QA auditors configured.</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <TextInput type="email" value={newEmail} onChange={setNewEmail} placeholder="name@solarsquare.in"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }} />
            <Button size="sm" onClick={addEmail} disabled={!newEmail.trim()} style={{ opacity: newEmail.trim() ? 1 : 0.5, flex: '0 0 auto' }}>Add</Button>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 11.5, color: savedFlash ? 'var(--ok)' : 'var(--ink-3)', lineHeight: 1.5, transition: 'color 0.2s' }}>
            {savedFlash ? '✓ Saved for this browser.' : <>Saved to this browser only (not shared with other admins). For a permanent, company-wide change, set the <code style={{ fontFamily: 'var(--font-mono)' }}>QA_AUDITOR_EMAILS</code> Vercel env var instead.</>}
          </p>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }} className="kpi-grid">
        <StatCard label="ADOS" value={dir.ados.length} tone="primary" accent="var(--kpi-1)" sub="reporting lines" />
        <StatCard label="ZSMs" value={dir.zsm.length} tone="primary" accent="var(--kpi-2)" sub="reporting lines" />
        <StatCard label="Team Leads" value={dir.tl.length} tone="primary" accent="var(--kpi-3)" sub="reporting lines" />
        <StatCard label="LRMs" value={agents.length} tone="primary" accent="var(--kpi-4)" sub="in EmployeeMaster" />
      </div>

      <Card title="Org directory" subtitle="Resolved from the live employee list — this is what drives every role's scoped view." pad={false}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line-soft)' }}>
          <TextInput value={q} onChange={setQ} placeholder="Search name or email…" style={{ maxWidth: 320 }} />
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
          <Table>
            <thead><tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Role</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Team size</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.role + r.email}>
                  <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Avatar name={r.name} size={26} /><span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span></div></td>
                  <td style={tdStyle}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>{r.email}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><Badge tone={roleTone[r.role]} mono>{r.role}</Badge></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }} className="tnum">{r.scope}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4}><EmptyState title="No matches" /></td></tr>}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { SettingsView });
