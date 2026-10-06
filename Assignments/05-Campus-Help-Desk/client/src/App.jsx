import { useEffect, useRef, useState } from "react";
import { formatDate, request, useRecords } from "./api.js";

const categories = ["IT & Wi-Fi", "Classroom", "Hostel", "Library", "Transport", "Other"];
const statuses = ["Open", "In Progress", "Resolved"];
const emptyForm = { studentName: "", rollNumber: "", email: "", category: "IT & Wi-Fi", location: "", title: "", description: "", priority: "Normal" };

function Dialog({ title, children, onClose, busy = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} aria-labelledby="dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="dialog-header"><h2 id="dialog-title">{title}</h2><button className="text-button" disabled={busy} onClick={onClose}>Close</button></div>
    {children}
  </dialog>;
}

function ComplaintForm({ onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError("");
    try { onSaved(await request("/api/complaints", { method: "POST", body: JSON.stringify(form) })); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <Dialog title="Report a campus problem" onClose={onClose} busy={busy}>
    <p className="muted">Tell us what happened and where. You will get a ticket number after submitting.</p>
    <form onSubmit={submit} className="report-form">
      <fieldset disabled={busy} className="form-grid">
        <label>Student name<input name="studentName" value={form.studentName} onChange={update} autoComplete="name" required maxLength={80} /></label>
        <label>Roll number<input name="rollNumber" value={form.rollNumber} onChange={update} required maxLength={30} /></label>
        <label className="span-two">Email<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required maxLength={120} /></label>
        <label>Category<select name="category" value={form.category} onChange={update}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Priority<select name="priority" value={form.priority} onChange={update}>{["Low", "Normal", "Urgent"].map((priority) => <option key={priority}>{priority}</option>)}</select></label>
        <label className="span-two">Location<input name="location" placeholder="e.g. Block B, room 204" value={form.location} onChange={update} required maxLength={120} /></label>
        <label className="span-two">Problem title<input name="title" placeholder="A short summary of the issue" value={form.title} onChange={update} required maxLength={120} /></label>
        <label className="span-two">What happened?<textarea name="description" placeholder="Describe the problem and how it affects you…" value={form.description} onChange={update} required minLength={10} maxLength={4000} rows={4} /><small>{form.description.length}/4000 characters · minimum 10</small></label>
      </fieldset>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="form-footer"><button type="button" className="secondary" disabled={busy} onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? "Submitting…" : "Submit problem"}</button></div>
    </form>
  </Dialog>;
}

function ComplaintDetails({ complaint, onClose, onUpdated }) {
  const [status, setStatus] = useState(complaint.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function update(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      onUpdated(await request("/api/complaints/" + complaint.id + "/status", { method: "PATCH", body: JSON.stringify({ status }) }));
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <Dialog title={complaint.title} onClose={onClose} busy={busy}>
    <div className="detail-meta"><span className="ticket">{complaint.ticketNumber}</span><span className={"status status-" + complaint.status.replaceAll(" ", "-").toLowerCase()}>{complaint.status}</span></div>
    <p className="problem-description">{complaint.description}</p>
    <dl className="details-grid">
      <div><dt>Reported by</dt><dd>{complaint.studentName}</dd></div><div><dt>Roll number</dt><dd>{complaint.rollNumber}</dd></div>
      <div><dt>Contact email</dt><dd>{complaint.email}</dd></div><div><dt>Location</dt><dd>{complaint.location}</dd></div>
      <div><dt>Category</dt><dd>{complaint.category}</dd></div><div><dt>Priority</dt><dd>{complaint.priority}</dd></div>
      <div><dt>Submitted</dt><dd>{formatDate(complaint.createdAt)}</dd></div><div><dt>Last updated</dt><dd>{formatDate(complaint.updatedAt)}</dd></div>
    </dl>
    <form onSubmit={update} className="status-form"><label>Update ticket status<select value={status} disabled={busy} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><button className="primary" disabled={busy || status === complaint.status}>{busy ? "Saving…" : "Save status"}</button></form>
    {error && <p role="alert" className="error">{error}</p>}
  </Dialog>;
}

export default function App() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [reporting, setReporting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const { data, loading, error, reload } = useRecords("/api/complaints", { q, category, status });
  function saved(complaint) {
    setReporting(false); setQ(""); setCategory(""); setStatus("");
    setNotice("Problem saved. Your ticket number is " + complaint.ticketNumber + "."); reload();
  }
  function updated(complaint) { setSelected(complaint); setNotice(complaint.ticketNumber + " updated to " + complaint.status + "."); reload(); }
  function clear() { setQ(""); setCategory(""); setStatus(""); }
  return <>
    <header className="topbar"><a className="brand" href="/"><span className="brand-mark">21</span><span>Campus Help Desk</span></a><span className="course-label">CSE-21 / Assignment 05</span></header>
    <main className="page">
      <section className="hero"><div><p className="eyebrow">A better day on campus</p><h1>Small problem?<br />Let’s get it sorted.</h1><p className="intro">From a broken projector to Wi-Fi that won’t connect.<br className="desktop-break" /> Report it here and follow its progress.</p><button className="primary" onClick={() => setReporting(true)}>Report a problem <span aria-hidden="true">↗</span></button></div><aside className="hero-aside"><span className="aside-number">01—03</span><p>Report the issue.<br />Keep your ticket.<br />Track the resolution.</p><small>One shared desk for campus issues.</small></aside></section>
      <div className="stats" aria-label="Ticket summary">{statuses.map((item, index) => <div key={item}><span className="stat-label">0{index + 1} / {item}</span><strong>{data.summary[item] ?? 0}</strong></div>)}</div>
      {notice && <div className="notice" role="status"><span>{notice}</span><button className="text-button" onClick={() => setNotice("")} aria-label="Dismiss message">Dismiss</button></div>}
      <section className="board" aria-labelledby="board-heading">
        <div className="section-heading"><h2 id="board-heading">The campus board</h2><span>{data.count} {data.count === 1 ? "ticket" : "tickets"} in total</span></div>
        <div className="filters"><label className="search">Search tickets<input type="search" placeholder="Title, ticket number, location…" value={q} maxLength={200} onChange={(event) => setQ(event.target.value)} /></label><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label></div>
        {error ? <div className="error" role="alert">{error} <button className="text-button" onClick={reload}>Try again</button></div> : loading ? <p className="loading" role="status">Loading tickets…</p> : data.items.length === 0 ? <div className="empty"><span className="empty-index">—</span><h3>{q || category || status ? "No matching tickets." : "The board is clear."}</h3><p>{q || category || status ? "Try a different search or clear the filters." : "Have something to report? Your first ticket starts here."}</p><button className="secondary" onClick={q || category || status ? clear : () => setReporting(true)}>{q || category || status ? "Clear filters" : "Report a problem"}</button></div> : <div className="ticket-list">{data.items.map((complaint) => <button key={complaint.id} className="ticket-row" onClick={() => setSelected(complaint)}><div className="row-code"><span className="ticket">{complaint.ticketNumber}</span><small>{formatDate(complaint.createdAt)}</small></div><div className="row-main"><h3>{complaint.title}</h3><p>{complaint.category} <span aria-hidden="true">·</span> {complaint.location}</p></div><span className={"priority " + (complaint.priority === "Urgent" ? "urgent" : "")}>{complaint.priority}</span><span className={"status status-" + complaint.status.replaceAll(" ", "-").toLowerCase()}>{complaint.status}</span><span className="row-arrow" aria-hidden="true">↗</span></button>)}</div>}
        {!loading && !error && data.items.length > 0 && <p className="results-note">Showing {data.total} of {data.count} tickets · Select a ticket to read or update it.</p>}
      </section>
      <footer>Made for campus, by students.<span>Full Stack Development · CSE-21</span></footer>
    </main>
    {reporting && <ComplaintForm onClose={() => setReporting(false)} onSaved={saved} />}
    {selected && <ComplaintDetails key={selected.id} complaint={selected} onClose={() => setSelected(null)} onUpdated={updated} />}
  </>;
}
