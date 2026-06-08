import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const ItemConversionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Accept record passed via navigation state (instant) or fetch by id
  const [doc, setDoc]       = useState(location.state?.record || null);
  const [loading, setLoading] = useState(!location.state?.record);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (doc) { setLoading(false); return; }
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/item-conversion/${id}`);
        setDoc(res.data);
      } catch {
        setError("Item Conversion record not found.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, doc]);

  // Derived totals — recalculate from rows in case saved data differs
  const rows        = doc?.conversionRows || [];
  const totalRaQty  = rows.reduce((s, r) => s + (Number(r.raQty)  || 0), 0);
  const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const fmt   = (n) => Number(n || 0).toLocaleString("en-IN");
  const fmtRs = (n) => `₹ ${fmt(n)}`;

  return (
    <div className="ic-page">
      <ModuleNavbar />

      {/* ── TOPBAR ── */}
      <div className="ic-topbar">
        <div className="ic-topbar-left">
          <button className="ic-back-btn" onClick={() => navigate("/item-conversion")}>
            ← Back
          </button>
          <div>
            <h2>Item Conversion Details</h2>
            <span className="ic-topbar-sub">
              {doc?.icNo ? `Document: ${doc.icNo}` : "View record"}
            </span>
          </div>
        </div>
      </div>

      {loading && <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>}
      {error   && <div style={{ padding: "2rem", color: "red" }}>{error}</div>}

      {doc && (
        <>
          {/* ── SECTION 1: CONVERSION INFORMATION ── */}
          <div className="ic-card">
            <div className="ic-card-title">
              <span className="ic-card-icon">📋</span> Conversion Information
            </div>
            <div className="ic-form-grid">

              <div className="ic-field">
                <label>IC No</label>
                <input type="text" readOnly value={doc.icNo || "—"} className="ic-readonly ic-mono" />
              </div>

              <div className="ic-field">
                <label>Conversion Date</label>
                <input type="text" readOnly value={doc.conversionDate || "—"} className="ic-readonly" />
              </div>

              <div className="ic-field">
                <label>PO No</label>
                <input type="text" readOnly value={doc.poNo || "—"} className="ic-readonly" />
              </div>

              <div className="ic-field">
                <label>Vehicle No</label>
                <input type="text" readOnly value={doc.vehicleNo || "—"} className="ic-readonly" />
              </div>

              <div className="ic-field">
                <label>Party Name</label>
                <input type="text" readOnly value={doc.partyName || "—"} className="ic-readonly" />
              </div>

              <div className="ic-field">
                <label>Status</label>
                <input type="text" readOnly value={doc.status || "—"} className="ic-readonly" />
              </div>

              {doc.remarks && (
                <div className="ic-field ic-field-full">
                  <label>Remarks</label>
                  <textarea
                    rows={2}
                    readOnly
                    value={doc.remarks}
                    className="ic-readonly"
                    style={{ resize: "none" }}
                  />
                </div>
              )}

            </div>
          </div>

          {/* ── SECTION 2: BASE ITEM ── */}
          <div className="ic-card">
            <div className="ic-card-title">
              <span className="ic-card-icon">📦</span> Base Item
            </div>
            <div className="ic-base-item-grid">

              <div className="ic-field">
                <label>Item Code</label>
                <input type="text" readOnly value={doc.itemCode || "—"} className="ic-readonly ic-mono" />
              </div>

              <div className="ic-field">
                <label>Item Name</label>
                <input type="text" readOnly value={doc.itemDescription || "—"} className="ic-readonly" />
              </div>

              <div className="ic-field">
                <label>CQty (Base Qty)</label>
                <input type="text" readOnly value={fmt(doc.baseQty)} className="ic-readonly" />
              </div>

              <div className="ic-field">
                <label>UOM</label>
                <input type="text" readOnly value={doc.uom || "—"} className="ic-readonly" />
              </div>

              <div className="ic-field">
                <label>RQty <span className="ic-auto-badge">Total</span></label>
                <input
                  type="text"
                  readOnly
                  value={totalRaQty > 0 ? fmt(totalRaQty) : "—"}
                  className="ic-readonly ic-auto-green"
                  title="Sum of all RaQty from conversion rows"
                />
              </div>

              <div className="ic-field">
                <label>Total Amount <span className="ic-auto-badge">Total</span></label>
                <input
                  type="text"
                  readOnly
                  value={totalAmount > 0 ? fmtRs(totalAmount) : "—"}
                  className="ic-readonly ic-auto-green"
                  title="Sum of all amounts from conversion rows"
                />
              </div>

            </div>
          </div>

          {/* ── SECTION 3: CONVERSION BIFURCATION ── */}
          <div className="ic-card">
            <div className="ic-card-header-row">
              <div className="ic-card-title">
                <span className="ic-card-icon">🔄</span> Conversion Bifurcation
              </div>
              <div className="ic-total-badge">
                Total Amount: <strong>{fmtRs(totalAmount)}</strong>
              </div>
            </div>

            <div className="ic-conv-table-wrap">
              <table className="ic-conv-table">
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>S No</th>
                    <th>Item Name</th>
                    <th>UOM</th>
                    <th>RaQty</th>
                    <th>Item Code</th>
                    <th>Rate (₹)</th>
                    <th>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "ic-row-even" : "ic-row-odd"}>

                        <td className="ic-sno">{row.sNo ?? idx + 1}</td>

                        {/* Item Name */}
                        <td style={{ fontWeight: 500 }}>
                          {row.inventoryName || "—"}
                        </td>

                        {/* UOM — from saved row */}
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              background: "var(--ic-uom-bg, #e8f5e9)",
                              color: "var(--ic-uom-color, #2e7d32)",
                              borderRadius: "4px",
                              padding: "2px 8px",
                              fontSize: "0.82em",
                              fontWeight: 600,
                              letterSpacing: "0.03em",
                            }}
                          >
                            {row.uom || "—"}
                          </span>
                        </td>

                        {/* RaQty */}
                        <td className="ic-sno" style={{ fontWeight: 600 }}>
                          {fmt(row.raQty)}
                        </td>

                        {/* Item Code */}
                        <td style={{ fontFamily: "monospace", fontSize: "0.88em", opacity: 0.75 }}>
                          {row.inventoryCode || "—"}
                        </td>

                        {/* Rate — was missing in old detail page */}
                        <td className="ic-sno" style={{ fontWeight: 600 }}>
                          {Number(row.rate) > 0 ? fmt(row.rate) : "—"}
                        </td>

                        {/* Amount — was missing in old detail page */}
                        <td className="ic-amount-cell">
                          {Number(row.amount) > 0 ? fmt(row.amount) : "—"}
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "1.5rem", opacity: 0.5 }}>
                        No conversion rows found
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="ic-total-label">Total</td>
                    <td className="ic-total-qty">{fmt(totalRaQty)}</td>
                    <td />
                    <td />
                    <td className="ic-total-val">{fmtRs(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ItemConversionDetail;