const BASE = "http://localhost:5001/api";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if ((res.status === 401 || res.status === 403) && getToken()) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  post: (path, body) => apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  get:  (path)       => apiFetch(path),
  put:  (path, body) => apiFetch(path, { method: "PUT",  body: JSON.stringify(body) }),
  del:  (path)       => apiFetch(path, { method: "DELETE" }),
};
