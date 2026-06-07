import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";
import "./PurchaseOrder.css";

const STATUS_OPTIONS = ["All", "Ordered", "Partially Received", "Completed", "Cancelled"];

/* Reusable typeahead */
const TypeAhead = ({ value, onChange, suggestions, onSelect, placeholder }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = suggestions.filter((s) =>
    s?.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        placeholder={placeholder || "Type to search…"}
        autoComplete="off"
        className="po-search-input"
      />
      {show && value && filtered.length > 0 && (
        <ul className="po-suggestion-list">
          {filtered.map((s) => (
            <li key={s} onMouseDown={() => { onSelect(s); setShow(false); }}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

const PurchaseOrder = () => {
  const navigate = useNavigate();

  const [orders, setOrders]       = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [parties, setParties]     = useState([]);

  /* search state */
  const [srchPoNo,     setSrchPoNo]     = useState("");
  const [srchParty,    setSrchParty]    = useState("");
  const [srchStatus,   setSrchStatus]   = useState("All");
  const [srchDateFrom, setSrchDateFrom] = useState("");
  const [srchDateTo,   setSrchDateTo]   = useState("");

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/purchase-orders`);
      setOrders(res.data);
      setFiltered(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchMasters = async () => {
    try {
      const partyRes = await axios.get(`${API_URL}/api/parties`);
      setParties(partyRes.data.filter((p) => p.status === "Active"));
    } catch (err) { console.log(err); }
  };

  useEffect(() => { fetchOrders(); fetchMasters(); }, []);

  const partyNames = [...new Set(parties.map((p) => p.partyName).filter(Boolean))].sort();

  const handleSearch = () => {
    let f = [...orders];
    if (srchPoNo)   f = f.filter((o) => o.poNo?.toLowerCase().includes(srchPoNo.toLowerCase()));
    if (srchParty)  f = f.filter((o) => o.partyName?.toLowerCase().includes(srchParty.toLowerCase()));
    if (srchStatus && srchStatus !== "All") f = f.filter((o) => o.status === srchStatus);
    if (srchDateFrom) f = f.filter((o) => o.poDate >= srchDateFrom);
    if (srchDateTo)   f = f.filter((o) => o.poDate <= srchDateTo);
    setFiltered(f);
  };

  const handleReset = () => {
    setSrchPoNo(""); setSrchParty("");
    setSrchStatus("All"); setSrchDateFrom(""); setSrchDateTo("");
    setFiltered(orders);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this Purchase Order?")) return;
    try {
      await axios.delete(`${API_URL}/api/purchase-order/${id}`);
      fetchOrders();
    } catch (err) { console.log(err); }
  };

  const statusColor = (s) => {
    if (s === "Ordered")            return "#2563eb";
    if (s === "Intransit")          return "#d97706";
    if (s === "Cancelled")          return "#16a34a";
    if (s === "Closed")             return "#dc2626";
    return "#64748b";
  };

  return (
    <div className="po-page">
      <ModuleNavbar />

      {/* TOP BAR */}
      <div className="po-topbar">
        <div className="po-topbar-left">
          <button className="po-back-btn" onClick={() => navigate("/procurement")}>←</button>
          <h1 className="po-title">Purchase Order</h1>
        </div>
        <button className="po-create-btn" onClick={() => navigate("/create-purchase-order")}>
          + Create PO
        </button>
      </div>

      {/* SEARCH CARD */}
      <div className="po-search-card">
        <div className="po-search-title">Search</div>

        <div className="po-search-grid">

          <div className="po-field">
            <label>PO No</label>
            <input
              type="text"
              className="po-search-input"
              value={srchPoNo}
              onChange={(e) => setSrchPoNo(e.target.value)}
              placeholder="Search PO No…"
            />
          </div>

          <div className="po-field">
            <label>Party Name</label>
            <TypeAhead
              value={srchParty}
              onChange={setSrchParty}
              suggestions={partyNames}
              onSelect={setSrchParty}
              placeholder="Type party name…"
            />
          </div>

          <div className="po-field">
            <label>Status</label>
            <select
              className="po-search-input"
              value={srchStatus}
              onChange={(e) => setSrchStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="po-field">
            <label>Date From</label>
            <input
              type="date"
              className="po-search-input"
              value={srchDateFrom}
              onChange={(e) => setSrchDateFrom(e.target.value)}
            />
          </div>

          <div className="po-field">
            <label>Date To</label>
            <input
              type="date"
              className="po-search-input"
              value={srchDateTo}
              onChange={(e) => setSrchDateTo(e.target.value)}
            />
          </div>

        </div>

        <div className="po-search-btns">
          <button className="po-btn-search" onClick={handleSearch}>Search</button>
          <button className="po-btn-reset"  onClick={handleReset}>Reset</button>
        </div>
      </div>

      {/* TABLE */}
      <div className="po-table-card">
        <div className="po-table-wrap">
          <table className="po-table">
            <thead>
              <tr>
                <th>S No</th>
                <th>PO No</th>
                <th>Date</th>
                <th>Party Name</th>
                <th>PO Type</th><th>Site</th>
                <th>Item Category</th>
                <th>Item</th>
                <th>Qty (MTS)</th>
                <th>Rate/MTS</th>
                <th>Basic Amt</th>
                <th>Service Charge</th>
                <th>Charges</th>
                <th>Discount</th>
                <th>Net Amt</th>
                <th>Payment Mode</th>
                <th>ETA</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((po, i) => (
                  <tr key={po._id}>
                    <td>{i + 1}</td>

                    {/* ── PO No — HYPERLINK (like GIN No in InwardOutwardNote) ── */}
                    <td>
                      <button
                        className="po-no-link"
                        onClick={() => navigate(`/purchase-order-detail/${po._id}`)}
                        title="Click to view full details"
                      >
                        {po.poNo}
                      </button>
                    </td>

                    <td>{po.poDate ? po.poDate.slice(0, 10) : ""}</td>
                    <td>{po.partyName}</td>
                    <td>{po.poType}</td><td>{po.site}</td>
                    <td>{po.items?.[0]?.itemCategory || ""}</td>
                    <td>{po.items?.map((it) => it.itemName).join(", ")}</td>
                    <td>{po.items?.reduce((s, it) => s + Number(it.qty || 0), 0)}</td>
                    <td>{po.items?.[0]?.rate || ""}</td>
                    <td>{Number(po.basicAmount || 0).toLocaleString("en-IN")}</td>
                    <td>{po.items?.reduce((s, it) => s + Number(it.serviceCharge || 0), 0).toFixed(2)}</td>
                    <td>{po.items?.reduce((s, it) => s + Number(it.charges || 0), 0).toFixed(2)}</td>
                    <td>{po.items?.reduce((s, it) => s + Number(it.discount || 0), 0).toFixed(2)}</td>
                    <td>{Number(po.netAmount || 0).toLocaleString("en-IN")}</td>
                    <td>{po.paymentMode}</td>
                    <td>{po.eta ? po.eta.slice(0, 10) : ""}</td>
                    <td>{po.dueDate ? po.dueDate.slice(0, 10) : ""}</td>
                    <td>
                      <span
                        className="po-status-badge"
                        style={{
                          background: statusColor(po.status) + "22",
                          color: statusColor(po.status),
                        }}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td>{po.remarks}</td>
                    <td>
                      <button
                        className="po-act-btn po-view"
                        onClick={() => navigate(`/purchase-order-detail/${po._id}`)}
                      >
                        View
                      </button>
                      <button
                        className="po-act-btn po-del"
                        onClick={() => handleDelete(po._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="19" className="po-no-data">No Purchase Orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;