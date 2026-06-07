import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./InwardOutwardNote.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const GIN_API   = `${API_URL}/api/goods-inward-note`;
const PO_API    = `${API_URL}/api/purchase-orders`;
const PARTY_API = `${API_URL}/api/parties`;

const blankFilters = {
  fromDate: "", toDate: "", inOutType: "", status: "",
  ginNumber: "", partyCode: "", partyName: "", poCpoNo: "",
  partyDoc: "", site: "",
};

/* ─────────────────────────────────────────────
   Reusable TypeAhead for Party Name filter
───────────────────────────────────────────── */
const TypeAhead = ({ value, onChange, suggestions, onSelect, placeholder, name }) => {
  const [show, setShow] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Show all when empty, filter when typing
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
      {show && (
        <ul style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)", margin: 0, padding: 0,
          listStyle: "none", maxHeight: 220, overflowY: "auto",
        }}>
          {filtered.length > 0 ? (
            filtered.map((s) => (
              <li
                key={s}
                onMouseDown={() => { onSelect(s); setShow(false); }}
                style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "#1e293b" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                {s}
              </li>
            ))
          ) : (
            <li style={{ padding: "8px 12px", color: "#94a3b8", fontStyle: "italic", fontSize: 13 }}>
              No matches found
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Intransit PO Modal
   Shown when user clicks "Insert from PO"
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
                    {/* Hyperlink — clicking fills the create form */}
                    <button
                      className="gin-modal-po-link"
                      onClick={() => onSelect(po)}
                    >
                      {po.poNo}
                    </button>
                  </td>
                  <td>{po.poDate ? po.poDate.slice(0, 10) : "-"}</td>
                  <td>{po.partyName || "-"}</td>
                  <td>{po.site || "-"}</td>
                  <td>{po.items?.map((it) => it.itemName).join(", ") || "-"}</td>
                  <td>₹ {Number(po.netAmount || 0).toLocaleString("en-IN")}</td>
                  <td>
                    <button
                      className="gin-modal-select-btn"
                      onClick={() => onSelect(po)}
                    >
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

const InwardOutwardNote = () => {
  const navigate = useNavigate();

  const [filters,      setFilters]      = useState(blankFilters);
  const [results,      setResults]      = useState([]);
  const [searched,     setSearched]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [editData,     setEditData]     = useState({});
  const [showPOModal,  setShowPOModal]  = useState(false);
  const [intransitPOs, setIntransitPOs] = useState([]);
  const [loadingPOs,   setLoadingPOs]   = useState(false);
  const [parties, setParties] = useState([]);

  const fetchMasters = async () => {
    try {
      const res  = await fetch(PARTY_API);
      const data = await res.json();
      setParties(Array.isArray(data) ? data.filter((p) => p.status === "Active") : []);
    } catch (err) { console.error("Party fetch error:", err); }
  };

  useEffect(() => { fetchData(blankFilters); fetchMasters(); }, []);

  // Merge names from master list + names already present in loaded results
  // so parties that are inactive/deleted still appear as suggestions
  const partyNames = [
    ...new Set([
      ...parties.map((p) => p.partyName),
      ...results.map((r) => r.partyName),
    ].filter(Boolean))
  ].sort();

  const fetchData = async (f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res  = await fetch(`${GIN_API}?${params.toString()}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setResults([]); }
    finally { setLoading(false); setSearched(true); }
  };

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

  /* When user selects a PO from the modal → navigate to CreateGIN with PO pre-filled */
  const handlePOSelect = (po) => {
    setShowPOModal(false);
    navigate("/create-goods-inward-note", { state: { fromPO: po } });
  };

  const handleChange = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleApply  = () => fetchData(filters);
  const handleReset  = () => { setFilters(blankFilters); fetchData(blankFilters); };

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
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setResults((p) => p.map((r) => (r._id === editId ? data.data : r)));
      setEditId(null);
      alert("Updated Successfully");
    } catch { alert("Update Failed"); }
  };

  const ed = (field, type = "text") => (
    <input type={type} value={editData[field] || ""}
      onChange={(e) => setEditData((p) => ({ ...p, [field]: e.target.value }))}
      className="gin-inline-input" />
  );
  const edSel = (field, options) => (
    <select value={editData[field] || ""}
      onChange={(e) => setEditData((p) => ({ ...p, [field]: e.target.value }))}
      className="gin-inline-input">
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );

  const COLS = [
    "#", "IN/OUT No", "Date", "PO/CPO No", "IN/OUT Type", "Transaction Category",
    "Description", "Vendor Code", "Vendor Name", "Party Code", "Party Name",
    "Party Doc", "Vehicle Entry", "Vehicle No", "Challan/Invoice No", "Challan Date",
    "Bill Date", "E-Way Date", "Site", "Status", "Remarks", "Actions",
  ];

  const renderRow = (row, index) => {
    const isEdit = editId === row._id;
    return (
      <tr key={row._id || index} className={isEdit ? "gin-editing-row" : ""}>
        <td>{index + 1}</td>

        {/* ── GIN No — HYPERLINK ── */}
        <td>
          {isEdit ? (
            <strong>{row.ginNo || "-"}</strong>
          ) : (
            <button
              className="gin-no-link"
              onClick={() => navigate(`/gin-detail/${row._id}`)}
              title="Click to view full details"
            >
              {row.ginNo || "-"}
            </button>
          )}
        </td>

        <td>{isEdit ? ed("ginDate", "date")          : row.ginDate || "-"}</td>
        <td>{isEdit ? ed("poCpoNo")                  : row.poCpoNo || "-"}</td>

        {/* IN/OUT Type */}
        <td>
          {isEdit
            ? edSel("inOutType", ["Inward", "Outward"])
            : (
              <span className={`gin-entry-badge ${(row.inOutType || row.vehicleEntry || "").toLowerCase()}`}>
                {row.inOutType || row.vehicleEntry || "-"}
              </span>
            )}
        </td>

        <td>{isEdit ? ed("transactionCategory")      : row.transactionCategory || "-"}</td>
        <td>{isEdit ? ed("ginDescription")           : row.ginDescription || "-"}</td>
        <td>{isEdit ? ed("vendorCode")               : row.vendorCode || "-"}</td>
        <td>{isEdit ? ed("vendorName")               : row.vendorName || "-"}</td>
        <td>{isEdit ? ed("partyCode")                : row.partyCode || "-"}</td>
        <td>{isEdit ? ed("partyName")                : row.partyName || "-"}</td>
        <td>{isEdit ? ed("partyDoc")                 : row.partyDoc || "-"}</td>

        {/* Vehicle Entry */}
        <td>
          {isEdit ? edSel("vehicleEntry", ["Inward", "Outward"]) : (
            <span className={`gin-entry-badge ${(row.vehicleEntry || "").toLowerCase()}`}>
              {row.vehicleEntry || "-"}
            </span>
          )}
        </td>

        <td>{isEdit ? ed("vehicleNo")                : row.vehicleNo || "-"}</td>
        <td>{isEdit ? ed("challanInvoiceNo")         : row.challanInvoiceNo || "-"}</td>
        <td>{isEdit ? ed("challanDate", "date")      : row.challanDate || "-"}</td>
        <td>{isEdit ? ed("billDate", "date")         : row.billDate || "-"}</td>
        <td>{isEdit ? ed("ewayDate", "date")         : row.ewayDate || "-"}</td>
        <td>{isEdit ? ed("site")                     : row.site || "-"}</td>

        <td>
          {isEdit ? edSel("status", ["Open", "Closed"]) : (
            <span className={`gin-status-badge ${(row.status || "").toLowerCase()}`}>
              {row.status || "-"}
            </span>
          )}
        </td>

        <td>{isEdit ? ed("remarks") : row.remarks || "-"}</td>

        <td className="gin-action-cell">
          {isEdit ? (
            <>
              <button className="save-btn"        onClick={handleUpdate}>Save</button>
              <button className="cancel-edit-btn" onClick={() => setEditId(null)}>Cancel</button>
            </>
          ) : (
            <>
              <button className="edit-btn"   onClick={() => { setEditId(row._id); setEditData({ ...row }); }}>Edit</button>
              <button className="delete-btn" onClick={() => handleDelete(row._id)}>Delete</button>
            </>
          )}
        </td>
      </tr>
    );
  };

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

        <div className="filter-panel">
          <div className="filter-section-title">Search Filters</div>
          <div className="filter-grid">

            <div className="filter-group">
              <label>From Date</label>
              <input type="date" name="fromDate" value={filters.fromDate} onChange={handleChange} />
            </div>

            <div className="filter-group">
              <label>To Date</label>
              <input type="date" name="toDate" value={filters.toDate} onChange={handleChange} />
            </div>

            <div className="filter-group">
              <label>IN/OUT No</label>
              <input type="text" name="ginNumber" value={filters.ginNumber} onChange={handleChange} placeholder="Search IN/OUT No…" />
            </div>

            <div className="filter-group">
              <label>IN/OUT Type</label>
              <select name="inOutType" value={filters.inOutType} onChange={handleChange}>
                <option value="">All</option>
                <option>Inward</option>
                <option>Outward</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleChange}>
                <option value="">All</option>
                <option>Open</option>
                <option>Closed</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Party Code</label>
              <input type="text" name="partyCode" value={filters.partyCode} onChange={handleChange} placeholder="Search party code…" />
            </div>

            <div className="filter-group">
              <label>Party Name</label>
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
              <label>PO Ref (PO/CPO No)</label>
              <input type="text" name="poCpoNo" value={filters.poCpoNo} onChange={handleChange} placeholder="Search PO No…" />
            </div>

            <div className="filter-group">
              <label>Party Doc</label>
              <input type="text" name="partyDoc" value={filters.partyDoc} onChange={handleChange} placeholder="Search party doc…" />
            </div>

            <div className="filter-group">
              <label>Site</label>
              <select name="site" value={filters.site} onChange={handleChange}>
                <option value="">All</option>
                <option>Factory Office-GYPMART INDIA</option>
              </select>
            </div>

          </div>
          <div className="filter-actions">
            <button className="reset-btn" onClick={handleReset}>Reset</button>
            <button className="apply-btn" onClick={handleApply}>{loading ? "Searching..." : "Apply"}</button>
          </div>
        </div>

        <div className="result-area">
          {loading && <div className="result-placeholder">Loading...</div>}
          {!loading && searched && (
            results.length === 0
              ? <div className="result-placeholder">No records found</div>
              : (
                <div className="result-table-wrap">
                  <table className="gin-table">
                    <thead><tr>{COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>{results.map((row, i) => renderRow(row, i))}</tbody>
                  </table>
                </div>
              )
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

      {/* Modal + button styles */}
      <style>{`
        .gin-header-btns {
          display: flex;
          gap: 10px;
          align-items: center;
        }
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
        .insert-po-btn:hover {
          background: #dcfce7;
          border-color: #4ade80;
        }
        .gin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gin-modal {
          background: #fff;
          border-radius: 12px;
          width: 90vw;
          max-width: 1100px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .gin-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .gin-modal-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }
        .gin-modal-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #64748b;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .gin-modal-close:hover { background: #f1f5f9; color: #ef4444; }
        .gin-modal-body {
          overflow-y: auto;
          flex: 1;
          padding: 16px 24px;
        }
        .gin-modal-empty {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
          font-size: 14px;
        }
        .gin-modal-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .gin-modal-table th {
          background: #f1f5f9;
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }
        .gin-modal-table td {
          padding: 9px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
        }
        .gin-modal-table tr:hover td { background: #f8fafc; }
        .gin-modal-po-link {
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }
        .gin-modal-po-link:hover { color: #1d4ed8; }
        .gin-modal-select-btn {
          padding: 4px 12px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .gin-modal-select-btn:hover { background: #1d4ed8; }
      `}</style>
    </div>
  );
};

export default InwardOutwardNote;