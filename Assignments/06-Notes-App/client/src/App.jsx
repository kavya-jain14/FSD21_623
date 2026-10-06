import { useEffect, useRef, useState } from "react";
import { formatDate, request, useRecords } from "./api.js";

function Dialog({ title, children, onClose, busy = false, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} className={wide ? "wide-dialog" : ""} aria-labelledby="dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}><div className="dialog-header"><h2 id="dialog-title">{title}</h2><button className="text-button" onClick={onClose} disabled={busy}>Close</button></div>{children}</dialog>;
}

function NoteEditor({ note, onClose, onSaved }) {
  const [form, setForm] = useState({ title: note.title || "", subject: note.subject || "", studentName: note.studentName || "", content: note.content || "", tags: (note.tags || []).join(", ") });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const tags = form.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    try {
      const saved = await request("/api/notes" + (note.id ? "/" + note.id : ""), { method: note.id ? "PUT" : "POST", body: JSON.stringify({ ...form, tags }) });
      onSaved(saved, Boolean(note.id));
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <Dialog title={note.id ? "Edit your note" : "A fresh page"} onClose={onClose} busy={busy} wide>
    <p className="muted">A useful explanation, a class takeaway, or something worth remembering.</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="form-grid">
        <label className="span-two">Title<input name="title" placeholder="Give your note a clear title" value={form.title} onChange={update} required maxLength={120} /></label>
        <label>Subject<input name="subject" placeholder="e.g. Operating Systems" value={form.subject} onChange={update} required maxLength={60} /></label>
        <label>Student name<input name="studentName" autoComplete="name" placeholder="Who wrote this?" value={form.studentName} onChange={update} required maxLength={80} /></label>
        <label className="span-two">Note<textarea className="writing-area" name="content" placeholder="Start writing here…" value={form.content} onChange={update} required maxLength={20000} rows={10} /><small>{form.content.length.toLocaleString()} / 20,000 characters</small></label>
        <label className="span-two">Tags <span className="optional">optional</span><input name="tags" placeholder="revision, unit-1, important" value={form.tags} onChange={update} maxLength={260} /><small>Separate tags with commas. Up to 8 tags, 30 characters each.</small></label>
      </fieldset>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="form-footer"><button className="secondary" type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? "Saving…" : "Save note"}</button></div>
    </form>
  </Dialog>;
}

