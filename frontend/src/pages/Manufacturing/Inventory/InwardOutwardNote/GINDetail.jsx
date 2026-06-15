import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./Gindetail.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const GIN_API = `${API_URL}/api/goods-inward-note`;

/* ─────────────────────────────────────────────────────────────
   GINDetail
   Opened from GoodsInwardNote by clicking the GIN No hyperlink.
   Shows full GIN information + all linked weighment data.
   Both sections are fully editable inline.
   Items section now includes Item Group column.
───────────────────────────────────────────────────────────── */
const GINDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gin,        setGin]        = useState(null);
  const [ginEdit,    setGinEdit]    = useState({});
  const [ginEditing, setGinEditing] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [savingGin,  setSavingGin]  = useState(false);
  const [error,      setError]      = useState("");

  /* item master for code/name lookup */
  const [itemList, setItemList] = useState([]);

  /* ── load GIN ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ginRes  = await axios.get(`${GIN_API}/${id}`);
        const ginData = ginRes.data;
        setGin(ginData);
        setGinEdit({ ...ginData });
      } catch (err) {
        console.error(err);
        setError("Failed to load record");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── load item master for name/code lookups ── */
  useEffect(() => {
    axios.get(`${API_URL}/api/items`)
      .then((res) => {
        setItemList(res.data.filter((i) => i.status === "Active"));
      })
      .catch(console.error);
  }, []);

  /* ── GIN save ── */
  const saveGin = async () => {
    setSavingGin(true);
    try {
      const res = await axios.put(`${GIN_API}/${id}`, ginEdit);
      if (res.data.success) {
        setGin(res.data.data);
        setGinEdit({ ...res.data.data });
        setGinEditing(false);
        alert("GIN Updated Successfully");
      }
    } catch (err) {
      console.error(err);
      alert("GIN update failed");
    } finally {
      setSavingGin(false);
    }
  };

  /* ── Item row helper for editing in detail page ── */
  const ginF = (field, type = "text", readOnly = false) => (
    ginEditing && !readOnly
      ? <input type={type} className="gd-input" value={ginEdit[field] || ""}
          onChange={(e) => setGinEdit((p) => ({ ...p, [field]: e.target.value }))} />
      : <div className="gd-value">{gin?.[field] || "-"}</div>
  );

  const ginS = (field, opts) => (
    ginEditing
      ? <select className="gd-input" value={ginEdit[field] || ""}
          onChange={(e) => setGinEdit((p) => ({ ...p, [field]: e.target.value }))}>
          {opts.map((o) => <option key={o}>{o}</option>)}
        </select>
      : <div className="gd-value">{gin?.[field] || "-"}</div>
  );

  /* ── Item row helper for editing in detail page ── */
  const updateGinItem = (idx, field, value) => {
    const items = [...(ginEdit.items || [])];
    items[idx] = { ...items[idx], [field]: value };
    /* If code changes, auto-fill name + uom */
    if (field === "itemCode") {
      const found = itemList.find((i) => i.itemCode === value);
      if (found) {
        items[idx].itemName = found.itemName || "";
        items[idx].uom      = found.uom      || "";
      }
    }
    /* If name changes, auto-fill code + uom */
    if (field === "itemName") {
      const found = itemList.find((i) => i.itemName === value);
      if (found) {
        items[idx].itemCode = found.itemCode || "";
        items[idx].uom      = found.uom      || "";
      }
    }
    setGinEdit((p) => ({ ...p, items }));
  };

  if (loading) return (
    <div className="gd-page"><ModuleNavbar /><div className="gd-loading">Loading...</div></div>
  );
  if (error) return (
    <div className="gd-page"><ModuleNavbar /><div className="gd-error">{error}</div></div>
  );

  const displayItems = ginEditing ? (ginEdit.items || []) : (gin?.items || []);

  return (
    <div className="gd-page">
      <ModuleNavbar />

      {/* ── PAGE HEADER ── */}
      <div className="gd-header">
        <button className="gd-back-btn" onClick={() => navigate("/inward-outward-note")}>
          ← Back
        </button>
        <div className="gd-header-title">
          <h2>Inward Outward Detail</h2>
          <span className="gd-gin-no-badge">{gin?.ginNo}</span>
        </div>
        <div className="gd-header-meta">
          <span className={`gd-status-pill ${(gin?.status || "").toLowerCase()}`}>{gin?.status || "-"}</span>
          <span className={`gd-entry-pill ${(gin?.vehicleEntry || "").toLowerCase()}`}>{gin?.vehicleEntry || "-"}</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 1 — GIN INFORMATION
      ════════════════════════════════════════════════ */}
      <div className="gd-card">
        <div className="gd-card-header">
          <div className="gd-card-title">📋 GIN Information</div>
          <div className="gd-card-actions">
            {ginEditing ? (
              <>
                <button className="gd-cancel-btn" onClick={() => { setGinEditing(false); setGinEdit({ ...gin }); }} disabled={savingGin}>
                  Cancel
                </button>
                <button className="gd-save-btn" onClick={saveGin} disabled={savingGin}>
                  {savingGin ? "Saving..." : "Save GIN"}
                </button>
              </>
            ) : (
              <button className="gd-edit-btn" onClick={() => setGinEditing(true)}>Edit Details</button>
            )}
          </div>
        </div>

        <div className="gd-grid">

          <div className="gd-field">
            <div className="gd-label">GIN No</div>
            <div className="gd-value gd-readonly">{gin?.ginNo || "-"}</div>
          </div>

          <div className="gd-field">
            <div className="gd-label">GIN Date</div>
            {ginF("ginDate", "date")}
          </div>

          <div className="gd-field">
            <div className="gd-label">PO/CPO No</div>
            {ginF("poCpoNo")}
          </div>

          <div className="gd-field">
            <div className="gd-label">IN/OUT Type</div>
            {ginS("inOutType", ["Inward", "Outward"])}
          </div>

          <div className="gd-field">
            <div className="gd-label">Transaction Category</div>
            {ginF("transactionCategory")}
          </div>

          <div className="gd-field">
            <div className="gd-label">GIN Description</div>
            {ginF("ginDescription")}
          </div>

          <div className="gd-field">
            <div className="gd-label">GIN Type</div>
            {ginS("ginType", ["Domestic", "International"])}
          </div>

          <div className="gd-field">
            <div className="gd-label">Delivery Mode</div>
            {ginS("deliveryMode", ["By Road", "By Train", "By Air", "By Sea"])}
          </div>

          <div className="gd-field">
            <div className="gd-label">Status</div>
            {ginS("status", ["Open", "Weighted", "OutPending", "Closed"])}
          </div>

          <div className="gd-field">
            <div className="gd-label">Site</div>
            {ginF("site")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Party Code</div>
            {ginF("partyCode")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Party Name</div>
            {ginF("partyName")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Party Doc</div>
            {ginF("partyDoc")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Vehicle Entry</div>
            {ginS("vehicleEntry", ["Inward", "Outward"])}
          </div>

          <div className="gd-field">
            <div className="gd-label">Vehicle No</div>
            {ginF("vehicleNo")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Vendor Code</div>
            {ginF("vendorCode")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Vendor Name</div>
            {ginF("vendorName")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Manufacturer Code</div>
            {ginF("manufacturerCode")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Manufacturer Name</div>
            {ginF("manufacturerName")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Manufacturer Address</div>
            {ginF("manufacturerAddress")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Challan/Invoice No</div>
            {ginF("challanInvoiceNo")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Challan Date</div>
            {ginF("challanDate", "date")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Bill No</div>
            {ginF("billNo")}
          </div>

          <div className="gd-field">
            <div className="gd-label">Bill Date</div>
            {ginF("billDate", "date")}
          </div>

          <div className="gd-field">
            <div className="gd-label">E-Way Date</div>
            {ginF("ewayDate", "date")}
          </div>

        </div>

        {/* Remarks full-width */}
        <div className="gd-fullrow">
          <div className="gd-label">Remarks</div>
          {ginEditing
            ? <textarea className="gd-textarea" value={ginEdit.remarks || ""}
                onChange={(e) => setGinEdit((p) => ({ ...p, remarks: e.target.value }))} rows={3} />
            : <div className="gd-value">{gin?.remarks || "-"}</div>
          }
        </div>

        {/* ── ITEMS SECTION inside GIN card ── */}
        {displayItems.length > 0 && (
          <div className="gd-items-section" style={{ marginTop: 24 }}>
            <div className="gd-items-title">📦 Items</div>
            <div className="gd-items-wrap">
              <table className="gd-items-table">
                <thead>
                  <tr>
                    <th>S No</th>
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>UOM</th>
                    <th>Qty</th>
                    <th>Rate (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item, i) => {
                    const codeOpts = itemList.map((x) => x.itemCode).filter(Boolean);
                    const nameOpts = itemList.map((x) => x.itemName).filter(Boolean);

                    return (
                      <tr key={i}>
                        <td>{item.sNo ?? i + 1}</td>

                        {/* Item Code */}
                        <td>
                          {ginEditing ? (
                            <select
                              className="gd-item-input"
                              value={ginEdit.items?.[i]?.itemCode || ""}
                              onChange={(e) => updateGinItem(i, "itemCode", e.target.value)}
                            >
                              <option value="">- Code -</option>
                              {codeOpts.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          ) : (
                            item.itemCode || "-"
                          )}
                        </td>

                        {/* Item Name */}
                        <td>
                          {ginEditing ? (
                            <select
                              className="gd-item-input gd-item-wide"
                              value={ginEdit.items?.[i]?.itemName || ""}
                              onChange={(e) => updateGinItem(i, "itemName", e.target.value)}
                            >
                              <option value="">- Name -</option>
                              {nameOpts.map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          ) : (
                            item.itemName || "-"
                          )}
                        </td>

                        {/* UOM — auto-filled, editable */}
                        <td>
                          {ginEditing ? (
                            <input
                              type="text"
                              className="gd-item-input gd-item-sm"
                              value={ginEdit.items?.[i]?.uom || ""}
                              onChange={(e) => updateGinItem(i, "uom", e.target.value)}
                            />
                          ) : (
                            item.uom || "-"
                          )}
                        </td>

                        {/* Qty */}
                        <td>
                          {ginEditing ? (
                            <input
                              type="number"
                              className="gd-item-input gd-item-num"
                              value={ginEdit.items?.[i]?.qty ?? ""}
                              onChange={(e) => updateGinItem(i, "qty", e.target.value)}
                              min="0"
                            />
                          ) : (
                            item.qty ?? "-"
                          )}
                        </td>

                        {/* Rate */}
                        <td>
                          {ginEditing ? (
                            <input
                              type="number"
                              className="gd-item-input gd-item-num"
                              value={ginEdit.items?.[i]?.rate ?? ""}
                              onChange={(e) => updateGinItem(i, "rate", e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            item.rate != null && item.rate !== ""
                              ? `₹ ${Number(item.rate).toLocaleString("en-IN")}`
                              : "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════
          SECTION 2 — WEIGHMENT (removed per requirement)
          Weighment is managed separately via Create Weighment page.
      ════════════════════════════════════════════════ */}

      {/* Item select styles for detail page */}
      <style>{`
        .gd-item-input {
          width: 100%;
          padding: 5px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          font-size: 13px;
          color: #1e293b;
          background: #f8fafc;
        }
        .gd-item-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: #fff;
        }
        .gd-item-wide { min-width: 160px; }
        .gd-item-sm   { max-width: 80px; }
        .gd-item-num  { max-width: 80px; }
      `}</style>

    </div>
  );
};

export default GINDetail;