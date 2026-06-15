import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";
import "./PurchaseOrder.css";

const STATUS_OPTIONS = ["All", "Ordered", "Intransit", "Closed", "Cancelled"];

/* Reusable typeahead */
const TypeAhead = ({ value, onChange, suggestions, onSelect, placeholder }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = suggestions.filter((s) => s?.toLowerCase().includes(value.toLowerCase()));
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <input
        type="text" value={value} autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        placeholder={placeholder || "Type to search…"}
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
  const [orders,   setOrders]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [parties,  setParties]  = useState([]);

  const [srchPoNo,   setSrchPoNo]   = useState("");
  const [srchParty,  setSrchParty]  = useState("");
  const [srchStatus, setSrchStatus] = useState("All");
  const [srchDateFrom, setSrchDateFrom] = useState("");
  const [srchDateTo,   setSrchDateTo]   = useState("");

const fetchOrders = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/purchase-orders`);

    setOrders(res.data);

    // Default view: hide Closed & Cancelled
    const activePOs = res.data.filter(
      (po) => po.status !== "Closed" && po.status !== "Cancelled"
    );

    setFiltered(activePOs);
  } catch (err) {
    console.log(err);
  }
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
    let f =
  srchStatus === "All"
    ? orders.filter(
        (po) =>
          po.status !== "Closed" &&
          po.status !== "Cancelled"
      )
    : [...orders];
    if (srchPoNo)   f = f.filter((o) => o.poNo?.toLowerCase().includes(srchPoNo.toLowerCase()));
    if (srchParty)  f = f.filter((o) => o.partyName?.toLowerCase().includes(srchParty.toLowerCase()));
    if (srchStatus && srchStatus !== "All") f = f.filter((o) => o.status === srchStatus);
    if (srchDateFrom) f = f.filter((o) => o.poDate >= srchDateFrom);
    if (srchDateTo)   f = f.filter((o) => o.poDate <= srchDateTo);
    setFiltered(f);
  };

const handleReset = () => {
  setSrchPoNo("");
  setSrchParty("");
  setSrchStatus("All");
  setSrchDateFrom("");
  setSrchDateTo("");

  const activePOs = orders.filter(
    (po) => po.status !== "Closed" && po.status !== "Cancelled"
  );

  setFiltered(activePOs);
};

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this Purchase Order?")) return;
    try {
      await axios.delete(`${API_URL}/api/purchase-order/${id}`);
      fetchOrders();
    } catch (err) { console.log(err); }
  };

  const statusColor = (s) => {
    if (s === "Ordered")   return "#2563eb";
    if (s === "Intransit") return "#d97706";
    if (s === "Closed")    return "#16a34a";
    if (s === "Cancelled") return "#dc2626";
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
            <input type="text" className="po-search-input" value={srchPoNo}
              onChange={(e) => setSrchPoNo(e.target.value)} placeholder="Search PO No…" />
          </div>

          <div className="po-field">
            <label>Party Name</label>
            <TypeAhead value={srchParty} onChange={setSrchParty}
              suggestions={partyNames} onSelect={setSrchParty} placeholder="Type party name…" />
          </div>

          <div className="po-field">
            <label>Status</label>
            <select className="po-search-input" value={srchStatus}
              onChange={(e) => setSrchStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="po-field">
            <label>Date From</label>
            <input type="date" className="po-search-input" value={srchDateFrom}
              onChange={(e) => setSrchDateFrom(e.target.value)} />
          </div>

          <div className="po-field">
            <label>Date To</label>
            <input type="date" className="po-search-input" value={srchDateTo}
              onChange={(e) => setSrchDateTo(e.target.value)} />
          </div>

        </div>
        <div className="po-search-btns">
          <button className="po-btn-search" onClick={handleSearch}>Search</button>
          <button className="po-btn-reset"  onClick={handleReset}>Reset</button>
        </div>
      </div>

      {/* TABLE — columns: PO No | Date | Party | Type | Item | Qty | Amount | ETA | Status | Action */}
      <div className="po-table-card">
        <div className="po-table-wrap">
          <table className="po-table">
            <thead>
              <tr>
                <th>S No</th>
                <th>PO No</th>
                <th>Date</th>
                <th>Party</th>
                <th>Type</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>ETA</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((po, i) => (
                  <tr key={po._id}>
                    <td>{i + 1}</td>
                    <td>
                      <button className="po-no-link"
                        onClick={() => navigate(`/purchase-order-detail/${po._id}`)}
                        title="Click to view full details">
                        {po.poNo}
                      </button>
                    </td>
                    <td>{po.poDate ? po.poDate.slice(0, 10) : ""}</td>
                    <td>{po.partyName}</td>
                    <td>{po.poType}</td>
                    <td>{po.items?.map((it) => it.itemName).filter(Boolean).join(", ") || "-"}</td>
                    <td>{po.items?.reduce((s, it) => s + Number(it.qty || 0), 0) || 0}</td>
                    <td>₹ {Number(po.netAmount || 0).toLocaleString("en-IN")}</td>
                    <td>{po.eta ? po.eta.slice(0, 10) : "-"}</td>
                    <td>
                      <span className="po-status-badge"
                        style={{
                          background: statusColor(po.status) + "22",
                          color: statusColor(po.status),
                        }}>
                        {po.status}
                      </span>
                    </td>
                    <td>
                      <button className="po-act-btn po-view"
                        onClick={() => navigate(`/purchase-order-detail/${po._id}`)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="po-no-data">No Purchase Orders found</td>
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