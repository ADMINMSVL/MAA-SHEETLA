import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./InwardOutwardNote.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const GIN_API   = `${API_URL}/api/goods-inward-note`;
const PO_API    = `${API_URL}/api/purchase-orders`;
const PARTY_API = `${API_URL}/api/parties`;
const SITE_API  = `${API_URL}/api/sites`;

/*
  STATUS VALUES:
    "Open"        – vehicle arrived, entry open
    "Weighted"    – weighment done, waiting for outward
    "OutPending"  – vehicle out pending approval
    "Closed"      – vehicle has exited / transaction complete

  DEFAULT VIEW (on load / reset):
    Shows only Open, Weighted, OutPending.
    Closed records are hidden unless the user explicitly searches for them.
*/

const STATUS_OPTIONS = ["Open", "Weighted", "OutPending", "Closed"];

// Statuses considered "active" (shown by default without explicit search)
const ACTIVE_STATUSES = ["Open", "Weighted", "OutPending"];

const blankFilters = {
  fromDate: "",
  toDate: "",
  inOutType: "",
  status: "",          // "" = default (shows ACTIVE_STATUSES only)
  ginNumber: "",
  poCpoNo: "",
  transactionCategory: "",
  partyCode: "",
  partyName: "",
  partyDoc: "",
  vehicleNo: "",
  site: "",
};

