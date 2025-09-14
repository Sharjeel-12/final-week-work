const API_BASE = "/api";

function getToken() {
    return localStorage.getItem("token");
}

function normalizePath(p) {
    if (!p) return "";
    return p.startsWith("/") ? p : "/" + p;
}

async function safeJson(res) {
    try {
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("application/json") || ct.includes("problem+json")) {
            return await res.json();
        }
        return null;
    } catch { return null; }
}

async function safeText(res) { try { return await res.text(); } catch { return ""; } }

function extractValidationMessages(body) {
    const msgs = [];
    if (!body) return msgs;
    const e = body.errors || body.Errors;
    if (e && typeof e === "object") {
        if (Array.isArray(e)) e.forEach(x => x && msgs.push(String(x)));
        else Object.keys(e).forEach(k => {
            const arr = e[k];
            if (Array.isArray(arr)) arr.forEach(m => msgs.push(`${k}: ${m}`));
            else if (arr) msgs.push(`${k}: ${String(arr)}`);
        });
    }
    if (body.Message && !msgs.length) msgs.push(String(body.Message));
    if (body.error && !msgs.length) msgs.push(String(body.error));
    return msgs;
}

function buildErrorObject(res, body, rawText = "") {
    const err = {
        status: res.status,
        title:
            (body && (body.title || body.error || body.message || body.Message)) ||
            res.statusText || `HTTP ${res.status}`,
        detail: (body && (body.detail || body.message || body.Message)) || "",
        type: body?.type || null,
        traceId: body?.traceId || null,
        raw: body || null,
        rawText: rawText || null
    };
    const v = extractValidationMessages(body);
    if (v.length) { err.validation = v; err.detail = err.detail || v.join(" | "); }
    err.message = err.detail || err.title || `HTTP ${res.status}`;
    if (!err.detail && rawText) { err.detail = rawText; err.message = `${err.title} — ${rawText}`; }
    return err;
}

async function apiFetch(path, options = {}) {
    const token = getToken();
    const hasBody = options.body !== undefined && options.body !== null;

    const headers = {
        Accept: "application/json, application/problem+json, */*",
        ...(options.headers || {})
    };
    if (hasBody && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = API_BASE + normalizePath(path);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        let res = await fetch(url, { ...options, headers, signal: controller.signal });

        // Retry with looser Accept if server complains
        if (!res.ok && (res.status === 406 || res.status === 415)) {
            const retryHeaders = { ...headers, Accept: "*/*" };
            res = await fetch(url, { ...options, headers: retryHeaders, signal: controller.signal });
        }

        if (res.status === 204) return null;

        if (!res.ok) {
            const body = await safeJson(res);
            const text = body ? "" : await safeText(res);

            if (res.status === 401 && !/\/auth\/login$/i.test(path)) {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("email");
                localStorage.removeItem("tokenExp");
                window.location.href = "login.html";
                return;
            }
            throw buildErrorObject(res, body, text);
        }

        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("application/json")) return await res.json();
        const text = await res.text();
        return text || null;
    } catch (e) {
        if (e.name === "AbortError") {
            throw { status: 0, title: "Timeout", detail: "Request timed out.", message: "Request timed out." };
        }
        if (!(e && (e.title || e.detail || e.message))) {
            throw { status: 0, title: "Network error", detail: String(e?.message || e), message: String(e?.message || e) };
        }
        throw e;
    } finally {
        clearTimeout(timeout);
    }
}

function apiGet(path) { return apiFetch(path); }
function apiPost(path, body) { return apiFetch(path, { method: "POST", body: JSON.stringify(body) }); }
function apiPut(path, body) { return apiFetch(path, { method: "PUT", body: JSON.stringify(body) }); }
function apiDelete(path) { return apiFetch(path, { method: "DELETE" }); }
