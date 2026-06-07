import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./PODetails.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const PO_API = `${API_URL}/api/purchase-order`;

/* ─────────────────────────────────────────────────────────
   PODetail
   Opened from PurchaseOrder list by clicking the PO No link.
   Shows all PO fields + items table, fully editable inline.
───────────────────────────────────────────────────────── */
const PODetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [po,       setPo]       = useState(null);
  const [poEdit,   setPoEdit]   = useState({});
  const [editing,  setEditing]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  /* ── load PO ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${PO_API}/${id}`);
        setPo(res.data);
        setPoEdit({ ...res.data });
      } catch (err) {
        console.error(err);
        setError("Failed to load Purchase Order");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── save PO ── */
  const savePo = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${PO_API}/${id}`, poEdit);
      if (res.data.success) {
        setPo(res.data.data);
        setPoEdit({ ...res.data.data });
        setEditing(false);
        alert("Purchase Order Updated Successfully");
      }
    } catch (err) {
      console.error(err);
      alert("Update failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  /* ── item row helpers ── */
  const updateItem = (index, field, value) => {
    const items = [...(poEdit.items || [])];
    items[index] = { ...items[index], [field]: value };

    /* auto-recalc basicAmount and netAmount for the row */
    const row = items[index];
    const qty           = parseFloat(field === "qty"           ? value : row.qty           || 0) || 0;
    const rate          = parseFloat(field === "rate"          ? value : row.rate          || 0) || 0;
    const serviceCharge = parseFloat(field === "serviceCharge" ? value : row.serviceCharge || 0) || 0;
    const charges       = parseFloat(field === "charges"       ? value : row.charges       || 0) || 0;
    const discount      = parseFloat(field === "discount"      ? value : row.discount      || 0) || 0;

    const basicAmt = qty > 0 && rate > 0 ? qty * rate : (parseFloat(row.basicAmount) || 0);
    const netAmt   = basicAmt + serviceCharge + charges - discount;

    items[index].basicAmount = basicAmt;
    items[index].netAmount   = netAmt;

    /* recalc grand total */
    const totalNet = items.reduce((sum, it) => sum + (parseFloat(it.netAmount) || 0), 0);
    setPoEdit((p) => ({ ...p, items, netAmount: totalNet }));
  };

  /* ── field renderer helpers ── */
  const F = (field, type = "text", readOnly = false) =>
    editing && !readOnly ? (
      <input
        type={type}
        className="pod-input"
        value={poEdit[field] ?? ""}
        onChange={(e) => setPoEdit((p) => ({ ...p, [field]: e.target.value }))}
      />
    ) : (
      <div className="pod-value">{po?.[field] || "-"}</div>
    );

  const S = (field, opts) =>
    editing ? (
      <select
        className="pod-input"
        value={poEdit[field] ?? ""}
        onChange={(e) => setPoEdit((p) => ({ ...p, [field]: e.target.value }))}
      >
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <div className="pod-value">{po?.[field] || "-"}</div>
    );

  const statusColor = (s) => {
    if (s === "Ordered")            return { bg: "#dbeafe", fg: "#1d4ed8" };
    if (s === "Partially Received") return { bg: "#fef3c7", fg: "#d97706" };
    if (s === "Completed")          return { bg: "#dcfce7", fg: "#16a34a" };
    if (s === "Cancelled")          return { bg: "#fee2e2", fg: "#dc2626" };
    return { bg: "#f1f5f9", fg: "#64748b" };
  };

  /* ── guards ── */
  if (loading) return (
    <div className="pod-page"><ModuleNavbar /><div className="pod-loading">Loading…</div></div>
  );
  if (error) return (
    <div className="pod-page"><ModuleNavbar /><div className="pod-error">{error}</div></div>
  );

  const sc = statusColor(po?.status);

  return (
    <div className="pod-page">
      <ModuleNavbar />

      {/* ── PAGE HEADER ── */}
      <div className="pod-header">
        <button className="pod-back-btn" onClick={() => navigate("/purchase-order")}>
          ← Back
        </button>
        <div className="pod-header-title">
          <h2>Purchase Order Detail</h2>
          <span className="pod-pono-badge">{po?.poNo}</span>
        </div>
        <div className="pod-header-meta">
          <span
            className="pod-status-pill"
            style={{ background: sc.bg, color: sc.fg }}
          >
            {po?.status || "-"}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 1 — PO INFORMATION
      ══════════════════════════════════════════ */}
      <div className="pod-card">
        <div className="pod-card-header">
          <div className="pod-card-title">📋 Purchase Order Information</div>
          <div className="pod-card-actions">
            {editing ? (
              <>
                <button
                  className="pod-cancel-btn"
                  onClick={() => { setEditing(false); setPoEdit({ ...po }); }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button className="pod-save-btn" onClick={savePo} disabled={saving}>
                  {saving ? "Saving…" : "Save PO"}
                </button>
              </>
            ) : (
              <button className="pod-edit-btn" onClick={() => setEditing(true)}>
                Edit Details
              </button>
            )}
          </div>
        </div>

        <div className="pod-grid">

          <div className="pod-field">
            <div className="pod-label">PO No</div>
            <div className="pod-value pod-mono">{po?.poNo || "-"}</div>
          </div>

          <div className="pod-field">
            <div className="pod-label">PO Date</div>
            {F("poDate", "date")}
          </div>

          <div className="pod-field">
            <div className="pod-label">Party Name</div>
            {F("partyName")}
          </div>

          <div className="pod-field">
            <div className="pod-label">Party Code</div>
            {F("partyCode")}
          </div>

          <div className="pod-field">
            <div className="pod-label">Mobile No</div>
            {F("mobileNo")}
          </div>

          <div className="pod-field">
            <div className="pod-label">PO Type</div>
            {F("poType")}
          </div>

          <div className="pod-field">
            <div className="pod-label">Site</div>
            {F("site")}
          </div>

          <div className="pod-field">
            <div className="pod-label">Payment Mode</div>
            {S("paymentMode", ["", "Cash", "Cheque", "Online", "Credit"])}
          </div>

          <div className="pod-field">
            <div className="pod-label">ETA</div>
            {F("eta", "date")}
          </div>

          <div className="pod-field">
            <div className="pod-label">Due Date</div>
            {F("dueDate", "date")}
          </div>

          <div className="pod-field">
            <div className="pod-label">Status</div>
            {S("status", ["Ordered", "Partially Received", "Completed", "Cancelled"])}
          </div>

          <div className="pod-field pod-field-full">
            <div className="pod-label">Remarks</div>
            {editing ? (
              <textarea
                className="pod-textarea"
                value={poEdit.remarks ?? ""}
                onChange={(e) => setPoEdit((p) => ({ ...p, remarks: e.target.value }))}
                rows={3}
              />
            ) : (
              <div className="pod-value">{po?.remarks || "-"}</div>
            )}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 2 — ITEMS
      ══════════════════════════════════════════ */}
      <div className="pod-card">
        <div className="pod-card-header">
          <div className="pod-card-title">📦 Items</div>
          <div className="pod-basic-total">
            Total Net Amount: <strong>₹ {Number(poEdit.netAmount || po?.netAmount || 0).toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="pod-items-wrap">
          <table className="pod-items-table">
            <thead>
              <tr>
                <th>S No</th>
                <th>Item Code</th>
                <th>Item Category</th>
                <th>Item Name</th>
                <th>UOM</th>
                <th>Service Charge</th>
                <th>Charges</th>
                <th>Discount</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Basic Amount</th>
                <th>Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {(editing ? poEdit.items : po?.items)?.length > 0 ? (
                (editing ? poEdit.items : po?.items).map((item, i) => (
                  <tr key={i}>
                    <td>{item.sNo ?? i + 1}</td>
                    <td>
                      {editing
                        ? <input className="pod-item-input" value={item.itemCode || ""}
                            onChange={(e) => updateItem(i, "itemCode", e.target.value)} />
                        : item.itemCode || "-"}
                    </td>
                    <td>
                      {editing
                        ? <input className="pod-item-input" value={item.itemCategory || ""}
                            onChange={(e) => updateItem(i, "itemCategory", e.target.value)} />
                        : item.itemCategory || "-"}
                    </td>
                    <td>
                      {editing
                        ? <input className="pod-item-input" value={item.itemName || ""}
                            onChange={(e) => updateItem(i, "itemName", e.target.value)} />
                        : item.itemName || "-"}
                    </td>
                    <td>
                      {editing
                        ? <input className="pod-item-input" value={item.uom || ""}
                            onChange={(e) => updateItem(i, "uom", e.target.value)} />
                        : item.uom || "-"}
                    </td>
                    <td>
                      {editing
                        ? <input type="number" className="pod-item-input" value={item.serviceCharge ?? ""}
                            onChange={(e) => updateItem(i, "serviceCharge", e.target.value)} />
                        : item.serviceCharge ?? "-"}
                    </td>
                    <td>
                      {editing
                        ? <input type="number" className="pod-item-input" value={item.charges ?? ""}
                            onChange={(e) => updateItem(i, "charges", e.target.value)} />
                        : item.charges ?? "-"}
                    </td>
                    <td>
                      {editing
                        ? <input type="number" className="pod-item-input" value={item.discount ?? ""}
                            onChange={(e) => updateItem(i, "discount", e.target.value)} />
                        : item.discount ?? "-"}
                    </td>
                    <td>
                      {editing
                        ? <input type="number" className="pod-item-input" value={item.qty ?? ""}
                            onChange={(e) => updateItem(i, "qty", e.target.value)} />
                        : item.qty ?? "-"}
                    </td>
                    <td>
                      {editing
                        ? <input type="number" className="pod-item-input" value={item.rate ?? ""}
                            onChange={(e) => updateItem(i, "rate", e.target.value)} />
                        : item.rate ?? "-"}
                    </td>
                    <td className="pod-amt-cell">
                      {editing
                        ? <input readOnly className="pod-item-input pod-amt-input"
                            value={Number(item.basicAmount || 0).toLocaleString("en-IN")} />
                        : Number(item.basicAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="pod-amt-cell">
                      {editing
                        ? <input readOnly className="pod-item-input pod-amt-input"
                            value={Number(item.netAmount || 0).toLocaleString("en-IN")} />
                        : Number(item.netAmount || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="12" className="pod-no-items">No items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default PODetail;