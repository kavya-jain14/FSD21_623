import { useEffect, useMemo, useState } from "react";

function App() {
  const [modules, setModules] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const completedCount = useMemo(
    () => modules.filter((module) => module.completed).length,
    [modules]
  );

  const progress = modules.length
    ? Math.round((completedCount / modules.length) * 100)
    : 0;

  useEffect(() => {
    async function loadModules() {
      try {
        const response = await fetch("/api/modules");

        if (!response.ok) {
          throw new Error("Could not load modules");
        }

        setModules(await response.json());
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadModules();
  }, []);

  async function addModule(event) {
    event.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return;
    }

    try {
      const response = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: cleanTitle })
      });

      if (!response.ok) {
        throw new Error("Could not add module");
      }

      const newModule = await response.json();
      setModules((currentModules) => [...currentModules, newModule]);
      setTitle("");
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function toggleModule(module) {
    try {
      const response = await fetch(`/api/modules/${module.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !module.completed })
      });

      if (!response.ok) {
        throw new Error("Could not update module");
      }

      const updatedModule = await response.json();
      setModules((currentModules) => currentModules.map((item) => (
        item.id === updatedModule.id ? updatedModule : item
      )));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeModule(id) {
    try {
      const response = await fetch(`/api/modules/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Could not delete module");
      }

      setModules((currentModules) => currentModules.filter((module) => module.id !== id));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main>
      <header>
        <p className="eyebrow">REACT + EXPRESS</p>
        <div className="heading-row">
          <h1>Workshop<br />Tracker</h1>
          <div className="score" aria-label={`${progress} percent complete`}>
            <strong>{progress}%</strong>
            <span>complete</span>
          </div>
        </div>
      </header>

      <section className="progress-section" aria-label="Course progress">
        <div className="progress-copy">
          <span>{String(completedCount).padStart(2, "0")} completed</span>
          <span>{String(modules.length).padStart(2, "0")} total</span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }}></span>
        </div>
      </section>

      <form onSubmit={addModule}>
        <label htmlFor="module-title">Add a module</label>
        <div>
          <input
            id="module-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter module title"
          />
          <button type="submit">Add</button>
        </div>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="module-list" aria-live="polite">
        {loading && <p className="state">Loading modules...</p>}
        {!loading && modules.length === 0 && <p className="state">No modules added yet.</p>}
        {modules.map((module, index) => (
          <article key={module.id} className={module.completed ? "completed" : ""}>
            <button
              className="check-button"
              type="button"
              onClick={() => toggleModule(module)}
              aria-label={`Mark ${module.title} as ${module.completed ? "incomplete" : "complete"}`}
            >
              {module.completed ? "Done" : "Open"}
            </button>
            <div>
              <span>MODULE {String(index + 1).padStart(2, "0")}</span>
              <h2>{module.title}</h2>
            </div>
            <button
              className="delete-button"
              type="button"
              onClick={() => removeModule(module.id)}
              aria-label={`Delete ${module.title}`}
            >
              Remove
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;

