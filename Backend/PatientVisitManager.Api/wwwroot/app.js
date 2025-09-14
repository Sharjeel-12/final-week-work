// ==============================
// app.js (Swagger-aware + null-skip DTOs)
// ==============================

document.addEventListener("DOMContentLoaded", () => {
    // ===== bootstrap =====
    const role = localStorage.getItem("role") || "";
    const email = localStorage.getItem("email") || "";
    setText("#userRole", `Role: ${role}`);
    setText("#userEmail", email);

    onClick("#logoutBtn", () => { localStorage.clear(); location.href = "login.html"; });
    onClick("#changePwdBtn", openChangePassword);

    if (role !== "Admin") document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");

    // tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => showTab(btn.dataset.tab, btn));
    });

    // search filters
    onInput("#patientSearch", e => filterTable("patientsTbl", e.target.value));
    onInput("#visitSearch", e => filterTable("visitsTbl", e.target.value));
    onInput("#doctorSearch", e => filterTable("doctorsTbl", e.target.value));

    // add buttons
    onClick("#addPatientBtn", () => openPatientModal());
    onClick("#addVisitBtn", () => openVisitModal());
    onClick("#addDoctorBtn", () => openDoctorModal());
    onClick("#refreshFeesBtn", loadFees);

    (async () => {
        try { await ensureSwagger(); } catch (e) { console.warn("Swagger discovery failed, using fallbacks.", e); }
        try { await Promise.all([loadPatients(), loadVisits(), loadDoctors(), loadFees()]); }
        catch (err) { console.error("Initial load failed:", err); alert(humanizeError(err, "Failed to load")); }
    })();
});

// ===== DOM helpers =====
function $(s) { return document.querySelector(s); }
function setText(sel, txt) { const el = $(sel); if (el) el.textContent = txt; }
function onClick(sel, fn) { const el = $(sel); if (el) el.onclick = fn; }
function onInput(sel, fn) { const el = $(sel); if (el) el.addEventListener("input", fn); }

// Errors
function humanizeError(e, fallback) {
    const parts = [];
    if (e?.status) parts.push(`HTTP ${e.status}`);
    if (e?.title) parts.push(e.title);
    if (e?.detail) parts.push(e.detail);
    if (e?.validation?.length) parts.push(e.validation.join(" | "));
    if (!parts.length) parts.push(e?.message || fallback || "Operation failed");
    return parts.join(" — ");
}

// ===== tabs =====
function showTab(name, btn) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".tab-pane").forEach(p => p.style.display = "none");
    const pane = document.getElementById(`tab-${name}`);
    if (pane) pane.style.display = "";
}

// ===== filtering =====
function filterTable(tblId, q) {
    q = (q || "").toLowerCase();
    document.querySelectorAll(`#${tblId} tbody tr`).forEach(r => {
        r.style.display = r.innerText.toLowerCase().includes(q) ? "" : "none";
    });
}

// ==============================
// Swagger route discovery
// ==============================
let swaggerSpec = null;
let routeCache = {}; // { patients: { create, updateId, updateVerb, updateBody, updateBodyVerb }, ... }

async function ensureSwagger() {
    if (swaggerSpec) return;
    const res = await fetch("/swagger/v1/swagger.json", { headers: { Accept: "application/json,*/*" } });
    if (!res.ok) throw new Error(`Swagger fetch failed ${res.status}`);
    swaggerSpec = await res.json();
    buildRouteCacheFromSwagger();
}

function buildRouteCacheFromSwagger() {
    const entities = ["patients", "visits", "doctors"];
    routeCache = {}; for (const ent of entities) routeCache[ent] = {};

    const paths = swaggerSpec?.paths || {};
    for (const rawPath in paths) {
        const item = paths[rawPath] || {};
        const lower = rawPath.toLowerCase();
        for (const ent of entities) {
            if (!lower.includes(`/${ent}`)) continue;

            // create: POST collection (no id)
            if (item.post && !/{\w+}/.test(rawPath)) routeCache[ent].create = rawPath;

            // update with id: prefer PUT/PATCH/POST
            if (/{\w+}/.test(rawPath)) {
                if (item.put) { routeCache[ent].updateId = rawPath; routeCache[ent].updateVerb = "put"; }
                if (item.patch) { routeCache[ent].updateId = rawPath; routeCache[ent].updateVerb = "patch"; }
                if (!routeCache[ent].updateId && item.post) {
                    routeCache[ent].updateId = rawPath; routeCache[ent].updateVerb = "post";
                }
            }

            // update without id (body contains id)
            if (!/{\w+}/.test(rawPath) && (item.put || item.patch)) {
                routeCache[ent].updateBody = rawPath;
                routeCache[ent].updateBodyVerb = item.put ? "put" : "patch";
            }
        }
    }
}

