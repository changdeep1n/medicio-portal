/* ======================================================
   Portal JS (Demo mode)
   Replace localStorage parts with real backend APIs later
====================================================== */

const STORAGE_USERS = "portal_users";
const STORAGE_SESSION = "portal_session";
const STORAGE_APPTS = "portal_appointments";

/* ---------------------------
   Helpers
--------------------------- */
function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]");
}
function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}
function setSession(user) {
  localStorage.setItem(STORAGE_SESSION, JSON.stringify(user));
}
function getSession() {
  return JSON.parse(localStorage.getItem(STORAGE_SESSION) || "null");
}
function requireAuth() {
  const user = getSession();
  if (!user) window.location.href = "login.html";
  return user;
}
function logout() {
  localStorage.removeItem(STORAGE_SESSION);
  window.location.href = "login.html";
}

/* ---------------------------
   Register
--------------------------- */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const patientId = document.getElementById("patientId").value.trim();
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // TODO BACKEND:
    // POST /api/auth/register  {patientId, fullName, email, password}

    const users = getUsers();
    if (users.find(u => u.patientId === patientId)) {
      alert("Patient ID already exists.");
      return;
    }

    users.push({
      patientId, fullName, email, password,
      medicalHistory: [
        "2024-03-02 | Allergy - Pollen",
        "2025-06-10 | Hypertension monitoring"
      ],
      prescriptions: [
        "Amlodipine 5mg - daily",
        "Cetirizine 10mg - when needed"
      ],
      visits: [
        {
          date: "2025-07-14",
          doctor: "Dr. Nurul",
          summary: "Blood pressure stable. Continue meds."
        }
      ],
      files: [
        { name: "Blood Test Report (July 2025).pdf", url: "#" },
        { name: "Prescription (July 2025).pdf", url: "#" }
      ]
    });

    saveUsers(users);
    alert("Registration successful! Please log in.");
    window.location.href = "login.html";
  });
}

/* ---------------------------
   Login
--------------------------- */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const patientId = document.getElementById("loginPatientId").value.trim();
    const password = document.getElementById("loginPassword").value;

    // TODO BACKEND:
    // POST /api/auth/login {patientId, password}
    // receive token/session

    const users = getUsers();
    const user = users.find(u => u.patientId === patientId && u.password === password);

    if (!user) {
      const err = document.getElementById("loginError");
      err.textContent = "Invalid Patient ID or password.";
      err.classList.remove("d-none");
      return;
    }

    setSession({ patientId: user.patientId, fullName: user.fullName });
    window.location.href = "dashboard.html";
  });
}

/* ---------------------------
   Logout button
--------------------------- */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", logout);

/* ---------------------------
   Dashboard data render
--------------------------- */
if (window.location.pathname.includes("dashboard.html")) {
  const session = requireAuth();
  const users = getUsers();
  const user = users.find(u => u.patientId === session.patientId);

  document.getElementById("patientName").textContent = user.fullName;

  const mh = document.getElementById("medicalHistoryList");
  user.medicalHistory.forEach(item => {
    mh.innerHTML += `<li class="list-group-item">${item}</li>`;
  });

  const pr = document.getElementById("prescriptionList");
  user.prescriptions.forEach(item => {
    pr.innerHTML += `<li class="list-group-item">${item}</li>`;
  });

  const vs = document.getElementById("visitSummaryList");
  user.visits.forEach(v => {
    vs.innerHTML += `
      <div class="border-bottom py-2">
        <strong>${v.date}</strong> with ${v.doctor}<br/>
        ${v.summary}
      </div>
    `;
  });

  // TODO BACKEND:
  // GET /api/patient/{id}/history
  // GET /api/patient/{id}/prescriptions
  // GET /api/patient/{id}/visits
}

