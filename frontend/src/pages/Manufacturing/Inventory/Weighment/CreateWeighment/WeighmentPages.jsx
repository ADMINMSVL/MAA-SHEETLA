/**
 * WeighmentPages.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * All four weighment screens in one file:
 *   1. CreateWeighment      — landing page, choose Inward or Outward
 *   2. CreateInwardWeighment — auto-loads all non-closed inward GIN records
 *   3. CreateOutwardWeighment — auto-loads all non-closed outward GIN records
 *   4. WeighmentDetail       — view / edit a single weighment record
 *
 * Usage in your router (React Router v6):
 *   import { CreateWeighment, CreateInwardWeighment, CreateOutwardWeighment, WeighmentDetail }
 *     from "./WeighmentPages";
 *
 *   <Route path="/weighment/create"          element={<CreateWeighment />} />
 *   <Route path="/weighment/create/inward"   element={<CreateInwardWeighment />} />
 *   <Route path="/weighment/create/outward"  element={<CreateOutwardWeighment />} />
 *   <Route path="/weighment-detail/:id"      element={<WeighmentDetail />} />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ModuleNavbar from "../../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../../config";

/* ─── API endpoints ─────────────────────────────────────────────────────── */
const GIN_API        = `${API_URL}/api/goods-inward-note`;
const WEIGHMENT_API  = `${API_URL}/api/weighment`;
const ITEM_MASTER_API= `${API_URL}/api`;
const today          = new Date().toISOString().split("T")[0];

/* ─── Shared helpers ─────────────────────────────────────────────────────── */
const blankItem = (sNo) => ({
  sNo, itemCode: "", itemName: "", uom: "",
  firstWeight: "", secondWeight: "", netWeight: "", remarks: "", _checked: false,
});

const hasMainWeight = (data) =>
  !!(data?.firstWeight || data?.secondWeight || data?.netWeight);

const hasAnyItemWeight = (rows) =>
  rows.some((r) => r.firstWeight || r.secondWeight || r.netWeight || r.remarks);