function pathWithId(template, id) {
    return template.replace(/\{\w+\}/, String(id));
}

// ==============================
// data loads
// ==============================
let visitsCache = [];

async function loadPatients() {
    visitsCache = await apiGet("/visits") || [];
    const visitIndex = Object.fromEntries(visitsCache.map(v => [v.visitID, v]));
    const list = await apiGet("/patients");
    const tbody = $("#patientsTbl tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    (list || []).forEach(p => {
        const fee = p.visitID ? visitIndex[p.visitID]?.visitFee : null;
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${p.patientID}</td>
      <td>${escapeHtml(p.patientName)}</td>
      <td>${escapeHtml(p.patientEmail)}</td>
      <td>${escapeHtml(p.patientPhone)}</td>
      <td>${p.visitID ?? ""}</td>
      <td>${fee != null ? (Number(fee).toFixed ? Number(fee).toFixed(2) : fee) : ""}</td>
      <td class="actions"></td>`;
        addRowActions(tr.querySelector(".actions"), {
            edit: () => openPatientModal(p),
            del: () => deletePatient(p.patientID)
        });
        tbody.appendChild(tr);
    });
}

async function loadVisits() {
    const list = await apiGet("/visits");
    const tbody = $("#visitsTbl tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    (list || []).forEach(v => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${v.visitID}</td>
      <td>${escapeHtml(v.visitType)}</td>
      <td>${v.visitDuration}</td>
      <td>${formatDate(v.visitDate)}</td>
      <td>${formatTime(v.visitTime)}</td>
      <td>${v.visitFee?.toFixed ? v.visitFee.toFixed(2) : v.visitFee}</td>
      <td class="actions"></td>`;
        addRowActions(tr.querySelector(".actions"), {
            edit: () => openVisitModal(v),
            del: () => deleteVisit(v.visitID)
        });
        tbody.appendChild(tr);
    });
}

async function loadDoctors() {
    const list = await apiGet("/doctors");
    const tbody = $("#doctorsTbl tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    (list || []).forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${d.doctorID}</td>
      <td>${escapeHtml(d.doctorName)}</td>
      <td>${escapeHtml(d.doctorEmail)}</td>
      <td>${escapeHtml(d.doctorPhone)}</td>
      <td>${d.visitID ?? ""}</td>
      <td class="actions"></td>`;
        addRowActions(tr.querySelector(".actions"), {
            edit: () => openDoctorModal(d),
            del: () => deleteDoctor(d.doctorID)
        });
        tbody.appendChild(tr);
    });
}

async function loadFees() {
    const list = await apiGet("/feeschedule");
    const tbody = $("#feesTbl tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    (list || []).forEach(f => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${f.feeID}</td><td>${escapeHtml(f.visitType)}</td><td>${f.feePerMinute}</td>`;
        tbody.appendChild(tr);
    });
}

// ===== role-gated row actions =====
function addRowActions(cell, handlers) {
    if (!cell) return;
    cell.innerHTML = "";
    const isAdmin = (localStorage.getItem("role") || "") === "Admin";
    if (!isAdmin) { cell.textContent = ""; return; }

    if (handlers.edit) {
        const e = document.createElement("button");
        e.textContent = "Edit";
        e.onclick = handlers.edit;
        cell.appendChild(e);
    }
    if (handlers.del) {
        const d = document.createElement("button");
        d.textContent = "Delete";
        d.style.marginLeft = "6px";
        d.onclick = handlers.del;
        cell.appendChild(d);
    }
}

// ===== DTO & refresh helpers =====
// IMPORTANT: skip null/"" entirely to avoid backend 500s on non-nullable DTO properties
function cleanDto(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) {
        if (v === undefined) continue;
        if (typeof v === "number" && Number.isNaN(v)) continue;
        if (v === "" || v === null) continue;   // <-- omit null/empty
        out[k] = v;
    }
    return out;
}

