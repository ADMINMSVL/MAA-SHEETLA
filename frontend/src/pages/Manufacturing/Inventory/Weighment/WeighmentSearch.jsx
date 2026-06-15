import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./WeighmentSearch.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const API     = `${API_URL}/api/weighment`;
const GIN_API = `${API_URL}/api/goods-inward-note`;

/* Status options updated per requirements: Draft, Partial, Submit, Weighted */
const STATUS_OPTIONS = ["Draft", "Partial", "Submit", "Weighted"];

const blankFilters = {
  fromDate: "", toDate: "", weighmentNo: "", vehicleNo: "",
  inwardOutwardNoteNo: "", status: "", partyName: "", transactionType: "",
  transactionCategory: "",
};

const WeighmentSearch = () => {
  const navigate = useNavigate();

  const [filters,        setFilters]        = useState(blankFilters);
  const [results,        setResults]        = useState([]);
  const [searched,       setSearched]       = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [editId,         setEditId]         = useState(null);
  const [editRow,        setEditRow]        = useState({});
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  /* Transaction categories fetched from GIN records */
  const [txCategories, setTxCategories] = useState([]);

  useEffect(() => {
    fetchData(blankFilters);
    fetchTxCategories();
  }, []);

  const fetchTxCategories = async () => {
    try {
      const res = await axios.get(GIN_API);
      const data = Array.isArray(res.data) ? res.data : [];
      const cats = [...new Set(data.map((d) => d.transactionCategory).filter(Boolean))].sort();
      setTxCategories(cats);
    } catch (err) {
      console.error("Failed to fetch transaction categories", err);
    }
  };

  const fetchData = async (f) => {
    setLoading(true); setSearched(true);
    try {
      const params = {};
      Object.entries(f).forEach(([k, v]) => { if (v !== "") params[k] = v; });
      const res = await axios.get(API, { params });
      setResults(res.data.data || []);
    } catch (err) {
      console.error(err); alert("Failed to fetch records");
    } finally { setLoading(false); }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const handleApply = () => fetchData(filters);
  const handleReset = () => { setFilters(blankFilters); fetchData(blankFilters); };

  /* ── inline edit ── */
  const startEdit  = (row) => { setEditId(row._id); setEditRow({ ...row }); };
  const cancelEdit = ()    => { setEditId(null);    setEditRow({}); };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...editRow, [name]: value };
    if (name === "firstWeight" || name === "secondWeight") {
      const f = parseFloat(name === "firstWeight"  ? value : editRow.firstWeight  || 0) || 0;
      const s = parseFloat(name === "secondWeight" ? value : editRow.secondWeight || 0) || 0;
      updated.netWeight = String(Math.abs(f - s));
    }
    setEditRow(updated);
  };

  const saveEdit = async () => {
    if (!editRow.vehicleNo?.trim()) { alert("Vehicle Number is required"); return; }
    try {
      const res = await axios.put(`${API}/${editId}`, editRow);
      if (res.data.success) {
        setResults((prev) => prev.map((r) => (r._id === editId ? res.data.data : r)));
        setEditId(null); setEditRow({});
      } else { alert("Update failed: " + res.data.message); }
    } catch (err) { console.error(err); alert("Update failed"); }
  };

  /* No delete handler — Delete button removed per requirements */

  const openDetail = (row) =>
    navigate(`/weighment-detail/${row._id}`, { state: { allowEdit: true } });

  /* ─── Compact column set per requirements ───
     GIN/IN-OUT note, Weighment No, Vehicle No, Trans Type, Trans Category,
     Party Name, Net Weight — all others removed from table */
  const COLS = [
    { label: "#" },
    { label: "GIN / IN-OUT Note No", field: "inwardOutwardNoteNo", isLink: true },
    { label: "Weighment No",         field: "weighmentNo" },
    { label: "Vehicle No",           field: "vehicleNo" },
    { label: "Trans Type",           field: "transactionType", type: "select", opts: ["", "Inward", "Outward"] },
    { label: "Trans Category",       field: "transactionCategory", type: "select", opts: ["", "Purchase", "Sales"] },
    { label: "Party Name",           field: "partyName" },
    { label: "Net Weight (MT)",      field: "netWeight", readOnly: true },
    { label: "Status",               field: "status", type: "select", opts: ["", ...STATUS_OPTIONS] },
    { label: "Actions" },
  ];

  const renderCell = (col, row) => {
    const isEditing = editId === row._id;
    const { field, type, opts, readOnly, isLink } = col;

    if (!isEditing) {
      const val = row[field] != null && row[field] !== "" ? row[field] : "-";
      if (isLink) {
        return (
          <button className="ws-gin-link" onClick={() => openDetail(row)} title={`Open details for ${val}`}>
            🔗 {val}
          </button>
        );
      }
      return val;
    }

    if (readOnly || isLink)
      return <input value={editRow[field] ?? ""} readOnly className="ws-inline ws-readonly" />;

    if (type === "select")
      return (
        <select name={field} value={editRow[field] ?? ""} onChange={handleEditChange} className="ws-inline">
          {opts.map((o) => <option key={o} value={o}>{o || "Select"}</option>)}
        </select>
      );

    return (
      <input type={type || "text"} name={field} value={editRow[field] ?? ""}
        onChange={handleEditChange}
        className={`ws-inline${type === "date" ? " ws-date" : ""}`} />
    );
  };

  return (
    <div className="weighment-page">
      <ModuleNavbar />

      {/* HEADER */}
      <div className="weighment-header">
        <h2>Weighment</h2>
        <div className="header-actions">
          <button className="old-btn">Access Old Screen</button>
          <div className="create-dropdown-wrap">
            <button className="create-btn" onClick={() => setShowCreateMenu((p) => !p)}>+ Create ▾</button>
            {showCreateMenu && (
              <div className="create-menu">
          <button
            className="create-menu-item"
            onClick={() => {
              setShowCreateMenu(false);
              navigate("/weighment/create/general");
            }}
          >
            Create
          </button>

          <button
            className="create-menu-item"
            onClick={() => {
              setShowCreateMenu(false);
              navigate("/weighment/create/inward");
            }}
          >
            Create Inward
          </button>

          <button
            className="create-menu-item"
            onClick={() => {
              setShowCreateMenu(false);
              navigate("/weighment/create/outward");
            }}
          >
            Create Outward
          </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH PANEL — ordered: From Date, To Date, Weighment No, Vehicle No, IN/OUT No, Status, Party Name, Trans Type, Trans Category */}
      <div className="search-panel">
        <div className="search-grid">

          <div className="field"><label>From Date</label>
            <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} /></div>

          <div className="field"><label>To Date</label>
            <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} /></div>

          <div className="field"><label>Weighment No</label>
            <input type="text" name="weighmentNo" value={filters.weighmentNo} onChange={handleFilterChange} /></div>

          <div className="field"><label>Vehicle No</label>
            <input type="text" name="vehicleNo" value={filters.vehicleNo} onChange={handleFilterChange} /></div>

          <div className="field"><label>Inward / Outward Note No</label>
            <input type="text" name="inwardOutwardNoteNo" value={filters.inwardOutwardNoteNo} onChange={handleFilterChange} placeholder="GIN/26-27/…" /></div>

          <div className="field"><label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select></div>

          <div className="field"><label>Party Name</label>
            <input type="text" name="partyName" value={filters.partyName} onChange={handleFilterChange} /></div>

          <div className="field"><label>Transaction Type</label>
            <select name="transactionType" value={filters.transactionType} onChange={handleFilterChange}>
              <option value="">All</option><option>Inward</option><option>Outward</option>
            </select></div>

          <div className="field"><label>Transaction Category</label>
            <select name="transactionCategory" value={filters.transactionCategory} onChange={handleFilterChange}>
              <option value="">All</option>
              {txCategories.length > 0
                ? txCategories.map((c) => <option key={c}>{c}</option>)
                : <><option>Purchase</option><option>Sales</option></>}
            </select></div>

        </div>

        <div className="bottom-actions">
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="reset-btn" onClick={handleReset}>Reset</button>
            <button className="apply-btn" onClick={handleApply}>{loading ? "Searching..." : "Apply"}</button>
          </div>
        </div>
      </div>

      {/* RESULT TABLE */}
      <div className="result-area">
        {loading && <div className="placeholder">Loading...</div>}
        {!loading && searched && results.length === 0 && <div className="placeholder">No records found</div>}

        {!loading && searched && results.length > 0 && (
          <div className="result-table-wrap">
            <table className="result-table">
              <thead>
                <tr>{COLS.map((c) => <th key={c.label}>{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {results.map((row, idx) => {
                  const isEditing = editId === row._id;
                  return (
                    <tr key={row._id || idx} className={isEditing ? "editing-row" : ""}>
                      <td>{idx + 1}</td>
                      {COLS.slice(1, -1).map((col) => (
                        <td key={col.field}>{renderCell(col, row)}</td>
                      ))}
                      {/* Actions — Delete removed per requirements */}
                      <td className="action-cell">
                        {isEditing ? (
                          <>
                            <button className="save-row-btn"   onClick={saveEdit}>Save</button>
                            <button className="cancel-row-btn" onClick={cancelEdit}>Cancel</button>
                          </>
                        ) : (
                          <button className="edit-row-btn" onClick={() => startEdit(row)}>Edit</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeighmentSearch;
