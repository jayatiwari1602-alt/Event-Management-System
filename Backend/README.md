# EventPro Backend

Node.js + Express backend for the Event Manager / EventPro frontend (HTML/CSS/JS + Bootstrap).

**Data store:** in-memory (no DB install required — boots instantly, resets on restart).
**Auth:** email/password with JWT bearer tokens.

The in-memory store lives behind a single `db.js` module (`src/store/db.js`). If you outgrow it later, you only need to rewrite that file to talk to Mongo/Postgres/whatever — every controller calls `db.events.insert(...)`, `db.users.findOne(...)`, etc., not raw queries, so the swap doesn't touch route logic.

---

## 1. Setup

```bash
npm install
cp .env.example .env
npm run dev        # auto-restarts on file changes (node --watch)
# or: npm start
```

Server runs at `http://localhost:4000`. Demo data seeds automatically on first boot.

**Seeded logins** (password for both: `password123`):
- Organizer: `alex.morgan@eventpro.com`
- Attendee: `sarah.jenkins@techglobal.com`

Health check: `GET http://localhost:4000/health`

---

## 2. Connecting your HTML/CSS/JS frontend

Every response has the same shape, so write one fetch wrapper and reuse it everywhere:

```js
// api.js — drop this into your frontend, include with <script src="api.js">
const API_BASE = "http://localhost:4000/api";

async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("eventpro_token");
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error?.message || "Request failed");
  }
  return json.data; // meta (pagination etc.) is at json.meta if you need it
}

// Example usage in your existing JS:
async function loadDashboard() {
  try {
    const summary = await apiRequest("/analytics/dashboard");
    document.querySelector("#revenue").textContent = `$${summary.revenue.toLocaleString()}`;
  } catch (err) {
    console.error(err);
  }
}
```

**Login flow:**
```js
const { user, token } = await apiRequest("/auth/login", {
  method: "POST",
  auth: false,
  body: { email, password },
});
localStorage.setItem("eventpro_token", token);
```

**File uploads (event banners)** need `FormData`, not JSON — handle that one separately:
```js
const formData = new FormData();
formData.append("banner", fileInputEl.files[0]);

const res = await fetch(`${API_BASE}/events/upload-banner`, {
  method: "POST",
  headers: { Authorization: `Bearer ${localStorage.getItem("eventpro_token")}` },
  body: formData, // do NOT set Content-Type manually, browser sets the multipart boundary
});
const { data } = await res.json(); // data.url -> save this string on the event record
```

Uploaded banners are served back at `http://localhost:4000<data.url>`.

**CORS:** wide open (`*`) by default for local dev. Set `CLIENT_ORIGIN` in `.env` to your frontend's origin before deploying anywhere real.

---

## 3. Response shape

```json
// success
{ "success": true, "data": { ... }, "meta": { "total": 42, "page": 1 } }

// error
{ "success": false, "error": { "message": "...", "code": "VALIDATION_ERROR" } }
```

HTTP status codes are also set correctly (200/201/400/401/403/404/409/422/500) if you prefer branching on those instead.

---

## 4. Roles

Two roles: `organizer` and `attendee` (an `admin` role also exists with the same permissions as organizer plus cross-account access). Signup defaults to `attendee` unless you pass `"role": "organizer"`.

---

## 5. Full API reference

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/signup` | – | Create account. Body: `email, password, firstName, lastName?, role?, organization?` |
| POST | `/login` | – | Body: `email, password` → `{ user, token }` |
| GET | `/me` | ✓ | Current user |
| PATCH | `/me` | ✓ | Update profile (firstName, lastName, phone, timezone, bio, organization, avatarUrl, notificationPrefs) |
| POST | `/change-password` | ✓ | Body: `currentPassword, newPassword` |

### Events — `/api/events`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | – | Discovery list. Query: `keyword, category, timeframe, minPrice, maxPrice, status, organizerId, page, limit` |
| GET | `/:id` | – | Detail page — includes `ticketTypes`, `relatedEvents`, `registeredCount`, `capacityStatus` |
| GET | `/directory/summary` | organizer | Stat cards for Event Directory page |
| POST | `/` | organizer | Create event (wizard step 1: Basics) |
| PATCH | `/:id` | organizer | Update event (wizard steps 2/3, or general edits) |
| DELETE | `/:id` | organizer | Delete event |
| POST | `/upload-banner` | organizer | multipart/form-data, field name `banner` → `{ url }` |

### Tickets — `/api/tickets`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/event/:eventId` | – | List ticket types (VIP/General/Early Bird) for an event |
| POST | `/event/:eventId` | organizer | Create ticket type: `name, price, quantity, description` |
| PATCH | `/:id` | organizer | Update ticket type |
| DELETE | `/:id` | organizer | Delete ticket type |

