import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, CalendarDays, Check, ChevronDown, Compass, Globe2,
  Heart, MapPin, Menu, Search, ShieldCheck, SlidersHorizontal,
  Sparkles, Users, X, BedDouble, LoaderCircle, RefreshCw, Ticket,
  CircleAlert, Clock3
} from "lucide-react";
import { api } from "./api.js";

const photos = {
  Spain: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1000&auto=format&fit=crop",
  Switzerland: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1000&auto=format&fit=crop",
  Portugal: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1000&auto=format&fit=crop"
};
const fallbackPhoto = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&auto=format&fit=crop";
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(Number(value || 0));
const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const localDateValue = (date = new Date()) => { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 10); };
const nightsBetween = (start, end) => Math.max(0, Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000));

function App() {
  const [stays, setStays] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [destination, setDestination] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recommended");
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [selectedStay, setSelectedStay] = useState(null);
  const [activeTab, setActiveTab] = useState("stays");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [form, setForm] = useState({ guestName: "", checkIn: "", checkOut: "", rooms: 1 });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [accommodationData, bookingData] = await Promise.all([
        api.accommodations(),
        api.bookings()
      ]);
      setStays(Array.isArray(accommodationData) ? accommodationData : []);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
    } catch (err) {
      setError(`${err.message}. Check that PostgreSQL, both services and the API Gateway are running.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const visibleStays = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = stays.filter((stay) =>
      `${stay.name} ${stay.destination}`.toLowerCase().includes(term)
    );
    if (sort === "price-low") result.sort((a, b) => a.nightlyRate - b.nightlyRate);
    if (sort === "price-high") result.sort((a, b) => b.nightlyRate - a.nightlyRate);
    if (sort === "availability") result.sort((a, b) => b.roomsAvailable - a.roomsAvailable);
    return result;
  }, [stays, search, sort]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "rooms" ? Number(value) : value }));
  };

  const openBooking = (stay) => {
    setSelectedStay(stay);
    setForm({ guestName: "", checkIn: "", checkOut: "", rooms: 1 });
    setNotice(null);
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    if (!selectedStay) return;
    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      setNotice({ type: "error", text: "Check-out must be after check-in." });
      return;
    }
    if (form.rooms > selectedStay.roomsAvailable) {
      setNotice({ type: "error", text: "There are not enough rooms available for this request." });
      return;
    }
    setBookingLoading(true);
    setNotice(null);
    try {
      const created = await api.createBooking({
        accommodationId: selectedStay.id,
        guestName: form.guestName.trim(),
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        rooms: form.rooms
      });
      setSelectedStay(null);
      setNotice({
        type: "success",
        text: `Booking confirmed. Your reference is ${created.reference}.`
      });
      setActiveTab("bookings");
      await loadData();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelBooking = async (reference) => {
    if (!window.confirm("Cancel this booking? The reserved rooms will be released.")) return;
    try {
      await api.cancelBooking(reference);
      setNotice({ type: "success", text: `Booking ${reference} was cancelled.` });
      await loadData();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  };

  const today = localDateValue();
  const estimatedNights = form.checkIn && form.checkOut ? nightsBetween(form.checkIn, form.checkOut) : 0;
  const estimatedTotal = selectedStay ? estimatedNights * Number(selectedStay.nightlyRate || 0) * Number(form.rooms || 1) : 0;

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setActiveTab("stays")}>
          <span className="brand-mark"><Compass size={21} /></span>
          <span className="brand-name">holidays</span>
        </a>
        <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">
          {mobileMenu ? <X /> : <Menu />}
        </button>
        <nav className={mobileMenu ? "main-nav open" : "main-nav"}>
          <button className={activeTab === "stays" ? "nav-link active" : "nav-link"} onClick={() => { setActiveTab("stays"); setMobileMenu(false); }}>Holidays</button>
          <button className={activeTab === "bookings" ? "nav-link active" : "nav-link"} onClick={() => { setActiveTab("bookings"); setMobileMenu(false); }}>My bookings</button>
          <a className="nav-link" href="#why" onClick={() => setMobileMenu(false)}>Why Holidays</a>
        </nav>
        <button className="topbar-cta" onClick={() => { setActiveTab("stays"); document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" }); }}>
          Find a holiday <ArrowRight size={16} />
        </button>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-image" />
          <div className="hero-shade" />
          <div className="hero-content">
            <div className="eyebrow light"><Sparkles size={14} /> MAKE ROOM FOR SOMEWHERE NEW</div>
            <h1>Your next<br /><em>great escape.</em></h1>
            <p>Discover inspiring places to stay and make more of every moment away.</p>
            <form className="search-panel" onSubmit={(event) => { event.preventDefault(); setSearch(destination); setActiveTab("stays"); document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" }); }}>
              <label className="search-input-wrap">
                <MapPin size={19} />
                <span><small>WHERE WOULD YOU LIKE TO GO?</small><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Search a destination or hotel" /></span>
              </label>
              <button className="search-submit" type="submit"><Search size={18} /> Search holidays</button>
            </form>
            <div className="hero-proof"><span><ShieldCheck size={15} /> Inventory checked at booking</span><span><Globe2 size={15} /> Handpicked places</span></div>
          </div>
          <div className="hero-caption"><span>01 / 03</span><span>THE WORLD IS WAITING</span></div>
        </section>

        <section className="intro-row" id="stays">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> THE HOLIDAY COLLECTION</div>
            <h2>Your next escape<br className="desktop-break" /> starts here.</h2>
            <p className="section-copy">Explore our collection and find a place that feels like part of the journey.</p>
          </div>
          <div className="collection-stats">
            <div><strong>{stays.length.toString().padStart(2, "0")}</strong><span>available places</span></div>
            <div><strong>{new Set(stays.map((stay) => stay.destination)).size.toString().padStart(2, "0")}</strong><span>destinations</span></div>
          </div>
        </section>

        <section className="destination-discovery" aria-label="Popular destinations">
          <div className="destination-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> A LITTLE INSPIRATION</div>
              <h2>Where will you go next?</h2>
              <p>Start with a place you love. Your next story is waiting.</p>
            </div>
            <button className="destination-view-all" onClick={() => { setSearch(""); setActiveTab("stays"); }}>View all stays <ArrowRight size={16} /></button>
          </div>
          <div className="destination-tiles">
            <button className="destination-tile destination-spain" onClick={() => { setDestination("Spain"); setSearch("Spain"); setActiveTab("stays"); document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" }); }}>
              <span className="destination-tile-copy"><small>COASTAL DAYS & CITY NIGHTS</small><strong>Spain</strong><em>Explore stays <ArrowRight size={15} /></em></span>
            </button>
            <button className="destination-tile destination-portugal" onClick={() => { setDestination("Portugal"); setSearch("Portugal"); setActiveTab("stays"); document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" }); }}>
              <span className="destination-tile-copy"><small>SLOW DOWN BY THE SEA</small><strong>Portugal</strong><em>Explore stays <ArrowRight size={15} /></em></span>
            </button>
            <button className="destination-tile destination-switzerland" onClick={() => { setDestination("Switzerland"); setSearch("Switzerland"); setActiveTab("stays"); document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" }); }}>
              <span className="destination-tile-copy"><small>FRESH AIR & BIG VIEWS</small><strong>Switzerland</strong><em>Explore stays <ArrowRight size={15} /></em></span>
            </button>
          </div>
        </section>

        {notice && (
          <div className={notice.type === "success" ? "notice success" : "notice error"} role="status">
            {notice.type === "success" ? <Check size={18} /> : <CircleAlert size={18} />}
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={16} /></button>
          </div>
        )}

        {activeTab === "stays" ? (
          <section className="listing-section">
            <div className="listing-toolbar">
              <div className="result-count">{loading ? "Loading the collection…" : `Showing ${visibleStays.length} of ${stays.length} stays`}</div>
              <div className="toolbar-controls">
                <label className="filter-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stays" /></label>
                <label className="sort-select"><SlidersHorizontal size={16} /><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="availability">Most available</option></select><ChevronDown size={14} /></label>
              </div>
            </div>

            {error && <div className="state-panel error-panel"><CircleAlert size={24} /><div><strong>We couldn't reach Holidays</strong><p>{error}</p><button className="text-button" onClick={loadData}><RefreshCw size={15} /> Try again</button></div></div>}
            {loading && <div className="loading-grid">{[1,2,3,4].map((item) => <div className="skeleton-card" key={item}><div /><span /><span /></div>)}</div>}
            {!loading && !error && visibleStays.length === 0 && <div className="state-panel"><Search size={24} /><div><strong>No holidays found</strong><p>Try another hotel name or destination.</p></div></div>}

            {!loading && !error && visibleStays.length > 0 && (
              <div className="stay-grid">
                {visibleStays.map((stay, index) => (
                  <article className="stay-card" key={stay.id}>
                    <div className="stay-photo-wrap">
                      <img src={photos[stay.destination] || fallbackPhoto} alt={stay.name} loading="lazy" />
                      <span className="photo-index">0{index + 1}</span>
                      <button className="favorite-button" aria-label="Save stay" onClick={(e) => e.currentTarget.classList.toggle("saved")}><Heart size={17} /></button>
                      <span className={stay.roomsAvailable > 0 ? "availability available" : "availability unavailable"}>{stay.roomsAvailable > 0 ? "Available now" : "Fully booked"}</span>
                    </div>
                    <div className="stay-card-body">
                      <div className="stay-location"><MapPin size={13} /> {stay.destination}</div>
                      <h3>{stay.name}</h3>
                      <div className="stay-meta"><span><BedDouble size={15} /> {stay.roomsAvailable} rooms left</span><span><Globe2 size={15} /> Explore</span></div>
                      <div className="stay-card-bottom"><div className="stay-price"><strong>{money(stay.nightlyRate)}</strong><span> / night</span></div><button className="round-arrow" disabled={stay.roomsAvailable < 1} onClick={() => openBooking(stay)} aria-label={`Book ${stay.name}`}><ArrowRight size={19} /></button></div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="bookings-section">
            <div className="bookings-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR TRAVEL PLANS</div><h2>My bookings.</h2><p>All your confirmed and cancelled stays, in one place.</p></div><button className="outline-button" onClick={loadData}><RefreshCw size={15} /> Refresh</button></div>
            {loading ? <div className="state-panel"><LoaderCircle className="spin" /><span>Loading bookings…</span></div> : bookings.length === 0 ? <div className="state-panel"><Ticket size={26} /><div><strong>No bookings yet</strong><p>Your next journey is waiting to happen.</p><button className="text-button" onClick={() => setActiveTab("stays")}>Search holidays <ArrowRight size={15} /></button></div></div> : (
              <div className="booking-list">
                {bookings.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((booking) => {
                  const stay = stays.find((item) => item.id === booking.accommodationId);
                  return <article className="booking-card" key={booking.reference}>
                    <div className="booking-icon"><Ticket size={22} /></div>
                    <div className="booking-main"><div className="booking-title-row"><h3>{stay?.name || `Stay #${booking.accommodationId}`}</h3><span className={booking.status === "CONFIRMED" ? "status confirmed" : "status cancelled"}>{booking.status}</span></div><p className="booking-reference">Reference: {booking.reference}</p><div className="booking-details"><span><Users size={14} /> {booking.rooms} room(s)</span><span><CalendarDays size={14} /> {dateLabel(booking.checkIn)} – {dateLabel(booking.checkOut)}</span><span><Clock3 size={14} /> {booking.guestName}</span></div></div>
                    {booking.status === "CONFIRMED" && <button className="cancel-button" onClick={() => cancelBooking(booking.reference)}>Cancel booking</button>}
                  </article>;
                })}
              </div>
            )}
          </section>
        )}

        <section className="why-section" id="why">
          <div className="why-heading"><div className="eyebrow light"><Sparkles size={14} /> THE HOLIDAYS DIFFERENCE</div><h2>Great holidays<br />start with <em>great stays.</em></h2></div>
          <div className="why-features"><div><span>01</span><ShieldCheck /><h3>Clear availability</h3><p>Room availability is checked by the booking service before a reservation is confirmed.</p></div><div><span>02</span><Compass /><h3>Places to discover</h3><p>Search holidays from a growing collection of destinations.</p></div><div><span>03</span><Heart /><h3>Plans in one place</h3><p>View your booking references and cancel a booking when plans change.</p></div></div>
        </section>
      </main>

      <footer className="footer"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Compass size={19} /></span><span className="brand-name">holidays</span></a><p>Your next escape starts here. © {new Date().getFullYear()} Holidays.</p><span>Developed by Avinesh</span></footer>

      {selectedStay && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedStay(null); }}>
          <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
            <div className="modal-top"><div><div className="eyebrow"><span className="eyebrow-dot" /> BOOK YOUR HOLIDAY</div><h2 id="booking-title">{selectedStay.name}</h2><p><MapPin size={14} /> {selectedStay.destination}</p></div><button className="modal-close" onClick={() => setSelectedStay(null)} aria-label="Close"><X /></button></div>
            <div className="modal-summary"><img src={photos[selectedStay.destination] || fallbackPhoto} alt="" /><div><strong>{money(selectedStay.nightlyRate)} <small>/ night</small></strong><span>{selectedStay.roomsAvailable} rooms currently available</span></div></div>
            <form className="booking-form" onSubmit={submitBooking}>
              <label className="full-field">Guest full name<input name="guestName" value={form.guestName} onChange={updateForm} required maxLength="120" placeholder="Name on the reservation" /></label>
              <div className="form-two"><label>Check-in<input type="date" name="checkIn" min={today} value={form.checkIn} onChange={updateForm} required /></label><label>Check-out<input type="date" name="checkOut" min={form.checkIn || today} value={form.checkOut} onChange={updateForm} required /></label></div>
              {estimatedNights > 0 && <div className="booking-estimate"><span>{estimatedNights} night(s) × {form.rooms} room(s)</span><strong>Estimated total {money(estimatedTotal)}</strong></div> }
              <label className="full-field">Number of rooms<select name="rooms" value={form.rooms} onChange={updateForm}>{Array.from({ length: Math.min(10, selectedStay.roomsAvailable) }, (_, i) => i + 1).map((count) => <option value={count} key={count}>{count} {count === 1 ? "room" : "rooms"}</option>)}</select></label>
              <p className="form-note"><ShieldCheck size={15} /> Your booking is confirmed only after the service successfully reserves inventory. This demo does not collect payment.</p>
              <button className="confirm-button" type="submit" disabled={bookingLoading}>{bookingLoading ? <><LoaderCircle className="spin" size={18} /> Confirming…</> : <>Confirm booking <ArrowRight size={17} /></>}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;