const makeItems = (data) => {
  const rows =
    Array.isArray(data.items) && data.items.length > 0
      ? data.items.map((it, i) => ({
          sNo: it.sNo || i + 1,
          itemCode: it.itemCode || "", itemName: it.itemName || "", uom: it.uom || "",
          firstWeight: it.firstWeight || "", secondWeight: it.secondWeight || "",
          netWeight: it.netWeight || "", remarks: it.remarks || "", _checked: false,
        }))
      : Array.from({ length: 4 }, (_, i) => blankItem(i + 1));

  if (hasMainWeight(data) && !hasAnyItemWeight(rows)) {
    rows[0] = {
      ...rows[0],
      sNo: 1,
      firstWeight: data.firstWeight || "",
      secondWeight: data.secondWeight || "",
      netWeight: data.netWeight || "",
    };
  }

  return rows.map((row, idx) => ({ ...row, sNo: idx + 1 }));
};

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED CSS  (injected once via <WeighmentStyles />)
═══════════════════════════════════════════════════════════════════════════ */
const STYLES = `
/* ── reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── page shell ── */
.wp-page { background: #f4f6fb; min-height: 100vh; padding-bottom: 48px;
           font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; }

/* ── page header ── */
.wp-header {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 20px; background: #fff;
  border-bottom: 1.5px solid #e5e7eb;
  position: sticky; top: 0; z-index: 20;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
}
.wp-header h2 { flex: 1; font-size: 17px; font-weight: 700; color: #1e293b; }
.wp-back-btn {
  background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px;
  padding: 6px 12px; font-size: 16px; cursor: pointer; color: #374151;
  line-height: 1;
}
.wp-back-btn:hover { background: #e5e7eb; }

/* ── badges ── */
.wp-badge {
  padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .4px;
}
.wp-badge-inward  { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
.wp-badge-outward { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.wp-badge-general { background: #e0e7ff; color: #3730a3; border: 1px solid #a5b4fc; }
.wp-badge-draft   { background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }
.wp-badge-partial { background: #fef9c3; color: #854d0e; border: 1px solid #fcd34d; }
.wp-badge-submit  { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
.wp-badge-weighted{ background: #dcfce7; color: #166534; border: 1px solid #86efac; }
.wp-badge-open    { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
.wp-badge-closed  { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

/* ── card ── */
.wp-card {
  background: #fff; border-radius: 10px; border: 1px solid #e5e7eb;
  margin: 12px 18px; padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.wp-card-accent-top { border-top: 3px solid #6366f1; }

/* ── section title ── */
.wp-section-title {
  font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase;
  letter-spacing: .5px; padding-bottom: 8px; margin-bottom: 14px;
  border-bottom: 1.5px solid #e5e7eb;
  display: flex; align-items: center; gap: 8px;
}
.wp-section-count {
  font-size: 11px; font-weight: 500; color: #6366f1;
  background: #eff0ff; padding: 2px 10px; border-radius: 12px; text-transform: none;
}

/* ── form grid ── */
.wp-grid { display: grid; gap: 12px 16px; }
.wp-grid-4 { grid-template-columns: repeat(4, 1fr); }
.wp-grid-2 { grid-template-columns: repeat(2, 1fr); }
@media (max-width: 1100px) { .wp-grid-4 { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 800px)  { .wp-grid-4 { grid-template-columns: repeat(2, 1fr); }
                              .wp-grid-2 { grid-template-columns: 1fr; } }
@media (max-width: 520px)  { .wp-grid-4 { grid-template-columns: 1fr; } }

/* ── field ── */
.wp-field { display: flex; flex-direction: column; gap: 4px; }
.wp-field-full { grid-column: 1 / -1; }
.wp-field label {
  font-size: 11px; font-weight: 600; color: #6b7280;
  text-transform: uppercase; letter-spacing: .35px;
}
.wp-field input, .wp-field select, .wp-field textarea {
  border: 1px solid #d1d5db; border-radius: 6px; padding: 7px 10px;
  font-size: 13px; color: #1e293b; background: #fff; outline: none;
  transition: border-color .15s;
}
.wp-field input:focus, .wp-field select:focus, .wp-field textarea:focus {
  border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.12);
}
.wp-readonly { background: #f9fafb !important; color: #6b7280 !important; cursor: not-allowed; }

/* ── action row ── */
.wp-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 18px; border-top: 1.5px solid #e5e7eb;
  background: #fff; position: sticky; bottom: 0; z-index: 10;
}
.wp-btn-cancel {
  padding: 8px 22px; border: 1px solid #d1d5db; border-radius: 7px;
  background: #fff; color: #374151; font-size: 13px; cursor: pointer;
}
.wp-btn-cancel:hover { background: #f9fafb; }
.wp-btn-draft {
  padding: 8px 22px; border: 1px solid #a5b4fc; border-radius: 7px;
  background: #eff0ff; color: #3730a3; font-size: 13px; font-weight: 600; cursor: pointer;
}
.wp-btn-draft:hover:not(:disabled) { background: #e0e7ff; }
.wp-btn-save {
  padding: 8px 26px; border: none; border-radius: 7px;
  background: #6366f1; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
}
.wp-btn-save:hover:not(:disabled) { background: #4f46e5; }
.wp-btn-cancel:disabled, .wp-btn-draft:disabled, .wp-btn-save:disabled {
  opacity: .5; cursor: not-allowed;
}

/* ── table ── */
.wp-table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb; }
.wp-table {
  width: 100%; border-collapse: collapse; font-size: 12px; white-space: nowrap; min-width: 860px;
}
.wp-table thead { background: #f8fafc; }
.wp-table th {
  padding: 9px 10px; text-align: left; font-size: 11px; font-weight: 700;
  color: #374151; border-bottom: 1.5px solid #e5e7eb;
}
.wp-table td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #374151; }
.wp-table tbody tr:hover { background: #f8fafc; cursor: pointer; }

/* status cells */
.wp-status { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.wp-status-open    { background: #dcfce7; color: #166534; }
.wp-status-closed  { background: #fee2e2; color: #991b1b; }

/* note number link button */
.wp-link-btn {
  background: none; border: none; color: #6366f1; font-weight: 700;
  font-size: 12px; cursor: pointer; padding: 0;
  text-decoration: underline; text-underline-offset: 2px;
}
.wp-link-btn:hover  { color: #4f46e5; }
.wp-link-btn:disabled { color: #9ca3af; cursor: default; }

/* linked / unlinked weighment */
.wp-wt-linked { color: #16a34a; font-size: 11px; font-weight: 600; }
.wp-wt-none   { color: #9ca3af; font-size: 11px; }

/* ── placeholder ── */
.wp-placeholder { text-align: center; padding: 36px 20px; color: #9ca3af; font-size: 14px; }

/* ── weight strip ── */
.wp-weight-strip {
  display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: flex-end;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 14px 18px; margin-top: 2px;
}
.wp-weight-box { display: flex; flex-direction: column; gap: 4px; min-width: 140px; flex: 1; }
.wp-weight-get-box { min-width: 260px; flex: 2; }
.wp-weight-box label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: .35px; }
.wp-wt-yellow {
  border: 1.5px solid #fbbf24; border-radius: 6px; padding: 7px 10px;
  font-size: 13px; font-weight: 700; color: #92400e; background: #fffbeb;
  width: 100%; outline: none;
}
.wp-wt-green {
  border: 1.5px solid #4ade80; border-radius: 6px; padding: 7px 10px;
  font-size: 13px; font-weight: 700; color: #166534; background: #f0fdf4;
  width: 100%; outline: none;
}
.wp-get-weight-wrap { display: flex; gap: 6px; align-items: center; }
.wp-get-wt-input {
  flex: 1; border: 1.5px solid #d1d5db; border-radius: 6px; padding: 7px 10px;
  font-size: 13px; outline: none;
}
.wp-get-wt-input:focus { border-color: #6366f1; }
.wp-get-btn {
  padding: 7px 16px; background: #6366f1; color: #fff; border: none;
  border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap;
}
.wp-get-btn:hover:not(:disabled) { background: #4f46e5; }
.wp-get-btn:disabled { background: #e5e7eb; color: #9ca3af; cursor: default; }
.wp-get-btn-done { background: #22c55e !important; }
.wp-wt-hint { font-size: 10px; font-weight: 400; color: #6366f1; margin-left: 6px; }
.wp-active-row-hint {
  margin-top: 10px; padding: 8px 12px; background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 6px; font-size: 12px; color: #1d4ed8;
}

/* ── items table ── */
.wp-items-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
}
.wp-items-title { font-size: 13px; font-weight: 700; color: #374151; }
.wp-items-actions { display: flex; align-items: center; gap: 8px; }
.wp-active-badge {
  background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
  padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
}
.wp-del-rows-btn {
  background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;
  padding: 4px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600;
}
.wp-del-rows-btn:hover { background: #fecaca; }
.wp-items-table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb; }
.wp-items-table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 700px; }
.wp-items-table thead { background: #f8fafc; }
.wp-items-table th {
  padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 700;
  color: #374151; border-bottom: 1.5px solid #e5e7eb; white-space: nowrap;
  position: sticky; top: 0; z-index: 1;
}
.wp-items-table td { padding: 5px 6px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.wp-items-table tbody tr:hover { background: #f8fafc; }
.wp-row-checked { background: #fef3c7 !important; }
.wp-row-active  { background: #eff6ff !important; outline: 2px solid #bfdbfe; }
.wp-check-cell  { text-align: center; width: 40px; }
.wp-sno         { text-align: center; color: #9ca3af; font-size: 11px; width: 40px; }
.wp-item-input {
  width: 100%; border: 1px solid #e5e7eb; border-radius: 5px;
  padding: 5px 8px; font-size: 12px; background: #fff; box-sizing: border-box; outline: none;
}
.wp-item-input:focus { border-color: #6366f1; }
.wp-uom-input   { background: #f9fafb; }
.wp-wt-input    { background: #fffbeb; border-color: #fde68a !important; }
.wp-net-input   { background: #f0fdf4; border-color: #bbf7d0 !important; font-weight: 700; cursor: not-allowed; }
.wp-wt-filled   { background: #fef9c3 !important; color: #92400e; font-weight: 700; }
.wp-net-filled  { background: #dcfce7 !important; color: #166534; font-weight: 700; }
.wp-item-code-cell { position: relative; }
.wp-item-suggestions {
  position: absolute; top: 100%; left: 0; right: 0; background: #fff;
  border: 1px solid #d1d5db; border-radius: 6px; z-index: 100;
  max-height: 160px; overflow-y: auto; list-style: none;
  box-shadow: 0 4px 12px rgba(0,0,0,.1); margin-top: 2px;
}
.wp-item-suggestions li { padding: 7px 12px; font-size: 12px; cursor: pointer; color: #374151; }
.wp-item-suggestions li:hover { background: #eff6ff; }
.wp-insert-bar {
  display: flex; align-items: center; gap: 8px; margin-top: 10px;
  padding-top: 10px; border-top: 1px solid #f1f5f9;
}
.wp-insert-label { font-size: 12px; color: #6b7280; }
.wp-insert-count { width: 60px; border: 1px solid #d1d5db; border-radius: 5px; padding: 5px 8px; font-size: 12px; text-align: center; outline: none; }
.wp-insert-btn {
  background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;
  padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;
}
.wp-insert-btn:hover { background: #dcfce7; }

/* ── CREATE page — option cards ── */
.wp-create-options {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 18px; max-width: 640px; margin: 40px auto;
}
@media (max-width: 600px) { .wp-create-options { grid-template-columns: 1fr; } }

.wp-option-card {
  background: #fff; border: 1.5px solid #e5e7eb; border-radius: 14px;
  padding: 32px 24px; text-align: center; cursor: pointer;
  transition: border-color .2s, box-shadow .2s, transform .15s;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.wp-option-card:hover {
  border-color: #6366f1; box-shadow: 0 4px 20px rgba(99,102,241,.15);
  transform: translateY(-2px);
}
.wp-option-icon { font-size: 40px; line-height: 1; }
.wp-option-title { font-size: 16px; font-weight: 700; color: #1e293b; }
.wp-option-subtitle { font-size: 12px; color: #6b7280; }
.wp-option-card-inward  { border-top: 4px solid #22c55e; }
.wp-option-card-outward { border-top: 4px solid #f59e0b; }

/* ── loading ── */
.wp-loading { padding: 60px; text-align: center; color: #9ca3af; font-size: 15px; }
`;

const WeighmentStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: STYLES }} />
);

/* ═══════════════════════════════════════════════════════════════════════════
   1. CreateWeighment  — landing page with Inward / Outward options
═══════════════════════════════════════════════════════════════════════════ */
export const CreateWeighment = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="wp-page">
//       <WeighmentStyles />
//       <ModuleNavbar />

//       <div className="wp-header">
//         <button className="wp-back-btn" onClick={() => navigate("/weighment-search")}>←</button>
//         <h2>Create Weighment</h2>
//       </div>

//       <div style={{ padding: "0 18px" }}>
//         <div style={{ marginTop: 32, marginBottom: 8, textAlign: "center", fontSize: 14, color: "#6b7280" }}>
//           Select weighment type to proceed
//         </div>

//         <div className="wp-create-options">
//           {/* Inward */}
//           <div
//             className="wp-option-card wp-option-card-inward"
//             onClick={() => navigate("/weighment/create/inward")}
//           >
//             <div className="wp-option-icon">📥</div>
//             <div className="wp-option-title">Create Inward Weighment</div>
//             <div className="wp-option-subtitle">
//               View all open inward vehicle records and create weighment entries
//             </div>
//             <span className="wp-badge wp-badge-inward" style={{ marginTop: 4 }}>Inward</span>
//           </div>

//           {/* Outward */}
//           <div
//             className="wp-option-card wp-option-card-outward"
//             onClick={() => navigate("/weighment/create/outward")}
//           >
//             <div className="wp-option-icon">📤</div>
//             <div className="wp-option-title">Create Outward Weighment</div>
//             <div className="wp-option-subtitle">
//               View all open outward vehicle records and create weighment entries
//             </div>
//             <span className="wp-badge wp-badge-outward" style={{ marginTop: 4 }}>Outward</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED — InwardOutwardList (used by both Inward & Outward pages)
   Auto-loads non-closed records on mount. No search panel needed.
