import { useEffect, useState } from "react";

export async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data.message || "The request could not be completed");
  return data;
}

export function useRecords(resource, filters) {
  const query = new URLSearchParams(filters).toString();
  const [data, setData] = useState({ items: [], subjects: [], summary: {}, total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      request(resource + "?" + query, { signal: controller.signal })
        .then(setData)
        .catch((error) => { if (error.name !== "AbortError") setError(error.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [resource, query, revision]);

  return { data, loading, error, reload: () => setRevision((value) => value + 1) };
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
