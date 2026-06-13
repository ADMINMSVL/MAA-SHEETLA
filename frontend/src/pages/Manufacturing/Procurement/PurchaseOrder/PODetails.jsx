import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./PODetails.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const PO_API        = `${API_URL}/api/purchase-order`;
const STATUS_OPTIONS = ["Ordered", "Intransit", "Closed", "Cancelled"];

const statusColor = (s) => {
  if (s === "Ordered")   return { bg: "#dbeafe", fg: "#1d4ed8" };
  if (s === "Intransit") return { bg: "#fef3c7", fg: "#d97706" };
  if (s === "Closed")    return { bg: "#dcfce7", fg: "#16a34a" };
  if (s === "Cancelled") return { bg: "#fee2e2", fg: "#dc2626" };
  return { bg: "#f1f5f9", fg: "#64748b" };
};

/* Read-only display field */
const ReadField = ({ label, value }) => (
  <div className="pod-field">
    <div className="pod-label">{label}</div>
    <div className="pod-value">{value || "-"}</div>
  </div>
);

const PODetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [po,      setPo]      = useState(null);
  const [status,  setStatus]  = useState("");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  /* ── Load ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${PO_API}/${id}`);
        setPo(res.data);
        setStatus(res.data.status || "Ordered");
      } catch (err) {
        console.error(err);
        setError("Failed to load Purchase Order");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── Save status only ── */
  const saveStatus = async () => {
    if (!po) return;
    setSaving(true);
    try {
      const res = await axios.put(`${PO_API}/${id}`, { ...po, status });
      if (res.data.success) {
        setPo(res.data.data);
        setStatus(res.data.data.status);
        alert("Status Updated Successfully");
      }
    } catch (err) {
      console.error(err);
      alert("Update failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  /* ── Guards ── */
  if (loading) return (
    <div className="pod-page"><ModuleNavbar /><div className="pod-loading">Loading…</div></div>
  );
  if (error) return (
    <div className="pod-page"><ModuleNavbar /><div className="pod-error">{error}</div></div>
  );

  const sc = statusColor(status);

  return (
    <div className="pod-page">
      <ModuleNavbar />

      {/* PAGE HEADER */}
      <div className="pod-header">
        <button className="pod-back-btn" onClick={() => navigate("/purchase-order")}>← Back</button>
        <div className="pod-header-title">
          <h2>Purchase Order Detail</h2>
          <span className="pod-pono-badge">{po?.poNo}</span>
        </div>
        <div className="pod-header-meta">
          <span className="pod-status-pill" style={{ background: sc.bg, color: sc.fg }}>
            {status || "-"}
          </span>
        </div>
      </div>

      {/* ══════════ ORDER DETAILS CARD ══════════ */}
      <div className="pod-card">
        <div className="pod-card-header">
          <div className="pod-card-title">📋 Order Details</div>
          <div className="pod-card-actions">
            {/* Only status is editable — save button */}
            <button className="pod-save-btn" onClick={saveStatus} disabled={saving}>
              {saving ? "Saving…" : "Update Status"}
            </button>
          </div>
        </div>

        <div className="pod-grid">

          {/* 1. PO No */}
          <div className="pod-field">
            <div className="pod-label">PO No</div>
            <div className="pod-value pod-mono">{po?.poNo || "-"}</div>
          </div>

          {/* 2. PO Date */}
          <ReadField label="PO Date" value={po?.poDate ? po.poDate.slice(0, 10) : ""} />

          {/* 3. PO Type */}
          <ReadField label="PO Type" value={po?.poType} />

          {/* 4. Party Code */}
          <ReadField label="Party Code" value={po?.partyCode} />

          {/* 5. Party Name */}
          <ReadField label="Party Name" value={po?.partyName} />

          {/* 6. Site */}
          <ReadField label="Site" value={po?.site} />

          {/* 7. Payment Mode */}
          <ReadField label="Payment Mode" value={po?.paymentMode} />

          {/* 8. ETA */}
          <ReadField label="ETA" value={po?.eta ? po.eta.slice(0, 10) : ""} />

          {/* 9. Due Date */}
          <ReadField label="Due Date" value={po?.dueDate ? po.dueDate.slice(0, 10) : ""} />

          {/* 10. Status — EDITABLE (only this field) */}
          <div className="pod-field">
            <div className="pod-label">Status</div>
            <select
              className="pod-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 11. Remarks */}
          <div className="pod-field pod-field-full">
            <div className="pod-label">Remarks</div>
            <div className="pod-value">{po?.remarks || "-"}</div>
          </div>

        </div>
      </div>

      {/* ══════════ ITEMS CARD ══════════ */}
      <div className="pod-card">
        <div className="pod-card-header">
          <div className="pod-card-title">📦 Items</div>
          <div className="pod-basic-total">
            Item Basic Total: <strong>₹ {Number(po?.basicAmount || 0).toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="pod-items-wrap">
          <table className="pod-items-table">
            <thead>
              <tr>
                <th>S No</th>
                <th>Item Category</th>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>UOM</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Basic Amount</th>
              </tr>
            </thead>
            <tbody>
              {po?.items?.length > 0 ? (
                po.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.sNo ?? i + 1}</td>
                    <td>{item.itemCategory || "-"}</td>
                    <td>{item.itemCode || "-"}</td>
                    <td>{item.itemName || "-"}</td>
                    <td>{item.uom || "-"}</td>
                    <td>{item.qty ?? "-"}</td>
                    <td>{item.rate ?? "-"}</td>
                    <td className="pod-amt-cell">
                      {Number(item.basicAmount || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" className="pod-no-items">No items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════ SERVICE (if present) ══════════ */}
      {po?.serviceRows?.length > 0 && (
        <div className="pod-card">
          <div className="pod-card-header">
            <div className="pod-card-title">🔧 Service</div>
          </div>
          <div className="pod-items-wrap">
            <table className="pod-items-table">
              <thead>
                <tr>
                  <th>S No</th>
                  <th>Service Code</th>
                  <th>Service Name</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {po.serviceRows.map((row, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{row.serviceCode || "-"}</td>
                    <td>{row.serviceName || "-"}</td>
                    <td>{row.qty ?? "-"}</td>
                    <td>{row.rate ?? "-"}</td>
                    <td className="pod-amt-cell">{Number(row.amount || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ CHARGES/DISCOUNT (if present) ══════════ */}
      {po?.chargeRows?.length > 0 && (
        <div className="pod-card">
          <div className="pod-card-header">
            <div className="pod-card-title">💰 Charges / Discount</div>
          </div>
          <div className="pod-items-wrap">
            <table className="pod-items-table">
              <thead>
                <tr>
                  <th>S No</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {po.chargeRows.map((row, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{row.code || "-"}</td>
                    <td>{row.description || "-"}</td>
                    <td className="pod-amt-cell">{Number(row.amount || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ TAX DETAILS (if present) ══════════ */}
      {po?.taxRows?.length > 0 && (
        <div className="pod-card">
          <div className="pod-card-header">
            <div className="pod-card-title">🧾 Tax Details</div>
          </div>
          <div className="pod-items-wrap">
            <table className="pod-items-table">
              <thead>
                <tr>
                  <th>S No</th>
                  <th>Tax Type</th>
                  <th>Tax Code</th>
                  <th>Tax Name</th>
                  <th>Total Tax %</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {po.taxRows.map((row, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{row.taxType || "-"}</td>
                    <td>{row.taxCode || "-"}</td>
                    <td>{row.taxName || "-"}</td>
                    <td>{row.totalTax || "-"}</td>
                    <td className="pod-amt-cell">{Number(row.amount || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ GRAND TOTAL ══════════ */}
      <div className="pod-card">
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px", fontSize: 16, fontWeight: 700, color: "#1d4ed8" }}>
          Grand Total Amount: &nbsp; ₹ {Number(po?.netAmount || 0).toLocaleString("en-IN")}
        </div>
      </div>

    </div>
  );
};

export default PODetail;