const API = "";
const imageByDestination = {
  spain: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=82",
  greece: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=82",
  italy: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=82",
  default: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=82"
};
const $ = (id) => document.getElementById(id);
const statusEl = $("status");
let stays = [];

function money(value) {
  return new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(value || 0));
}
function imageFor(destination) {
  const key = String(destination || "").toLowerCase();
  return imageByDestination[key] || imageByDestination.default;
}
function showStatus(message, error=false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", error);
}
async function request(path, options={}) {
  const response = await fetch(API + path, {
    ...options,
    headers: {"Content-Type":"application/json", ...(options.headers || {})}
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { throw new Error("The server returned an unexpected response. Check that the API Gateway is running."); }
  if (!response.ok) throw new Error(data?.message || data?.error || "Request failed (" + response.status + ")");
  return data;
}
function renderStays(items) {
  const grid = $("staysGrid");
  if (!items.length) {
    grid.innerHTML = '<p class="empty-state">No stays found. Try another destination.</p>';
    return;
  }
  grid.innerHTML = items.map(stay => `
    <article class="stay-card">
      <div class="stay-image"><img src="${imageFor(stay.destination)}" alt="${stay.name}" loading="lazy"><span class="stay-tag">TRAVELHUB PICK</span></div>
      <div class="stay-body">
        <span class="stay-destination">${escapeHtml(stay.destination || "Explore")}</span>
        <h3>${escapeHtml(stay.name)}</h3>
        <div class="stay-meta"><span>${Number(stay.roomsAvailable)} rooms available</span><span class="stay-price"><strong>${money(stay.nightlyRate)}</strong> / night</span></div>
        <button class="book-button" data-book="${stay.id}">View & book this stay →</button>
      </div>
    </article>`).join("");
  grid.querySelectorAll("[data-book]").forEach(button => button.addEventListener("click", () => openBooking(Number(button.dataset.book))));
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
async function loadStays(destination="") {
  showStatus("Finding available stays…");
  try {
    const query = destination.trim() ? "?destination=" + encodeURIComponent(destination.trim()) : "";
    stays = await request("/api/accommodations" + query);
    renderStays(stays);
    showStatus(stays.length + (stays.length === 1 ? " stay" : " stays") + " found.");
  } catch (error) {
    showStatus(error.message, true);
  }
}
function openBooking(id) {
  const stay = stays.find(item => Number(item.id) === id);
  if (!stay) return;
  $("accommodationId").value = stay.id;
  $("selectedStay").textContent = stay.name + " · " + stay.destination + " · " + money(stay.nightlyRate) + " / night";
  $("dialogCheckIn").value = $("checkIn").value;
  $("dialogCheckOut").value = $("checkOut").value;
  $("dialogRooms").value = $("rooms").value || 1;
  $("bookingMessage").textContent = "";
  $("bookingDialog").showModal();
}
async function submitBooking(event) {
  event.preventDefault();
  const payload = {
    accommodationId: Number($("accommodationId").value),
    guestName: $("guestName").value.trim(),
    checkIn: $("dialogCheckIn").value,
    checkOut: $("dialogCheckOut").value,
    rooms: Number($("dialogRooms").value)
  };
  if (!payload.checkIn || !payload.checkOut || payload.checkOut <= payload.checkIn) {
    $("bookingMessage").textContent = "Please choose a valid check-in and check-out date.";
    return;
  }
  const button = $("bookingForm").querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Confirming…";
  try {
    const booking = await request("/api/bookings", {method:"POST",body:JSON.stringify(payload)});
    $("bookingMessage").textContent = "Booking confirmed. Reference: " + booking.reference;
    await Promise.all([loadBookings(),loadStays($("destination").value)]);
    setTimeout(() => $("bookingDialog").close(), 1100);
  } catch (error) {
    $("bookingMessage").textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Confirm booking <span>→</span>';
  }
}
async function loadBookings() {
  const container = $("bookingsList");
  try {
    const bookings = await request("/api/bookings");
    if (!bookings.length) {
      container.innerHTML = '<p class="empty-state">No bookings yet. Your confirmed trips will appear here.</p>';
      return;
    }
    container.innerHTML = bookings.map(booking => {
      const stay = stays.find(item => Number(item.id) === Number(booking.accommodationId));
      const name = stay?.name || ("Stay #" + booking.accommodationId);
      const cancelled = booking.status === "CANCELLED";
      return `<article class="booking-row">
        <div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(booking.guestName)} · ${booking.rooms} room(s)</small></div>
        <div><small>CHECK IN</small><strong>${escapeHtml(booking.checkIn)}</strong></div>
        <div><small>CHECK OUT</small><strong>${escapeHtml(booking.checkOut)}</strong></div>
        <div><span class="booking-status ${cancelled ? "cancelled" : ""}">${escapeHtml(booking.status)}</span>
        ${cancelled ? "" : `<button class="cancel-button" data-cancel="${escapeHtml(booking.reference)}">Cancel booking</button>`}</div>
      </article>`;
    }).join("");
    container.querySelectorAll("[data-cancel]").forEach(button => button.addEventListener("click", () => cancelBooking(button.dataset.cancel)));
  } catch (error) {
    container.innerHTML = '<p class="empty-state">' + escapeHtml(error.message) + '</p>';
  }
}
async function cancelBooking(reference) {
  if (!confirm("Cancel this booking?")) return;
  try {
    await request("/api/bookings/" + encodeURIComponent(reference) + "/cancel", {method:"POST"});
    await Promise.all([loadBookings(),loadStays($("destination").value)]);
  } catch (error) {
    alert(error.message);
  }
}
$("searchButton").addEventListener("click", () => loadStays($("destination").value));
$("destination").addEventListener("keydown", event => { if (event.key === "Enter") loadStays($("destination").value); });
$("refreshBookings").addEventListener("click", loadBookings);
$("bookingForm").addEventListener("submit", submitBooking);
$("closeDialog").addEventListener("click", () => $("bookingDialog").close());
$("checkIn").min = new Date().toISOString().slice(0,10);
$("dialogCheckIn").min = new Date().toISOString().slice(0,10);
$("checkIn").addEventListener("change", () => { $("checkOut").min = $("checkIn").value; });
$("dialogCheckIn").addEventListener("change", () => { $("dialogCheckOut").min = $("dialogCheckIn").value; });
(async function init() {
  await loadStays();
  await loadBookings();
})();