/* ---------------------------
   Appointments
--------------------------- */
if (window.location.pathname.includes("appointments.html")) {
  const session = requireAuth();

  const fakeDoctors = [
    { id: 1, name: "Dr. Aiman", specialty: "Cardiology", slots: ["09:00", "11:00", "15:00"] },
    { id: 2, name: "Dr. Nurul", specialty: "Dermatology", slots: ["10:00", "14:00", "16:30"] },
    { id: 3, name: "Dr. Kumar", specialty: "General Medicine", slots: ["08:30", "13:00", "17:00"] },
  ];

  const resultsDiv = document.getElementById("doctorResults");
  const myAppointments = document.getElementById("myAppointments");

  function renderDoctors(list) {
    resultsDiv.innerHTML = "";
    list.forEach(d => {
      const slotButtons = d.slots.map(s =>
        `<button class="btn btn-sm btn-outline-primary me-2 mb-2"
                 onclick="bookSlot(${d.id},'${s}')">${s}</button>`
      ).join("");

      resultsDiv.innerHTML += `
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h5>${d.name}</h5>
              <p class="text-muted small">${d.specialty}</p>
              <div>${slotButtons}</div>
            </div>
          </div>
        </div>
      `;
    });
  }

  window.bookSlot = function(doctorId, time) {
    const date = document.getElementById("dateSearch").value || new Date().toISOString().slice(0,10);
    const doctor = fakeDoctors.find(d => d.id === doctorId);

    const appts = JSON.parse(localStorage.getItem(STORAGE_APPTS) || "[]");
    appts.push({
      patientId: session.patientId,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      date, time, status: "Booked"
    });
    localStorage.setItem(STORAGE_APPTS, JSON.stringify(appts));
    renderMyAppointments();
    alert(`Appointment booked with ${doctor.name} on ${date} at ${time}`);
  };

  function renderMyAppointments() {
    const appts = JSON.parse(localStorage.getItem(STORAGE_APPTS) || "[]")
      .filter(a => a.patientId === session.patientId);

    myAppointments.innerHTML = "";
    appts.forEach(a => {
      myAppointments.innerHTML += `
        <li class="list-group-item">
          <strong>${a.date} ${a.time}</strong> — ${a.doctorName} (${a.specialty})
          <span class="badge bg-success float-end">${a.status}</span>
        </li>
      `;
    });
  }

  document.getElementById("searchDoctorsBtn").addEventListener("click", () => {
    const q = document.getElementById("doctorSearch").value.toLowerCase();
    const filtered = fakeDoctors.filter(d =>
      d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q)
    );
    renderDoctors(filtered);
  });

  renderDoctors(fakeDoctors);
  renderMyAppointments();

  // TODO BACKEND:
  // GET /api/doctors?search=...
  // GET /api/doctors/{id}/slots?date=...
  // POST /api/appointments
}

/* ---------------------------
   Payments
--------------------------- */
const paymentForm = document.getElementById("paymentForm");
if (paymentForm) {
  requireAuth();
  paymentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const service = document.getElementById("paymentService").value;
    const amount = document.getElementById("paymentAmount").value;
    const status = document.getElementById("paymentStatus");

    status.innerHTML = `<div class="text-success">
      Payment initiated for <strong>${service}</strong> - RM${amount}.
      (Replace with gateway call)
    </div>`;

    // TODO BACKEND:
    // POST /api/payments/create-session {service, amount}
    // redirect to Stripe/PayPal/FPX URL
  });
}

/* ---------------------------
   Downloads
--------------------------- */
if (window.location.pathname.includes("downloads.html")) {
  const session = requireAuth();
  const users = getUsers();
  const user = users.find(u => u.patientId === session.patientId);

  const dl = document.getElementById("downloadList");
  user.files.forEach(f => {
    dl.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        ${f.name}
        <a href="${f.url}" class="btn btn-sm btn-primary" download>Download</a>
      </li>
    `;
  });

  // TODO BACKEND:
  // GET /api/patient/{id}/files
  // Signed URL / token-based secure download
}
