const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = { message: text }; }
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : null) ||
      `Request failed (HTTP ${response.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  accommodations: (destination = "") => {
    const query = destination ? `?destination=${encodeURIComponent(destination)}` : "";
    return request(`/api/accommodations${query}`);
  },
  createBooking: (booking) => request("/api/bookings", {
    method: "POST",
    body: JSON.stringify(booking)
  }),
  bookings: () => request("/api/bookings"),
  booking: (reference) => request(`/api/bookings/${encodeURIComponent(reference)}`),
  cancelBooking: (reference) => request(`/api/bookings/${encodeURIComponent(reference)}/cancel`, {
    method: "POST"
  })
};