═══════════════════════════════════════════════════════════════════════════ */
const InwardOutwardList = ({ type }) => {
  const navigate = useNavigate();

  const isInward = type === "Inward";

  const accentCls =
    type === "Inward"
      ? "wp-badge-inward"
      : type === "Outward"
      ? "wp-badge-outward"
      : "wp-badge-general";

  const GIN_TYPE = type;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);

  /* auto-load on mount — all non-Closed records for this direction */
  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        // GIN records use "inOutType" field (values: "Inward" / "Outward")
        params.append("inOutType", GIN_TYPE);
        // Include all active statuses — Open, Weighted, OutPending (not Closed)
        ["Open", "Weighted", "OutPending"].forEach((s) => params.append("statusIn", s));
        const res = await axios.get(`${GIN_API}?${params.toString()}`);
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        // client-side guard: exclude Closed regardless of what backend returns
        setRecords(data.filter((r) => (r.status || "").toLowerCase() !== "closed"));
      } catch (err) {
        console.error(err);
        alert(`Failed to load ${type} records`);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [GIN_TYPE, type]);

  /* click GIN/IN-OUT note → open existing weighment or create new one */
  const openOrCreate = async (e, gin) => {
    e.stopPropagation();
    const ginNo = gin?.ginNo;
    if (!ginNo) { alert("GIN number not found"); return; }
    setCreating(ginNo);

    try {
      /* 1. Check for existing weighment */
      const searchRes  = await axios.get(WEIGHMENT_API, {
        params: { inwardOutwardNoteNo: ginNo, transactionType: type },
      });
      const list     = searchRes.data?.data || [];
      const existing = list.find((w) => w.inwardOutwardNoteNo === ginNo) || list[0];

      if (existing?._id) {
        navigate(`/weighment-detail/${existing._id}`, { state: { allowEdit: false } });
        return;
      }

      /* 2. Get next sequence number */
      const seqRes = await axios.get(`${WEIGHMENT_API}/next-no`, {
        params: { transactionType: type },
      });
      const prefix =
    type === "Inward"
        ? "IN"
        : type === "Outward"
        ? "OT"
        : "GN";
      const weighmentNo = seqRes.data?.weighmentNo ||
        `${prefix}${today.replace(/-/g, "").slice(2)}0001`;

      /* 3. Create weighment */
      const payload = {
        weighmentNo,
        transactionType:     type,
        transactionCategory: gin.transactionCategory || "",
        status:              "Draft",
        inwardOutwardNoteNo: gin.ginNo,
        vehicleNo:           gin.vehicleNo          || "",
        partyName:           gin.partyName           || gin.vendorName || "",
        site:                gin.site                || "Factory Office-GYPMART INDIA",
        weighmentDate:       gin.ginDate             || today,
        weighmentInDate:     gin.ginDate             || today,
        weighmentOutDate:    gin.ginDate             || today,
        supplierInvoiceNo:   gin.challanInvoiceNo    || "",
        supplierInvoiceDate: gin.challanDate          || today,
        billNo:              gin.billNo              || "",
        billDate:            gin.billDate             || today,
        remarks:             gin.remarks             || "",
        vendorCode:          gin.vendorCode          || "",
        vendorName:          gin.vendorName          || "",
        poCpoNo:             gin.poCpoNo             || "",
        manufacturerName:    gin.manufacturerName    || "",
        manufacturerCode:    gin.manufacturerCode    || "",
        challanDate:         gin.challanDate         || "",
        ewayDate:            gin.ewayDate            || "",
        items: Array.isArray(gin.items)
          ? gin.items.map((it, idx) => ({
              sNo: idx + 1,
              itemCode: it.itemCode || "",
              itemName: it.itemName || "",
              uom: it.uom || "",
              remarks: it.remarks || "",
              firstWeight: "",
              secondWeight: "",
              netWeight: "",
            }))
          : [],
      };

      const createRes = await axios.post(WEIGHMENT_API, payload);
      if (createRes.data?.success && createRes.data?.data?._id) {
        navigate(`/weighment-detail/${createRes.data.data._id}`, { state: { allowEdit: false } });
      } else {
        alert("Failed to create weighment: " + (createRes.data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="wp-page">
      <WeighmentStyles />
      <ModuleNavbar />

      {/* Header */}
            <div className="wp-header">
            <button
                className="wp-back-btn"
                onClick={() => navigate("/weighment-search")}
            >
                ←
            </button>

              <h2>Create {type} Weighment</h2>

            <span className={`wp-badge ${accentCls}`}>
                {type}
            </span>
            </div>

      {/* Records card */}
      <div className="wp-card wp-card-accent-top" style={{ marginTop: 16 }}>
        <div className="wp-section-title">
          🚛 {type} Vehicle Records — Open
          {!loading && (
            <span className="wp-section-count">
              {records.length} record{records.length !== 1 ? "s" : ""}
              {records.length > 0 && " — click GIN / Note No to open or create weighment"}
            </span>
          )}
        </div>

        {loading && <div className="wp-placeholder">Loading records…</div>}

        {!loading && records.length === 0 && (
          <div className="wp-placeholder">
            No open {type.toLowerCase()} vehicle records found.
          </div>
        )}

        {!loading && records.length > 0 && (
          <div className="wp-table-wrap">
            <table className="wp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>GIN / IN-OUT Note No</th>
                  <th>Weighment No</th>
                  <th>Vehicle No</th>
                  <th>Trans Type</th>
                  <th>Trans Category</th>
                  <th>Party Name</th>
                  <th>Net Weight (MT)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row, idx) => (
                  <tr key={row._id || idx} onClick={(e) => openOrCreate(e, row)}>
                    <td>{idx + 1}</td>

                    {/* GIN / Note No — clickable link */}
                    <td>
                      <button
                        className="wp-link-btn"
                        onClick={(e) => openOrCreate(e, row)}
                        disabled={creating === row.ginNo}
                        title={row.weighmentNo
                          ? `Open weighment: ${row.weighmentNo}`
                          : "Click to create weighment"}
                      >
                        {creating === row.ginNo ? "…" : (
                          <>
                            {row.weighmentNo ? "🔗 " : ""}{row.ginNo || "—"}
                          </>
                        )}
                      </button>
                    </td>

                    <td>{row.weighmentNo || "—"}</td>
                    <td>{row.vehicleNo || "—"}</td>
                    <td>{row.inOutType || row.transactionType || type}</td>
                    <td>{row.transactionCategory || "—"}</td>
                    <td>{row.partyName || row.vendorName || "—"}</td>
                    <td>{row.netWeight ? `${row.netWeight} MT` : "—"}</td>
                    <td>
                      <span className={`wp-status wp-status-${(row.status || "open").toLowerCase()}`}>
                        {row.status || "Open"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="wp-link-btn"
                        style={{
                          background: "#eff0ff", padding: "3px 10px",
                          borderRadius: 5, border: "1px solid #c7d2fe",
                          textDecoration: "none", fontSize: 11, fontWeight: 700,
                        }}
                        onClick={(e) => openOrCreate(e, row)}
                        disabled={creating === row.ginNo}
                      >
                        {creating === row.ginNo
                          ? "Creating…"
                          : (row.weighmentNo ? "Open" : "Create Weighment")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. CreateInwardWeighment
═══════════════════════════════════════════════════════════════════════════ */
export const CreateInwardWeighment = () => <InwardOutwardList type="Inward" />;

/* ═══════════════════════════════════════════════════════════════════════════
   3. CreateOutwardWeighment
═══════════════════════════════════════════════════════════════════════════ */
export const CreateOutwardWeighment = () => <InwardOutwardList type="Outward" />;

export const CreateGeneralWeighment =
    () => <InwardOutwardList type="General" />;
/* ═══════════════════════════════════════════════════════════════════════════
   4. WeighmentDetail  — view / edit a saved weighment record
      (Vehicle Out button removed per requirements)
═══════════════════════════════════════════════════════════════════════════ */
const STATUS_OPTIONS = ["Draft", "Partial", "Submit", "Weighted"];

export const WeighmentDetail = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [form,         setForm]         = useState(null);
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [insertCount,  setInsertCount]  = useState(5);
  const [activeRowIdx, setActiveRowIdx] = useState(null);
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [activeSugRow,    setActiveSugRow]    = useState(null);
  const [activeSugField,  setActiveSugField]  = useState(null);
  const [transactionCategories, setTransactionCategories] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const itemsSectionRef = useRef(null);
  const allowEdit = location.state?.allowEdit === true;
  const canEditForm = !allowEdit || editMode;
  const canEditItems = !allowEdit || editMode;

  /* ── load ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await axios.get(`${WEIGHMENT_API}/${id}`);
        const data = res.data?.data || res.data;
        if (!data) { alert("Record not found"); navigate(-1); return; }
        setForm({
          ...data,
          firstWeight: "",
          secondWeight: "",
          netWeight: "",
          currentWeight: "",
        });
        setItems(makeItems(data));
      } catch (err) {
        console.error(err);
        alert("Failed to load weighment record");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  useEffect(() => {
    const loadTransactionCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/transactions`);
        const list = Array.isArray(res.data) ? res.data : [];
        const filtered = list.filter((tx) => {
          const isInventory = tx.module === "Inventory";
          const isOpen = (tx.status || "").toLowerCase() === "open";
          const matchesEntity = !form?.transactionType || tx.businessEntity === form.transactionType;
          return isInventory && isOpen && matchesEntity;
        });
        setTransactionCategories(filtered);
      } catch (err) {
        console.error("Failed to load transaction categories", err);
        setTransactionCategories([]);
      }
    };
    loadTransactionCategories();
  }, [form?.transactionType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (!canEditForm && name !== "currentWeight") return;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  /* ── weight logic ── */
  const handleItemCheck = (rowIdx, checked) => {
    const row = items[rowIdx];
    const inheritWeight = row?.secondWeight || row?.firstWeight || "";
    setItems((prev) => prev.map((r, i) => ({ ...r, _checked: i === rowIdx ? checked : false })));
    if (checked) {
      setActiveRowIdx(rowIdx);
      setItems((prev) => {
        const next = [...prev];
        next[rowIdx] = {
          ...next[rowIdx],
          _checked: true,
          firstWeight: inheritWeight || next[rowIdx].firstWeight,
        };
        return next;
      });
      setForm((prev) => ({ ...prev, firstWeight: inheritWeight, secondWeight: "", netWeight: "", currentWeight: "" }));
    } else {
      setActiveRowIdx(null);
    }
  };

  const getWeight = () => {
    const weight = parseFloat(form.currentWeight);
    if (!weight) { alert("Enter a weight value first"); return; }

    if (!form.firstWeight) {
      setForm((prev) => ({ ...prev, firstWeight: String(weight), currentWeight: "" }));
      if (activeRowIdx !== null) {
        setItems((prev) => {
          const next = [...prev];
          next[activeRowIdx] = { ...next[activeRowIdx], firstWeight: String(weight) };
          return next;
        });
      }
      return;
    }

    if (!form.secondWeight) {
      const first = parseFloat(form.firstWeight) || 0;
      const net   = Math.abs(first - weight);
      setForm((prev) => ({ ...prev, secondWeight: String(weight), netWeight: String(net), currentWeight: "" }));
      if (activeRowIdx !== null) {
        setItems((prev) => {
          const next = [...prev];
          const row  = { ...next[activeRowIdx] };
          row.secondWeight = String(weight);
          row.netWeight    = String(net);
          row._checked     = false;
          next[activeRowIdx] = row;
          return next;
        });
        setActiveRowIdx(null);
      }
      setTimeout(() => {
        itemsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return;
    }
    alert("First and Second Weight already recorded");
  };

  const handleRowFocus = (rowIdx) => {
    setItems((prev) => {
      const next = [...prev];
      if (rowIdx === 0) return next;
      const previous = next[rowIdx - 1];
      if (previous.secondWeight && !next[rowIdx].firstWeight) {
        next[rowIdx] = { ...next[rowIdx], firstWeight: previous.secondWeight };
      }
      return next;
    });
  };

  /* ── item master lookup ── */
  const fetchItemSuggestions = useCallback(async (query, field = "itemCode") => {
    if (!query) { setItemSuggestions([]); return; }
    try {
      const res  = await axios.get(`${ITEM_MASTER_API}/items/search`, {
        params: { [field]: query, status: "Active" },
      });
      const list = res.data?.data || res.data || [];
      const items = Array.isArray(list) ? list : [];
      setItemSuggestions(items.slice(0, 10));
    } catch {
      setItemSuggestions([]);
    }
  }, []);

  const handleItemCodeChange = (rowIdx, value) => {
    if (!canEditItems) return;
    setItems((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], itemCode: value, itemName: "", uom: "" };
      return next;
    });
    setActiveSugRow(rowIdx);
    setActiveSugField("itemCode");
    fetchItemSuggestions(value, "itemCode");
  };

  const handleItemNameChange = (rowIdx, value) => {
    if (!canEditItems) return;
    setItems((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], itemName: value, itemCode: "", uom: "" };
      return next;
    });
    setActiveSugRow(rowIdx);
    setActiveSugField("itemName");
    fetchItemSuggestions(value, "itemName");
  };

  const selectItemSuggestion = (rowIdx, item) => {
    if (!canEditItems) return;
    setItems((prev) => {
      const next = [...prev];
      next[rowIdx] = {
        ...next[rowIdx],
        itemCode: item.itemCode || item.code || "",
        itemName: item.itemName || item.name || "",
        uom:      item.uom || item.baseUom || item.unit || "",
      };
      return next;
    });
    setItemSuggestions([]);
    setActiveSugRow(null);
    setActiveSugField(null);
  };

  const fetchItemDetailsByCode = async (rowIdx, itemCode) => {
    if (!canEditItems || !itemCode?.trim()) return;
    try {
      const res = await axios.get(`${ITEM_MASTER_API}/item/${encodeURIComponent(itemCode.trim())}`);
      const item = res.data?.data || res.data;
      if (!item?.itemCode && !item?.itemName) return;
      setItems((prev) => {
        const next = [...prev];
        next[rowIdx] = {
          ...next[rowIdx],
          itemCode: item.itemCode || next[rowIdx].itemCode || "",
          itemName: item.itemName || item.name || "",
          uom: item.uom || item.baseUom || item.unit || "",
        };
        return next;
      });
    } catch {
      // Keep the typed code; suggestions already handle partial matches.
    } finally {
      setItemSuggestions([]);
      setActiveSugRow(null);
      setActiveSugField(null);
    }
  };

  const fetchItemDetailsByName = async (rowIdx, itemName) => {
    if (!canEditItems || !itemName?.trim()) return;
    try {
      const res = await axios.get(`${ITEM_MASTER_API}/items/search`, {
        params: { itemName: itemName.trim(), status: "Active" },
      });
      const list = res.data?.data || res.data || [];
      const found = Array.isArray(list)
        ? list.find((item) => item.itemName?.toLowerCase() === itemName.trim().toLowerCase()) || list[0]
        : null;
      if (!found) return;
      setItems((prev) => {
        const next = [...prev];
        next[rowIdx] = {
          ...next[rowIdx],
          itemCode: found.itemCode || found.code || "",
          itemName: found.itemName || found.name || next[rowIdx].itemName || "",
          uom: found.uom || found.baseUom || found.unit || next[rowIdx].uom || "",
        };
        return next;
      });
    } catch {
      // Keep the typed name; suggestions already handle partial matches.
    } finally {
      setItemSuggestions([]);
      setActiveSugRow(null);
      setActiveSugField(null);
    }
  };

  const handleItemChange = (rowIdx, field, value) => {
    if (!canEditItems && field !== "remarks") return;
    setItems((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [field]: value };
      return next;
    });
  };

  /* ── row management ── */
  const handleDeleteChecked = () => {
    setItems((prev) =>
      prev.filter((r) => !r._checked).map((r, i) => ({ ...r, sNo: i + 1 }))
    );
    setActiveRowIdx(null);
  };

  const handleInsertRows = () => {
    const count = Math.max(1, Math.min(50, Number(insertCount) || 1));
    setItems((prev) => [
      ...prev,
      ...Array.from({ length: count }, (_, i) => blankItem(prev.length + i + 1)),
    ]);
  };

  const anyChecked = items.some((r) => r._checked);

  /* ── save ── */
  const handleSave = async (asDraft = false) => {
    if (!form.vehicleNo?.trim()) { alert("Vehicle Number is required"); return; }
    setSaving(true);
    try {
      /* Strip runtime-only and MongoDB-managed fields */
      const {
        currentWeight,        // UI-only scratch field
        _id, __v,             // MongoDB internal
        createdAt, updatedAt, // Mongoose timestamps
        ...mainForm
      } = form;

      /* Clean items: remove UI-only _checked flag; skip fully-empty rows */
      const cleanItems = items
        .filter((r) => {
          const { sNo, _checked, ...rest } = r;
          return Object.values(rest).some((v) => v !== "");
        })
        .map(({ _checked, ...r }) => r);

      const payload = {
        ...mainForm,
        status: asDraft ? "Draft" : (mainForm.status || "Draft"),
        items:  cleanItems,
      };

      const res = await axios.put(`${WEIGHMENT_API}/${id}`, payload);
      if (res.data?.success) {
        alert(asDraft ? "Saved as Draft" : "Weighment Updated Successfully");
        navigate(-1);
      } else {
        alert(res.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("Save error:", err);
      const msg = err.response?.data?.message || err.message || "Update failed";
      alert("Save failed: " + msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── render ── */
  if (loading) {
    return (
      <div className="wp-page">
        <WeighmentStyles />
        <ModuleNavbar />
        <div className="wp-loading">Loading weighment record…</div>
      </div>
    );
  }
  if (!form) return null;

  const typeClass        = (form.transactionType || "general").toLowerCase();
  const statusClass      = (form.status || "draft").toLowerCase();
  const weightButtonText = !form.firstWeight
    ? "Get Weight (→ 1st)"
    : !form.secondWeight
    ? "Get Weight (→ 2nd)"
    : "Completed";
  const weightHint       = !form.firstWeight
    ? " — will set First Weight"
    : !form.secondWeight
    ? " — will set Second Weight"
    : " — completed";
  const weightDisabled   = !!form.firstWeight && !!form.secondWeight;

  return (
    <div className="wp-page">
      <WeighmentStyles />
      <ModuleNavbar />

      {/* ── Header (no Vehicle Out button) ── */}
      <div className="wp-header">
        <button className="wp-back-btn" onClick={() => navigate(-1)}>←</button>
        <h2 style={{ flex: 1 }}>Weighment Detail</h2>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#6366f1", marginRight: 4 }}>
          {form.weighmentNo || "—"}
        </span>
        <span className={`wp-badge wp-badge-${typeClass}`}>{form.transactionType || "—"}</span>
        <span className={`wp-badge wp-badge-${statusClass}`}>{form.status || "Draft"}</span>
        {allowEdit && (!editMode ? (
          <button className="wp-btn-draft" type="button" onClick={() => setEditMode(true)}>Edit</button>
        ) : (
          <button className="wp-btn-cancel" type="button" onClick={() => setEditMode(false)}>Viewing</button>
        ))}
      </div>

      {/* ── Part 1: Weighment Header ── */}
      <div className="wp-card">
        <div className="wp-section-title">📋 Weighment Header</div>
        <div className="wp-grid wp-grid-4">

          <div className="wp-field">
            <label>Weighment No</label>
            <input name="weighmentNo" value={form.weighmentNo || ""} readOnly className="wp-readonly" />
          </div>

          <div className="wp-field">
            <label>Description</label>
            <input name="description" value={form.description || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} placeholder="Enter description" />
          </div>

          <div className="wp-field">
            <label>Date</label>
            <input type="date" name="weighmentDate" value={form.weighmentDate || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Transaction Type</label>
            <input value={form.transactionType || ""} readOnly className="wp-readonly" />
          </div>

        </div>
      </div>

      {/* ── Part 2: Operational Fields ── */}
      <div className="wp-card">
        <div className="wp-section-title">🚛 Weighment Details</div>
        <div className="wp-grid wp-grid-4">

          <div className="wp-field">
            <label>Inward / Outward Note No</label>
            <input name="inwardOutwardNoteNo" value={form.inwardOutwardNoteNo || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Vehicle No *</label>
            <input name="vehicleNo" value={form.vehicleNo || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Party Name</label>
            <input name="partyName" value={form.partyName || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Site</label>
            <input name="site" value={form.site || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Status</label>
            <select name="status" value={form.status || "Draft"} onChange={handleChange} disabled={!canEditForm}>
              {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="wp-field">
            <label>Weight In Date</label>
            <input type="date" name="weighmentInDate" value={form.weighmentInDate || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Weight In Time</label>
            <input type="time" name="weighmentInTime" value={form.weighmentInTime || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Weight Out Date</label>
            <input type="date" name="weighmentOutDate" value={form.weighmentOutDate || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Weight Out Time</label>
            <input type="time" name="weighmentOutTime" value={form.weighmentOutTime || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Transaction Category</label>
            <select name="transactionCategory" value={form.transactionCategory || ""} onChange={handleChange} disabled={!canEditForm}>
              <option value="">Select</option>
              {form.transactionCategory &&
                !transactionCategories.some((tx) => tx.categoryDescription === form.transactionCategory) && (
                  <option value={form.transactionCategory}>{form.transactionCategory}</option>
                )}
              {transactionCategories.map((tx) => (
                <option key={tx._id} value={tx.categoryDescription}>
                  {tx.transactionCategoryCode} - {tx.categoryDescription}
                </option>
              ))}
            </select>
          </div>

          <div className="wp-field">
            <label>Transporter Name</label>
            <input name="transporterName" value={form.transporterName || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Supplier Invoice No</label>
            <input name="supplierInvoiceNo" value={form.supplierInvoiceNo || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Supplier Invoice Date</label>
            <input type="date" name="supplierInvoiceDate" value={form.supplierInvoiceDate || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Bill No</label>
            <input name="billNo" value={form.billNo || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field">
            <label>Bill Date</label>
            <input type="date" name="billDate" value={form.billDate || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

          <div className="wp-field wp-field-full">
            <label>Remarks</label>
            <textarea rows="2" name="remarks" value={form.remarks || ""} onChange={handleChange} readOnly={!canEditForm} className={!canEditForm ? "wp-readonly" : ""} />
          </div>

        </div>
      </div>

      {/* ── Part 3: Weight Capture ── */}
      <div className="wp-card">
        <div className="wp-section-title">⚖️ Weight Capture</div>
        <div className="wp-weight-strip">

          <div className="wp-weight-box">
            <label>First Weight (MT)</label>
            <input value={form.firstWeight || ""} readOnly className="wp-wt-yellow" placeholder="—" />
          </div>

          <div className="wp-weight-box">
            <label>Second Weight (MT)</label>
            <input value={form.secondWeight || ""} readOnly className="wp-wt-yellow" placeholder="—" />
          </div>

          <div className="wp-weight-box">
            <label>Net Weight (MT)</label>
            <input value={form.netWeight || ""} readOnly className="wp-wt-green" placeholder="—" />
          </div>

          <div className="wp-weight-box wp-weight-get-box">
            <label>
              Weight (In MT)
              <span className="wp-wt-hint">{weightHint}</span>
            </label>
            <div className="wp-get-weight-wrap">
              <input
                type="number"
                step="0.001"
                name="currentWeight"
                value={form.currentWeight || ""}
                onChange={handleChange}
                placeholder="Enter value"
                disabled={weightDisabled}
                className="wp-get-wt-input"
              />
              <button
                type="button"
                className={`wp-get-btn ${weightDisabled ? "wp-get-btn-done" : ""}`}
                onClick={getWeight}
                disabled={weightDisabled}
              >
                {weightButtonText}
              </button>
            </div>
          </div>

        </div>

        {activeRowIdx !== null && (
          <div className="wp-active-row-hint">
            ✏️ Row {activeRowIdx + 1} selected — enter weight above and click Get Weight
          </div>
        )}
      </div>

      {/* ── Part 4: Items ── */}
      <div className="wp-card" ref={itemsSectionRef}>
        <div className="wp-items-header">
          <span className="wp-items-title">📦 Items</span>
          <div className="wp-items-actions">
            {activeRowIdx !== null && (
              <span className="wp-active-badge">Row {activeRowIdx + 1} active</span>
            )}
            {anyChecked && (
              <button className="wp-del-rows-btn" onClick={handleDeleteChecked}>
                🗑 Delete Selected
              </button>
            )}
          </div>
        </div>

        <div className="wp-items-table-wrap">
          <table className="wp-items-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th style={{ width: 40 }}>Sl No</th>
                <th style={{ width: 120 }}>Item Code</th>
                <th style={{ minWidth: 180 }}>Item Name</th>
                <th style={{ width: 70 }}>UOM</th>
                <th style={{ width: 110 }}>First Weight (MT)</th>
                <th style={{ width: 110 }}>Second Weight (MT)</th>
                <th style={{ width: 110 }}>Net Weight (MT)</th>
                <th style={{ minWidth: 130 }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => {
                const isActive = activeRowIdx === idx;
                return (
                  <tr
                    key={idx}
                    className={`${row._checked ? "wp-row-checked" : ""} ${isActive ? "wp-row-active" : ""}`}
                    onFocus={() => handleRowFocus(idx)}
                  >
                    <td className="wp-check-cell">
                      <input
                        type="checkbox"
                        checked={!!row._checked}
                        onChange={(e) => handleItemCheck(idx, e.target.checked)}
                      />
                    </td>
                    <td className="wp-sno">{row.sNo}</td>

                    {/* Item Code — autocomplete */}
                    <td className="wp-item-code-cell">
                      <input
                        className="wp-item-input"
                        value={row.itemCode}
                        onChange={(e) => handleItemCodeChange(idx, e.target.value)}
                        onBlur={() => setTimeout(() => fetchItemDetailsByCode(idx, row.itemCode), 200)}
                        placeholder="Code"
                        readOnly={!canEditItems}
                      />
                      {activeSugRow === idx && activeSugField === "itemCode" && itemSuggestions.length > 0 && (
                        <ul className="wp-item-suggestions">
                          {itemSuggestions.map((s, si) => (
                            <li key={si} onMouseDown={() => selectItemSuggestion(idx, s)}>
                              <strong>{s.itemCode || s.code}</strong> — {s.itemName || s.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>

                    <td className="wp-item-code-cell">
                      <input
                        className="wp-item-input"
                        value={row.itemName}
                        onChange={(e) => handleItemNameChange(idx, e.target.value)}
                        onBlur={() => setTimeout(() => fetchItemDetailsByName(idx, row.itemName), 200)}
                        placeholder="Item name"
                        readOnly={!canEditItems}
                      />
                      {activeSugRow === idx && activeSugField === "itemName" && itemSuggestions.length > 0 && (
                        <ul className="wp-item-suggestions">
                          {itemSuggestions.map((s, si) => (
                            <li key={si} onMouseDown={() => selectItemSuggestion(idx, s)}>
                              <strong>{s.itemName || s.name}</strong> — {s.itemCode || s.code}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>

                    <td>
                      <input
                        className="wp-item-input wp-uom-input"
                        value={row.uom}
                        onChange={(e) => handleItemChange(idx, "uom", e.target.value)}
                        placeholder="UOM"
                        readOnly={!canEditItems || (!!row.itemCode && !!row.uom)}
                      />
                    </td>

                    <td>
                      <input
                        className={`wp-item-input wp-wt-input ${row.firstWeight ? "wp-wt-filled" : ""}`}
                        value={row.firstWeight}
                        readOnly
                        placeholder="← auto"
                      />
                    </td>

                    <td>
                      <input
                        className={`wp-item-input wp-wt-input ${row.secondWeight ? "wp-wt-filled" : ""}`}
                        value={row.secondWeight}
                        readOnly
                        placeholder="—"
                      />
                    </td>

                    <td>
                      <input
                        className={`wp-item-input wp-net-input ${row.netWeight ? "wp-net-filled" : ""}`}
                        value={row.netWeight}
                        readOnly
                        placeholder="—"
                      />
                    </td>

                    <td>
                      <input
                        className="wp-item-input"
                        style={{ minWidth: 120 }}
                        value={row.remarks}
                        onChange={(e) => handleItemChange(idx, "remarks", e.target.value)}
                        placeholder="Remarks"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="wp-insert-bar">
          <span className="wp-insert-label">Rows to add:</span>
          <input
            type="number"
            min="1"
            max="50"
            className="wp-insert-count"
            value={insertCount}
            onChange={(e) => setInsertCount(e.target.value)}
          />
          <button className="wp-insert-btn" onClick={handleInsertRows}>+ Insert Rows</button>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="wp-actions">
        <button className="wp-btn-cancel" onClick={() => navigate(-1)} disabled={saving}>Cancel</button>
        {(!allowEdit || editMode) && (
          <>
            <button className="wp-btn-draft"  onClick={() => handleSave(true)}  disabled={saving}>Save as Draft</button>
            <button className="wp-btn-save"   onClick={() => handleSave(false)} disabled={saving}>
              {saving ? "Saving…" : "Save & Update"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* ── default export for convenience ── */
export default {
  CreateWeighment,
//   CreateInwardWeighment,
//   CreateOutwardWeighment,
  WeighmentDetail,
};