function downloadNote(note) {
  const text = `${note.title}\n${note.subject} · ${note.studentName}\n\n${note.content}\n\nTags: ${note.tags.join(", ")}`;
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = (note.title.replace(/[^a-z0-9_-]+/gi, "-").slice(0, 80) || "campus-note") + ".txt";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function NoteReader({ note, onClose, onEdit, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setBusy(true); setError("");
    try { await request("/api/notes/" + note.id, { method: "DELETE" }); onDeleted(); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <Dialog title={note.title} onClose={onClose} busy={busy} wide>
    <p className="reader-meta">{note.subject} <span aria-hidden="true">/</span> {note.studentName} <span aria-hidden="true">/</span> Updated {formatDate(note.updatedAt)}</p>
    <div className="note-content">{note.content}</div>
    <div className="tags">{note.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
    {error && <p role="alert" className="error">{error}</p>}
    {confirming ? <div className="delete-confirm"><p>Delete this note? This cannot be undone.</p><div><button className="secondary" disabled={busy} onClick={() => setConfirming(false)}>Keep note</button><button className="danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Confirm delete"}</button></div></div> : <div className="reader-actions"><button className="primary" onClick={() => onEdit(note)}>Edit note</button><button className="secondary" onClick={() => downloadNote(note)}>Download .txt</button><button className="text-button delete-button" onClick={() => setConfirming(true)}>Delete note</button></div>}
  </Dialog>;
}

export default function App() {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [pinned, setPinned] = useState("");
  const [sort, setSort] = useState("newest");
  const [editor, setEditor] = useState(null);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [pinning, setPinning] = useState("");
  const { data, loading, error, reload } = useRecords("/api/notes", { q, subject, pinned, sort });
  function clearFilters() { setQ(""); setSubject(""); setPinned(""); }
  function saved(note, editing) { setEditor(null); clearFilters(); setNotice('“' + note.title + '” ' + (editing ? "updated." : "saved.")); reload(); }
  async function togglePin(note) {
    setPinning(note.id); setActionError("");
    try { await request("/api/notes/" + note.id + "/pin", { method: "PATCH", body: JSON.stringify({ pinned: !note.pinned }) }); reload(); }
    catch (error) { setActionError(error.message); }
    finally { setPinning(""); }
  }
  const isFiltered = q || subject || pinned;
  return <>
    <header className="topbar"><a className="brand" href="/"><span className="brand-mark">n.</span><span>Campus Notes</span></a><span className="course-label">CSE-21 / Assignment 06</span><button className="primary" onClick={() => setEditor({})}>New note <span aria-hidden="true">+</span></button></header>
    <div className="layout">
      <aside className="sidebar"><p className="eyebrow">Your class bookshelf</p><button className={"nav-button " + (!pinned && !subject ? "active" : "")} onClick={() => { setSubject(""); setPinned(""); }}>All notes<span>{data.count}</span></button><button className={"nav-button " + (pinned ? "active" : "")} onClick={() => { setPinned("true"); setSubject(""); }}>Pinned notes<span aria-hidden="true">↗</span></button><div className="subject-nav"><h2>Subjects</h2>{data.subjects.length === 0 ? <p className="muted">Subjects appear when you save a note.</p> : data.subjects.map((item) => <button key={item} className={"subject-button " + (subject === item ? "active" : "")} onClick={() => { setSubject(item); setPinned(""); }}>{item}</button>)}</div><div className="sidebar-note"><span aria-hidden="true">“</span><p>Good notes make<br />room for good ideas.</p><small>A shared student notebook.</small></div></aside>
      <main className="workspace">
        <section className="hero"><p className="eyebrow">Keep the useful bits</p><h1>{subject || (pinned ? "The ones to keep close." : "A little less forgotten.")}</h1><p className="intro">Save your class notes. Find the right thought.<br />Pick up where you left off.</p></section>
        {notice && <div className="notice" role="status"><span>{notice}</span><button className="text-button" onClick={() => setNotice("")} aria-label="Dismiss message">Dismiss</button></div>}
        {actionError && <p className="error" role="alert">{actionError}</p>}
        <section className="notes-section" aria-labelledby="notes-heading"><div className="section-heading"><h2 id="notes-heading">{pinned ? "Pinned notes" : subject || "All notes"}</h2><span>{data.total} {data.total === 1 ? "note" : "notes"}</span></div>
          <div className="filters"><label className="search">Search your notes<input type="search" placeholder="Title, content, author or tag…" value={q} maxLength={200} onChange={(event) => setQ(event.target.value)} /></label><label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Recently updated</option><option value="oldest">Oldest updated</option><option value="title">Title A–Z</option></select></label></div>
          {error ? <div className="error" role="alert">{error} <button className="text-button" onClick={reload}>Try again</button></div> : loading ? <p className="loading" role="status">Opening the notebook…</p> : data.items.length === 0 ? <div className="empty"><span className="empty-mark" aria-hidden="true">Aa</span><h3>{isFiltered ? "Nothing on this page yet." : "Your next idea belongs here."}</h3><p>{isFiltered ? "Try another search or clear your filters." : "Add a class note, a quick explanation, or your revision list."}</p><button className="primary" onClick={isFiltered ? clearFilters : () => setEditor({})}>{isFiltered ? "Clear filters" : "Write your first note"}</button></div> : <div className="notes-grid">{data.items.map((note, index) => <article key={note.id} className={"note-card tone-" + (index % 2)}><div className="card-top"><span className="subject-label">{note.subject}</span><button className={"pin-button " + (note.pinned ? "is-pinned" : "")} aria-label={(note.pinned ? "Unpin " : "Pin ") + note.title} aria-pressed={note.pinned} disabled={Boolean(pinning)} onClick={() => togglePin(note)}>{pinning === note.id ? "Saving…" : note.pinned ? "Pinned ↗" : "Pin +"}</button></div><button className="note-open" onClick={() => setSelected(note)}><h3>{note.title}</h3><p className="note-preview">{note.content}</p><span className="read-note">Read note <span aria-hidden="true">↗</span></span></button><div className="tags">{note.tags.map((tag) => <button key={tag} onClick={() => setQ(tag)}>#{tag}</button>)}</div><div className="card-bottom"><span>{note.studentName}</span><time dateTime={note.updatedAt}>{formatDate(note.updatedAt)}</time></div></article>)}</div>}
        </section><footer>One thought at a time.<span>Full Stack Development · CSE-21</span></footer>
      </main>
    </div>
    {editor && <NoteEditor key={editor.id || "new"} note={editor} onClose={() => setEditor(null)} onSaved={saved} />}
    {selected && <NoteReader key={selected.id} note={selected} onClose={() => setSelected(null)} onEdit={(note) => { setSelected(null); setEditor(note); }} onDeleted={() => { setSelected(null); setNotice("Note deleted."); reload(); }} />}
  </>;
}