### Registrations — `/api/registrations`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | ✓ | Register/buy ticket. Body: `eventId, ticketTypeId?` |
| GET | `/me` | ✓ | "My Events" / Registered Events page |
| GET | `/event/:eventId` | organizer | All registrations for an event (filter via `?status=`) |
| GET | `/:id/qr-image` | ✓ | Returns `{ qrImage }` base64 PNG for the digital pass |
| PATCH | `/:id/approve` | organizer | Approve pending registration |
| PATCH | `/:id/reject` | organizer | Reject pending registration |
| PATCH | `/:id/cancel` | ✓ | Attendee cancels their own registration |

### Check-ins — `/api/checkins`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | organizer | Body: `{ qrCode }` — scan-based check-in |
| POST | `/manual` | organizer | Body: `{ registrationId }` — "Manual Entry" button |
| GET | `/event/:eventId` | organizer | Real-time check-in feed |
| GET | `/event/:eventId/stats` | organizer | `{ totalRegistrations, checkedIn, attendanceRate }` |

### Certificates — `/api/certificates`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/templates` | – | Available templates (Elite Platinum, Modern, Classic) |
| POST | `/preview` | organizer | Body: `registrationId, trackName?` → live preview with filled `[[variables]]` |
| POST | `/generate-batch` | organizer | Body: `eventId, templateId, ticketTypeFilter?, deliveryModes` → bulk-issues to all confirmed registrants |
| GET | `/event/:eventId` | organizer | Issued certs for an event |
| GET | `/me` | ✓ | Attendee's own earned certificates |

### Analytics — `/api/analytics`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard` | ✓ | Top stat cards (revenue, users, registrations, upcoming/completed) |
| GET | `/registration-trends` | ✓ | Query: `eventId?, days=7` → daily series for the line chart |
| GET | `/revenue-by-segment` | organizer | Enterprise/Professional/Individual/Add-ons breakdown |
| GET | `/capacity-thresholds` | organizer | "Upcoming Event Thresholds" table |

### Venues — `/api/venues`
Standard CRUD: `GET /`, `POST /` (organizer), `PATCH /:id` (organizer), `DELETE /:id` (organizer)

### Team — `/api/team`
`GET /` , `POST /invite` (`email, role`), `DELETE /:id` — all organizer-only

### Activity — `/api/activity`
`GET /?limit=20` — "Recent Activity" feed, auto-populated by other actions (registrations, check-ins, etc.)

### Notifications — `/api/notifications`
`GET /` (returns `meta.unreadCount`), `PATCH /:id/read`, `PATCH /read-all`

---

## 6. Project structure

```
src/
  app.js              Express app, middleware wiring
  server.js            entry point, seeds data, starts listener
  config.js            env var loading
  store/db.js          in-memory collections (swap point for a real DB later)
  data/seed.js          demo data matching the screenshots
  middleware/
    auth.js             requireAuth / requireRole / optionalAuth
    validate.js         tiny body validator
    upload.js           multer config for banner uploads
    errorHandler.js      404 + central error handler
  utils/
    auth.js             bcrypt + jwt helpers
    qr.js               QR payload + image generation
    response.js          ok()/created()/fail()/ApiError — consistent response shape
  controllers/          one file per resource, all business logic lives here
  routes/                thin route → controller wiring, mounted in routes/index.js
```

## 7. Known simplifications (by design, for this iteration)

- **In-memory store** — all data is lost on server restart. Swap `store/db.js` for a real DB when you need persistence across restarts.
- **No OAuth** — only email/password JWT, even though the UI shows Google/Apple buttons. Wire those later via Passport.js if needed.
- **Single-process** — fine for a final-year project demo; not meant for concurrent production traffic.