async function safeRefresh(loaderFn, what) {
    try { await loaderFn(); }
    catch (e) { console.warn(`Refresh ${what} failed:`, e); }
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function singularize(name) { if (/s$/i.test(name)) name = name.slice(0, -1); return name.replace(/^[a-z]/, c => c.toLowerCase()); }

// ==============================
// CREATE / UPDATE using Swagger
// ==============================
async function createEntity(entity, body) {
    const dto = cleanDto(body);
    const rc = routeCache[entity];
    if (rc && rc.create) {
        const method = (rc.createVerb || "post").toUpperCase();
        return call(method, rc.create, dto);
    }
    // conservative fallbacks
    const attempts = [
        { m: "POST", p: `/api/${capitalize(entity)}` },
        { m: "POST", p: `/api/${entity}` }
    ];
    return firstSuccess(attempts, dto);
}

async function updateEntity(entity, id, body) {
    const dto = cleanDto({ ...body, [`${singularize(entity)}ID`]: id });
    const rc = routeCache[entity];

    if (rc) {
        if (rc.updateId) {
            const method = (rc.updateVerb || "put").toUpperCase();
            return call(method, pathWithId(rc.updateId, id), dto);
        }
        if (rc.updateBody) {
            const method = (rc.updateBodyVerb || "put").toUpperCase();
            return call(method, rc.updateBody, dto);
        }
    }
    const attempts = [
        { m: "PUT", p: `/api/${capitalize(entity)}/${id}` },
        { m: "PUT", p: `/api/${entity}/${id}` }
    ];
    return firstSuccess(attempts, dto);
}

async function call(method, path, body) {
    // swagger paths are absolute (e.g., /api/Patients). api.js expects app-relative without /api.
    const rel = path.replace(/^\/api/i, "");
    if (method === "POST") return apiPost(rel, body);
    else if (method === "PUT") return apiPut(rel, body);
    else return apiFetch(rel, { method, body: JSON.stringify(body) });
}

async function firstSuccess(attempts, body) {
    let lastErr = null;
    for (const a of attempts) {
        try {
            const rel = a.p.replace(/^\/api/i, "");
            if (a.m === "POST") return await apiPost(rel, body);
            else if (a.m === "PUT") return await apiPut(rel, body);
            else return await apiFetch(rel, { method: a.m, body: JSON.stringify(body) });
        } catch (e) {
            if (e?.status === 401 || e?.status === 403) throw e;
            lastErr = e;
            console.warn(`${a.m} ${a.p} failed:`, e);
        }
    }
    throw lastErr || new Error("All route attempts failed");
}

// ==============================
// modal + forms
// ==============================
function openModal(title, bodyHtml, onSave) {
    setText("#modalTitle", title);
    const body = $("#modalBody");
    if (body) body.innerHTML = bodyHtml;
    const errEl = $("#modalError");
    if (errEl) { errEl.style.display = "none"; errEl.textContent = ""; }

    const modal = $("#modal"), backdrop = $("#modalBackdrop");
    const saveBtn = $("#modalSave"), cancelBtn = $("#modalCancel");

    if (modal) {
        modal.style.display = "block";
        document.body.classList.add("modal-open");
    }

    function closeModal() {
        if (modal) modal.style.display = "none";
        document.body.classList.remove("modal-open");
    }

    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (backdrop) backdrop.onclick = closeModal;

    if (saveBtn) {
        saveBtn.onclick = async () => {
            try { await onSave?.(); closeModal(); }
            catch (e) {
                console.error("Save failed:", e);
                if (errEl) { errEl.style.display = "block"; errEl.textContent = humanizeError(e, "Save failed"); }
                else alert(humanizeError(e, "Save failed"));
            }
        };
    }
}

// Patients
function openPatientModal(p) {
    const isEdit = !!p;
    openModal(isEdit ? "Edit Patient" : "Add Patient", `
    <label>Name *</label><input id="pName" value="${p?.patientName || ""}" />
    <label>Email *</label><input id="pEmail" type="email" value="${p?.patientEmail || ""}" />
    <label>Phone *</label><input id="pPhone" value="${p?.patientPhone || ""}" />
    <label>VisitID (optional)</label><input id="pVisitID" type="number" value="${p?.visitID ?? ""}" />
    <label>Description</label><textarea id="pDesc">${p?.patientDescription || ""}</textarea>
  `, async () => {
        if (!val("#pName")) throw { title: "Validation", detail: "Name is required" };
        if (!val("#pEmail")) throw { title: "Validation", detail: "Email is required" };
        if (!val("#pPhone")) throw { title: "Validation", detail: "Phone is required" };

        const dto = cleanDto({
            patientName: val("#pName"),
            patientEmail: val("#pEmail"),
            patientPhone: val("#pPhone"),
            visitID: numOrNull("#pVisitID"),        // omitted if null/empty
            patientDescription: val("#pDesc")       // omitted if ""
        });

        if (isEdit) await updateEntity("patients", p.patientID, { ...dto, patientID: p.patientID });
        else await createEntity("patients", dto);

        await safeRefresh(loadPatients, "patients");
    });
}

// Visits
function openVisitModal(v) {
    const isEdit = !!v;
    openModal(isEdit ? "Edit Visit" : "Add Visit", `
    <label>Type *</label><input id="vType" value="${v?.visitType || ""}" />
    <label>Duration (min) *</label><input id="vDuration" type="number" value="${v?.visitDuration ?? ""}" />
    <label>Fee *</label><input id="vFee" type="number" step="0.01" value="${v?.visitFee ?? ""}" />
    <label>Date *</label><input id="vDate" type="date" value="${toInputDate(v?.visitDate)}" />
    <label>Time *</label><input id="vTime" type="time" value="${toInputTime(v?.visitTime)}" />
  `, async () => {
        if (!val("#vType")) throw { title: "Validation", detail: "Visit Type is required" };
        const dur = Number(val("#vDuration")); if (!dur || dur < 0) throw { title: "Validation", detail: "Duration must be a positive number" };
        const fee = Number(val("#vFee")); if (Number.isNaN(fee)) throw { title: "Validation", detail: "Fee must be a number" };
        if (!val("#vDate")) throw { title: "Validation", detail: "Date is required" };
        if (!val("#vTime")) throw { title: "Validation", detail: "Time is required" };

        const dto = cleanDto({
            visitType: val("#vType"),
            visitDuration: dur,
            visitFee: fee,
            visitDate: toIsoDate($("#vDate")?.value), // YYYY-MM-DD
            visitTime: toHms($("#vTime")?.value)      // HH:mm:ss
        });

        if (isEdit) await updateEntity("visits", v.visitID, { ...dto, visitID: v.visitID, visitTypeID: v.visitTypeID ?? null });
        else await createEntity("visits", dto);

        await safeRefresh(loadVisits, "visits");
    });
}

// Doctors
function openDoctorModal(d) {
    const isEdit = !!d;
    openModal(isEdit ? "Edit Doctor" : "Add Doctor", `
    <label>Name *</label><input id="dName" value="${d?.doctorName || ""}" />
    <label>Email *</label><input id="dEmail" type="email" value="${d?.doctorEmail || ""}" />
    <label>Phone *</label><input id="dPhone" value="${d?.doctorPhone || ""}" />
    <label>VisitID (optional)</label><input id="dVisitID" type="number" value="${d?.visitID ?? ""}" />
    <label>Specialization</label><input id="dSpec" value="${d?.specialization || ""}" />
  `, async () => {
        if (!val("#dName")) throw { title: "Validation", detail: "Name is required" };
        if (!val("#dEmail")) throw { title: "Validation", detail: "Email is required" };
        if (!val("#dPhone")) throw { title: "Validation", detail: "Phone is required" };

        const dto = cleanDto({
            doctorName: val("#dName"),
            doctorEmail: val("#dEmail"),
            doctorPhone: val("#dPhone"),
            visitID: numOrNull("#dVisitID"),     // omitted if null/empty
            specialization: val("#dSpec")        // omitted if ""
        });

        if (isEdit) await updateEntity("doctors", d.doctorID, { ...dto, doctorID: d.doctorID });
        else await createEntity("doctors", dto);

        await safeRefresh(loadDoctors, "doctors");
    });
}

// deletes
async function deletePatient(id) { if (!confirm("Delete this patient?")) return; await apiDelete(`/patients/${id}`); await safeRefresh(loadPatients, "patients"); }
async function deleteVisit(id) { if (!confirm("Delete this visit?")) return; await apiDelete(`/visits/${id}`); await safeRefresh(loadVisits, "visits"); }
async function deleteDoctor(id) { if (!confirm("Delete this doctor?")) return; await apiDelete(`/doctors/${id}`); await safeRefresh(loadDoctors, "doctors"); }

// change password
function openChangePassword() {
    openModal("Change Password", `
    <label>Current Password</label><input id="cpCur" type="password" />
    <label>New Password</label><input id="cpNew" type="password" />
  `, async () => {
        await apiPost("/auth/change-password", { currentPassword: val("#cpCur"), newPassword: val("#cpNew") });
        alert("Password changed");
    });
}

// ===== small utils =====
function val(sel) { return (document.querySelector(sel)?.value ?? "").trim(); }
function num(sel) { const v = val(sel); return v === "" ? NaN : Number(v); }
function numOrNull(sel) { const v = val(sel); return v === "" ? null : Number(v); }
function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, m => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[m]);
}
function formatDate(iso) { return iso ? String(iso).split("T")[0] : ""; }
function toInputDate(iso) { return formatDate(iso); }
function toInputTime(hms) { if (!hms) return ""; const p = String(hms).split(":"); return `${p[0].padStart(2, "0")}:${p[1].padStart(2, "0")}`; }
function formatTime(hms) { return toInputTime(hms); }
function toIsoDate(inp) { return inp ? inp : null; }
function toHms(inp) { return inp && inp.length <= 5 ? inp + ":00" : (inp || null); }
