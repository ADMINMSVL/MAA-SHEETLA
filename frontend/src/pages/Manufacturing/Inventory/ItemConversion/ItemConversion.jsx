import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";
// import "./ItemConversion.css";

/* ── Inward Note Export Modal ── */
const InwardExportModal = ({ records, onSelect, onClose }) => (
  <div className="ic-modal-overlay" onClick={onClose}>
    <div className="ic-modal" onClick={(e) => e.stopPropagation()}>
      <div className="ic-modal-header">
        <h3>Select Inward Note to Convert</h3>
        <button className="ic-modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="ic-modal-body">
        {records.length === 0 ? (
          <div className="ic-modal-empty">No Inward Notes found.</div>
        ) : (
          <table className="ic-modal-table">
            <thead>
              <tr>
                <th>IN/OUT No</th>
                <th>Date</th>
                <th>Party Name</th>
                <th>Vehicle No</th>
                <th>PO No</th>
                <th>Items</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.ginNo}</strong></td>
                  <td>{r.ginDate || "-"}</td>
                  <td>{r.partyName || "-"}</td>
                  <td>{r.vehicleNo || "-"}</td>
                  <td>{r.poCpoNo || "-"}</td>
                  <td>{r.items?.map((i) => i.itemName).join(", ") || "-"}</td>
                  <td>
                    <button className="ic-modal-select-btn" onClick={() => onSelect(r)}>
                      Export
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

const ItemConversion = () => {
  const navigate = useNavigate();

  const [records,  setRecords]  = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(false);

  /* search */
  const [srchFromDate, setSrchFromDate] = useState("");
  const [srchToDate,   setSrchToDate]   = useState("");
  const [srchIcNo,     setSrchIcNo]     = useState("");
  const [srchVehicle,  setSrchVehicle]  = useState("");
  const [srchItemCode, setSrchItemCode] = useState("");

  /* export modal */
  const [showModal,     setShowModal]     = useState(false);
  const [inwardRecords, setInwardRecords] = useState([]);
  const [loadingInward, setLoadingInward] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/item-conversion`);
      setRecords(res.data);
      setFiltered(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleSearch = () => {
    let f = [...records];
    if (srchFromDate) f = f.filter((r) => r.conversionDate >= srchFromDate);
    if (srchToDate)   f = f.filter((r) => r.conversionDate <= srchToDate);
    if (srchIcNo)     f = f.filter((r) => r.icNo?.toLowerCase().includes(srchIcNo.toLowerCase()));
    if (srchVehicle)  f = f.filter((r) => r.vehicleNo?.toLowerCase().includes(srchVehicle.toLowerCase()));
    if (srchItemCode) f = f.filter((r) => r.itemCode?.toLowerCase().includes(srchItemCode.toLowerCase()));
    setFiltered(f);
  };

  const handleReset = () => {
    setSrchFromDate(""); setSrchToDate(""); setSrchIcNo("");
    setSrchVehicle(""); setSrchItemCode("");
    setFiltered(records);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this Item Conversion?")) return;
    try {
      await axios.delete(`${API_URL}/api/item-conversion/${id}`);
      fetchRecords();
    } catch (err) { console.error(err); }
  };

  const handleOpenInwardModal = async () => {
    setShowModal(true);
    setLoadingInward(true);
    try {
      const res = await axios.get(`${API_URL}/api/goods-inward-note`);
      setInwardRecords(
        (Array.isArray(res.data) ? res.data : []).filter(
          (r) => !r.inOutType || r.inOutType === "Inward"
        )
      );
    } catch (err) { console.error(err); setInwardRecords([]); }
    finally { setLoadingInward(false); }
  };

  const handleInwardSelect = (gin) => {
    setShowModal(false);
    navigate("/create-item-conversion", { state: { fromGIN: gin } });
  };

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  return (
    <div className="ic-page">
      <ModuleNavbar />

      <div className="ic-topbar">
        <div className="ic-topbar-left">
          <button className="ic-back-btn" onClick={() => navigate("/inventory")}>←</button>
          <div>
            <h1>Item Conversion</h1>
            <span className="ic-topbar-sub">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="ic-topbar-right">
          <button className="ic-export-btn" onClick={handleOpenInwardModal}>
            📋 Export from Inward
          </button>
          <button className="ic-create-btn" onClick={() => navigate("/create-item-conversion")}>
            + Create
          </button>
        </div>
      </div>

      {/* SEARCH CARD */}
      <div className="ic-card">
        <div className="ic-card-title"><span className="ic-card-icon">🔍</span> Search</div>
        <div className="ic-search-grid">
          <div className="ic-field">
            <label>From Date</label>
            <input type="date" value={srchFromDate} onChange={(e) => setSrchFromDate(e.target.value)} />
          </div>
          <div className="ic-field">
            <label>To Date</label>
            <input type="date" value={srchToDate} onChange={(e) => setSrchToDate(e.target.value)} />
          </div>
          <div className="ic-field">
            <label>IC No</label>
            <input type="text" value={srchIcNo} onChange={(e) => setSrchIcNo(e.target.value)} placeholder="Search IC No…" />
          </div>
          <div className="ic-field">
            <label>Vehicle No</label>
            <input type="text" value={srchVehicle} onChange={(e) => setSrchVehicle(e.target.value)} placeholder="Search vehicle…" />
          </div>
          <div className="ic-field">
            <label>Item Code</label>
            <input type="text" value={srchItemCode} onChange={(e) => setSrchItemCode(e.target.value)} placeholder="Search item code…" />
          </div>
        </div>
        <div className="ic-search-btns">
          <button className="ic-search-btn" onClick={handleSearch}>Search</button>
          <button className="ic-reset-btn"  onClick={handleReset}>Reset</button>
        </div>
      </div>

      {/* TABLE */}
      <div className="ic-card">
        {loading ? (
          <div className="ic-loading">
            <span className="ic-loading-spinner" /> Loading…
          </div>
        ) : (
          <div className="ic-table-wrap">
            <table className="ic-table">
              <thead>
                <tr>
                  <th>S No</th>
                  <th>IC No</th>
                  <th>Date</th>
                  <th>PO No</th>
                  <th>Vehicle No</th>
                  <th>Party Name</th>
                  <th>Item Code</th>
                  <th>Item Description</th>
                  <th>CQty</th>
                  <th>RQty</th>
                  <th>UOM</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((r, i) => {
                    const rqty   = r.totalRaQty ?? (r.conversionRows || []).reduce((s, row) => s + (Number(row.raQty || row.rQty) || 0), 0);
                    const amount = r.totalAmount ?? r.totalRate ?? 0;
                    return (
                      <tr key={r._id}>
                        <td className="ic-sno-cell">{i + 1}</td>
                        <td>
                          <button className="ic-no-link" onClick={() => navigate(`/item-conversion-detail/${r._id}`)}>
                            {r.icNo}
                          </button>
                        </td>
                        <td>{r.conversionDate || "-"}</td>
                        <td>{r.poNo || "-"}</td>
                        <td>{r.vehicleNo || "-"}</td>
                        <td>{r.partyName || "-"}</td>
                        <td><span className="ic-code-pill">{r.itemCode || "-"}</span></td>
                        <td>{r.itemDescription || "-"}</td>
                        <td className="ic-num-cell">{fmt(r.baseQty)}</td>
                        <td className="ic-num-cell">{fmt(rqty)}</td>
                        <td>{r.uom || "-"}</td>
                        <td className="ic-amt-cell"><strong>₹ {fmt(amount)}</strong></td>
                        <td className="ic-action-cell">
                          <button className="ic-view-btn" onClick={() => navigate(`/item-conversion-detail/${r._id}`)}>
                            View
                          </button>
                          <button className="ic-del-btn" onClick={() => handleDelete(r._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="13" className="ic-no-data">No Item Conversions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inward Export Modal */}
      {showModal && (
        <InwardExportModal
          records={loadingInward ? [] : inwardRecords}
          onSelect={handleInwardSelect}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default ItemConversion;