/* ─────────────────────────────────────────────
   TypeAhead dropdown
───────────────────────────────────────────── */
const TypeAhead = ({ value, onChange, suggestions, onSelect, placeholder, name }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = value
    ? suggestions.filter((s) => s?.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => { onChange(e); setShow(true); }}
        onFocus={() => setShow(true)}
        placeholder={placeholder || "Type to search…"}
        autoComplete="off"
      />
      {show && filtered.length > 0 && (
        <ul style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)", margin: 0, padding: 0,
          listStyle: "none", maxHeight: 220, overflowY: "auto",
        }}>
          {filtered.map((s) => (
            <li
              key={s}
              onMouseDown={() => { onSelect(s); setShow(false); }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "#1e293b" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Intransit PO Modal
───────────────────────────────────────────── */
const IntransitPOModal = ({ pos, onSelect, onClose }) => (
  <div className="gin-modal-overlay" onClick={onClose}>
    <div className="gin-modal" onClick={(e) => e.stopPropagation()}>
      <div className="gin-modal-header">
        <h3>Intransit Purchase Orders</h3>
        <button className="gin-modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="gin-modal-body">
        {pos.length === 0 ? (
          <div className="gin-modal-empty">No Intransit POs found.</div>
        ) : (
          <table className="gin-modal-table">
            <thead>
              <tr>
                <th>PO No</th>
                <th>PO Date</th>
                <th>Party Name</th>
                <th>Site</th>
                <th>Items</th>
                <th>Net Amt</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po._id}>
                  <td>
                    <button className="gin-modal-po-link" onClick={() => onSelect(po)}>
                      {po.poNo}
                    </button>
                  </td>
                  <td>{po.poDate ? po.poDate.slice(0, 10) : "-"}</td>
                  <td>{po.partyName || "-"}</td>
                  <td>{po.site || "-"}</td>
                  <td>{po.items?.map((it) => it.itemName).join(", ") || "-"}</td>
                  <td>₹ {Number(po.netAmount || 0).toLocaleString("en-IN")}</td>
                  <td>
                    <button className="gin-modal-select-btn" onClick={() => onSelect(po)}>
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   STATUS BADGE helper
───────────────────────────────────────────── */
const statusClass = (s) => {
  if (!s) return "";
  const map = {
    open:        "badge-open",
    weighted:    "badge-weighted",
    outpending:  "badge-outpending",
    closed:      "badge-closed",
  };
  return map[(s || "").toLowerCase()] || "";
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const InwardOutwardNote = () => {
  const navigate = useNavigate();

  const [filters,      setFilters]      = useState(blankFilters);
  const [results,      setResults]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [editData,     setEditData]     = useState({});
  const [showPOModal,  setShowPOModal]  = useState(false);
  const [intransitPOs, setIntransitPOs] = useState([]);
  const [loadingPOs,   setLoadingPOs]   = useState(false);

  /* master data */
  const [parties, setParties] = useState([]);
  const [sites,   setSites]   = useState([]);

  /* "Vehicle Out All" checkbox state */
  const [vehicleOutAll, setVehicleOutAll] = useState(false);
  const [closingAll,    setClosingAll]    = useState(false);

  /* ── Fetch master data on mount ── */
  useEffect(() => {
    fetchMasters();
    fetchData(blankFilters);   // default load: active vehicles only
  }, []);

  const fetchMasters = async () => {
    try {
      const [partyRes, siteRes] = await Promise.all([
        fetch(PARTY_API),
        fetch(SITE_API),
      ]);
      const partyData = await partyRes.json();
      const siteData  = await siteRes.json();
      setParties(Array.isArray(partyData) ? partyData.filter((p) => p.status === "Active") : []);
      setSites(Array.isArray(siteData)    ? siteData.filter((s)  => s.status === "Active") : []);
    } catch (err) { console.error("Master fetch error:", err); }
  };

  const partyNames = [
    ...new Set([
      ...parties.map((p) => p.partyName),
      ...results.map((r) => r.partyName),
    ].filter(Boolean))
  ].sort();

  /* ── fetchData
       If status filter is blank, we restrict to ACTIVE_STATUSES by default
       (i.e. hide Closed unless the user explicitly selects "Closed").
  ── */
  const fetchData = async (f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => { if (v) params.append(k, v); });

      // If no explicit status filter, only show active statuses on the search page
      if (!f.status) {
        ACTIVE_STATUSES.forEach((s) => params.append("statusIn", s));
      }

      const res  = await fetch(`${GIN_API}?${params.toString()}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /* NOTE: The backend GET /goods-inward-note needs to support
     "statusIn" as a multi-value query param for the default load.
     See backend change note at the bottom of this file.
  */

  const fetchIntransitPOs = async () => {
    setLoadingPOs(true);
    try {
      const res  = await fetch(PO_API);
      const data = await res.json();
      setIntransitPOs(Array.isArray(data) ? data.filter((p) => p.status === "Intransit") : []);
    } catch (err) { console.error(err); setIntransitPOs([]); }
    finally { setLoadingPOs(false); }
  };

  const handleOpenPOModal = async () => {
    setShowPOModal(true);
    await fetchIntransitPOs();
  };

  const handlePOSelect = (po) => {
    setShowPOModal(false);
    navigate("/create-goods-inward-note", { state: { fromPO: po } });
  };

  const handleChange = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleApply  = () => fetchData(filters);
  const handleReset  = () => { setFilters(blankFilters); fetchData(blankFilters); setVehicleOutAll(false); };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await fetch(`${GIN_API}/${id}`, { method: "DELETE" });
      setResults((p) => p.filter((r) => r._id !== id));
    } catch { alert("Delete Failed"); }
  };

  const handleUpdate = async () => {
    try {
      const res  = await fetch(`${GIN_API}/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setResults((p) => p.map((r) => (r._id === editId ? data.data : r)));
      setEditId(null);
    } catch { alert("Update Failed"); }
  };

  /* ── Vehicle Out (single row) ──
     Sets status to "Closed" for one record.
  ── */
  const handleVehicleOut = async (row) => {
    if (!window.confirm(`Mark vehicle ${row.vehicleNo || row.ginNo} as OUT (Closed)?`)) return;
    try {
      const res = await fetch(`${GIN_API}/${row._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, status: "Closed" }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      // Remove from list because default view hides Closed
      setResults((p) => p.filter((r) => r._id !== row._id));
    } catch { alert("Vehicle Out failed"); }
  };

  /* ── Vehicle Out ALL (checkbox) ──
     Closes ALL records currently shown that are Open, Weighted, or OutPending.
  ── */
  const handleVehicleOutAll = async (checked) => {
    setVehicleOutAll(checked);
    if (!checked) return;

    const toClose = results.filter((r) =>
      ACTIVE_STATUSES.map((s) => s.toLowerCase()).includes((r.status || "").toLowerCase())
    );

    if (toClose.length === 0) {
      alert("No active vehicles to close.");
      setVehicleOutAll(false);
      return;
    }

    if (!window.confirm(`Close ALL ${toClose.length} active vehicle(s)? This cannot be undone.`)) {
      setVehicleOutAll(false);
      return;
    }

    setClosingAll(true);
    try {
      await Promise.all(
        toClose.map((row) =>
          fetch(`${GIN_API}/${row._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...row, status: "Closed" }),
          })
        )
      );
      // Remove all closed from current view
      const closedIds = new Set(toClose.map((r) => r._id));
      setResults((p) => p.filter((r) => !closedIds.has(r._id)));
      setVehicleOutAll(false);
      alert(`${toClose.length} vehicle(s) marked as Closed.`);
    } catch { alert("Bulk close failed"); }
    finally { setClosingAll(false); }
  };

  /* ── Inline edit helpers ── */
  const ed = (field, type = "text") => (
    <input
      type={type}
      value={editData[field] || ""}
      onChange={(e) => setEditData((p) => ({ ...p, [field]: e.target.value }))}
      className="gin-inline-input"
    />
  );
  const edSel = (field, options) => (
    <select
      value={editData[field] || ""}
      onChange={(e) => setEditData((p) => ({ ...p, [field]: e.target.value }))}
      className="gin-inline-input"
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );

  /* ── Table columns (slimmed per requirements) ── */
  const COLS = [
    "#", "IN/OUT No", "Date", "PO No", "Type",
    "Party Code", "Party Name", "Vehicle No", "Site", "Status", "Actions",
  ];

  const renderRow = (row, index) => {
    const isEdit = editId === row._id;
    return (
      <tr key={row._id || index} className={isEdit ? "gin-editing-row" : ""}>
        <td>{index + 1}</td>

        {/* IN/OUT No — hyperlink */}
        <td>
          {isEdit ? (
            <strong>{row.ginNo || "-"}</strong>
          ) : (
            <button
              className="gin-no-link"
              onClick={() => navigate(`/gin-detail/${row._id}`)}
              title="View full details"
            >
              {row.ginNo || "-"}
            </button>
          )}
        </td>

        <td>{isEdit ? ed("ginDate", "date") : row.ginDate || "-"}</td>
        <td>{isEdit ? ed("poCpoNo")         : row.poCpoNo || "-"}</td>

        {/* Type */}
        <td>
          {isEdit
            ? edSel("inOutType", ["Inward", "Outward"])
            : (
              <span className={`gin-entry-badge ${(row.inOutType || "").toLowerCase()}`}>
                {row.inOutType || "-"}
              </span>
            )}
        </td>

        <td>{isEdit ? ed("partyCode") : row.partyCode || "-"}</td>
        <td>{isEdit ? ed("partyName") : row.partyName || "-"}</td>
        <td>{isEdit ? ed("vehicleNo") : row.vehicleNo || "-"}</td>
        <td>{isEdit ? ed("site")      : row.site || "-"}</td>

        {/* Status */}
        <td>
          {isEdit ? (
            edSel("status", STATUS_OPTIONS)
          ) : (
            <span className={`gin-status-badge ${statusClass(row.status)}`}>
              {row.status || "-"}
            </span>
          )}
        </td>

        {/* Actions */}
        <td className="gin-action-cell">
          {isEdit ? (
            <>
              <button className="save-btn"        onClick={handleUpdate}>Save</button>
              <button className="cancel-edit-btn" onClick={() => setEditId(null)}>Cancel</button>
            </>
          ) : (
            <>
              <button
                className="edit-btn"
                onClick={() => { setEditId(row._id); setEditData({ ...row }); }}
              >
                Edit
              </button>
              {/* Vehicle Out — only shown for active records */}
              {ACTIVE_STATUSES.includes(row.status) && (
                <button
                  className="vehicle-out-btn"
                  onClick={() => handleVehicleOut(row)}
                  title="Mark vehicle as Out (Closed)"
                >
                  🚛 Out
                </button>
              )}
              <button className="delete-btn" onClick={() => handleDelete(row._id)}>Delete</button>
            </>
          )}
        </td>
      </tr>
    );
  };

  /* ────────────────────────────────────────────────────────── */

  return (
    <div className="gin-search-page">
      <ModuleNavbar />

      <div className="gin-search-header">
        <h2>Inward Outward Note</h2>
        <div className="gin-header-btns">
          <button
            className="insert-po-btn"
            onClick={handleOpenPOModal}
            title="Insert data from an Intransit PO"
          >
            📋 Insert from PO
          </button>
          <button className="create-btn" onClick={() => navigate("/create-goods-inward-note")}>
            + Create
          </button>
        </div>
      </div>

      <div className="gin-body">

        {/* ── FILTER PANEL ── */}
        <div className="filter-panel">
          <div className="filter-section-title">Search Filters</div>
          <div className="filter-grid">

            <div className="filter-group">
              <label>From Date</label>
              <input type="date" name="fromDate" value={filters.fromDate} onChange={handleChange} />
            </div>

            <div className="filter-group">
              <label>Out Date (To)</label>
              <input type="date" name="toDate" value={filters.toDate} onChange={handleChange} />
            </div>

            <div className="filter-group">
              <label>IN/OUT No</label>
              <input
                type="text"
                name="ginNumber"
                value={filters.ginNumber}
                onChange={handleChange}
                placeholder="Search IN/OUT No…"
              />
            </div>

            <div className="filter-group">
              <label>SO / PO No</label>
              <input
                type="text"
                name="poCpoNo"
                value={filters.poCpoNo}
                onChange={handleChange}
                placeholder="Search PO/SO No…"
              />
            </div>

            <div className="filter-group">
              <label>Type (IN/OUT)</label>
              <select name="inOutType" value={filters.inOutType} onChange={handleChange}>
                <option value="">All</option>
                <option>Inward</option>
                <option>Outward</option>
              </select>
            </div>

            {/* TRANSACTION CATEGORY (TC) — commented out, uncomment to enable
            <div className="filter-group">
              <label>Transaction Category (TC)</label>
              <input
                type="text"
                name="transactionCategory"
                value={filters.transactionCategory}
                onChange={handleChange}
                placeholder="Transaction category…"
              />
            </div>
            */}

            <div className="filter-group">
              <label>Party Code (PC)</label>
              <input
                type="text"
                name="partyCode"
                value={filters.partyCode}
                onChange={handleChange}
                placeholder="Search party code…"
              />
            </div>

            <div className="filter-group">
              <label>Party Name (PN)</label>
              <TypeAhead
                name="partyName"
                value={filters.partyName}
                onChange={handleChange}
                suggestions={partyNames}
                onSelect={(val) => setFilters((p) => ({ ...p, partyName: val }))}
                placeholder="Search party name…"
              />
            </div>

            <div className="filter-group">
              <label>Party Doc (DOC)</label>
              <input
                type="text"
                name="partyDoc"
                value={filters.partyDoc}
                onChange={handleChange}
                placeholder="Search party doc…"
              />
            </div>

            <div className="filter-group">
              <label>Vehicle No</label>
              <input
                type="text"
                name="vehicleNo"
                value={filters.vehicleNo}
                onChange={handleChange}
                placeholder="Search vehicle no…"
              />
            </div>

            <div className="filter-group">
              <label>Site</label>
              <select name="site" value={filters.site} onChange={handleChange}>
                <option value="">All Sites</option>
                {sites.map((s) => (
                  <option key={s._id || s.siteCode} value={s.siteCode}>
                    {s.siteCode} — {s.siteName}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleChange}>
                <option value="">Active Only (default)</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="filter-actions">
            <button className="reset-btn" onClick={handleReset}>Reset</button>
            <button className="apply-btn" onClick={handleApply}>
              {loading ? "Searching…" : "Apply"}
            </button>
            {/* Vehicle Out ALL — below Apply button */}
            <label
              className={`vehicle-out-all-label ${closingAll ? "closing" : ""}`}
              title="Check to close ALL active vehicles at once"
            >
              <input
                type="checkbox"
                checked={vehicleOutAll}
                onChange={(e) => handleVehicleOutAll(e.target.checked)}
                disabled={closingAll}
              />
              {closingAll ? "Closing…" : "Vehicle Out All"}
            </label>
          </div>
        </div>

        {/* ── RESULT TABLE ── */}
        <div className="result-area">
          {loading && <div className="result-placeholder">Loading…</div>}

          {!loading && results.length === 0 && (
            <div className="result-placeholder">
              No active vehicle records found. Use filters to search for Closed records.
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="result-table-wrap">
              <div className="result-count">
                Showing {results.length} record{results.length !== 1 ? "s" : ""}
                {!filters.status && (
                  <span className="result-count-note"> (active vehicles only — select "Closed" in Status to view closed records)</span>
                )}
              </div>
              <table className="gin-table">
                <thead>
                  <tr>{COLS.map((c) => <th key={c}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {results.map((row, i) => renderRow(row, i))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── Intransit PO Modal ── */}
      {showPOModal && (
        <IntransitPOModal
          pos={loadingPOs ? [] : intransitPOs}
          onSelect={handlePOSelect}
          onClose={() => setShowPOModal(false)}
        />
      )}

      <style>{`
        /* ── Vehicle Out All label ── */
        .vehicle-out-all-label {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: #fff7ed;
          color: #c2410c;
          border: 1.5px solid #fdba74;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s, border-color 0.15s;
        }
        .vehicle-out-all-label:hover { background: #ffedd5; border-color: #fb923c; }
        .vehicle-out-all-label.closing { opacity: 0.6; cursor: not-allowed; }
        .vehicle-out-all-label input[type="checkbox"] {
          width: 15px; height: 15px; cursor: pointer; accent-color: #ea580c;
        }

        /* ── Vehicle Out (single row) button ── */
        .vehicle-out-btn {
          padding: 4px 10px;
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fdba74;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 4px;
          transition: background 0.12s;
        }
        .vehicle-out-btn:hover { background: #ffedd5; }

        /* ── Status badges ── */
        .gin-status-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }
        .badge-open       { background: #dbeafe; color: #1d4ed8; }
        .badge-weighted   { background: #ede9fe; color: #6d28d9; }
        .badge-outpending { background: #fef9c3; color: #a16207; }
        .badge-closed     { background: #f1f5f9; color: #64748b; }

        /* ── Result count note ── */
        .result-count {
          font-size: 12.5px;
          color: #64748b;
          margin-bottom: 10px;
          padding: 0 2px;
        }
        .result-count-note {
          font-style: italic;
          color: #94a3b8;
        }

        /* ── Insert PO button ── */
        .insert-po-btn {
          padding: 8px 16px;
          background: #f0fdf4;
          color: #16a34a;
          border: 1.5px solid #86efac;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .insert-po-btn:hover { background: #dcfce7; border-color: #4ade80; }

        /* ── Modal styles ── */
        .gin-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          z-index: 1000; display: flex; align-items: center; justify-content: center;
        }
        .gin-modal {
          background: #fff; border-radius: 12px; width: 90vw; max-width: 1100px;
          max-height: 80vh; display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;
        }
        .gin-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;
        }
        .gin-modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #1e293b; }
        .gin-modal-close {
          background: none; border: none; font-size: 18px; cursor: pointer;
          color: #64748b; padding: 2px 6px; border-radius: 4px;
        }
        .gin-modal-close:hover { background: #f1f5f9; color: #ef4444; }
        .gin-modal-body { overflow-y: auto; flex: 1; padding: 16px 24px; }
        .gin-modal-empty { text-align: center; padding: 40px; color: #94a3b8; font-size: 14px; }
        .gin-modal-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .gin-modal-table th {
          background: #f1f5f9; padding: 10px 12px; text-align: left;
          font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }
        .gin-modal-table td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
        .gin-modal-table tr:hover td { background: #f8fafc; }
        .gin-modal-po-link {
          background: none; border: none; color: #2563eb; font-weight: 700;
          font-size: 13px; cursor: pointer; text-decoration: underline; padding: 0;
        }
        .gin-modal-po-link:hover { color: #1d4ed8; }
        .gin-modal-select-btn {
          padding: 4px 12px; background: #2563eb; color: #fff;
          border: none; border-radius: 5px; font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .gin-modal-select-btn:hover { background: #1d4ed8; }
      `}</style>
    </div>
  );
};

export default InwardOutwardNote;

/*
═══════════════════════════════════════════════════════════════════════
  BACKEND CHANGE REQUIRED — goodsInwardNoteRoutes.js
═══════════════════════════════════════════════════════════════════════

  The default load sends "statusIn" as a repeated query param to filter
  multiple statuses (Open, Weighted, OutPending). Add this to the GET
  /goods-inward-note route query builder:

  // After existing status filter:
  if (status) {
    query.status = status;
  } else if (req.query.statusIn) {
    // Support statusIn as array or single value
    const statusIn = Array.isArray(req.query.statusIn)
      ? req.query.statusIn
      : [req.query.statusIn];
    query.status = { $in: statusIn };
  }

  Also update GoodsInwardNote.js — no schema change needed, just ensure
  your STATUS_OPTIONS are consistent:
    "Open", "Weighted", "OutPending", "Closed"
═══════════════════════════════════════════════════════════════════════
*/