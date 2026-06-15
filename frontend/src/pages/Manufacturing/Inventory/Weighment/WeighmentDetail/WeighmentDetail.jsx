import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./WeighmentDetail.css";
import ModuleNavbar from "../../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../../config";

const WEIGHMENT_API = `${API_URL}/api/weighment`;

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const blankItem = (sNo) => ({
  sNo,
  firstWeight: "",
  secondWeight: "",
  netWeight: "",
  remarks: "",
  _checked: false,
});

const hasMainWeight = (data) =>
  !!(data?.firstWeight || data?.secondWeight || data?.netWeight);

const hasAnyItemWeight = (rows) =>
  rows.some((r) => r.firstWeight || r.secondWeight || r.netWeight || r.remarks);

const makeItemsFromSavedData = (data) => {
  const rows =
    Array.isArray(data.items) && data.items.length > 0
      ? data.items.map((it, i) => ({
          sNo: it.sNo || i + 1,
          firstWeight: it.firstWeight || "",
          secondWeight: it.secondWeight || "",
          netWeight: it.netWeight || "",
          remarks: it.remarks || "",
          _checked: false,
        }))
      : Array.from({ length: 4 }, (_, i) => blankItem(i + 1));

  const itemRowsAlreadyHaveData = hasAnyItemWeight(rows);

  /* ── KEY REQUIREMENT: if main-level weight was saved and no item rows have
     data yet → mirror it to SL No 1 so it shows on reload ── */
  if (hasMainWeight(data) && !itemRowsAlreadyHaveData) {
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

/* ════════════════════════════════════════════════════════════════════════════ */
const WeighmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form,         setForm]         = useState(null);
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [insertCount,  setInsertCount]  = useState(5);
  const [activeRowIdx, setActiveRowIdx] = useState(null);

  /* ── Edit-mode flag: page opens in READ mode; Edit button unlocks fields ── */
  const [editMode, setEditMode] = useState(false);

  /* Ref to items section — used for auto-scroll after weight capture */
  const itemsSectionRef = useRef(null);

  /* ── load record ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await axios.get(`${WEIGHMENT_API}/${id}`);
        const data = res.data?.data || res.data;

        if (!data) { alert("Record not found"); navigate(-1); return; }

        setForm({
          ...data,
          firstWeight:   "",
          secondWeight:  "",
          netWeight:     "",
          currentWeight: "",
        });

        setItems(makeItemsFromSavedData(data));
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

  /* ─── form field change ─────────────────────────────────────────────────── */
  const handleChange = (e) => {
    if (!editMode) return;                       // guard: no edits in read mode
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  /* ─── weight-strip controls (always active, independent of editMode) ────── */

  /**
   * TICK / checkbox on an item row:
   *   • The SECOND weight of the ticked row (or its first weight if second is
   *     absent) becomes the FIRST weight in the capture strip.
   *   • That value is also reflected back into the item row's firstWeight so
   *     the row always stays in sync.
   */
  const handleItemCheck = (rowIdx, checked) => {
    const row          = items[rowIdx];
    const inheritWeight = row?.secondWeight || row?.firstWeight || "";

    setItems((prev) =>
      prev.map((r, i) => ({ ...r, _checked: i === rowIdx ? checked : false }))
    );

    if (checked) {
      setActiveRowIdx(rowIdx);

      /* Replicate inherited weight to firstWeight of THIS row in items */
      setItems((prev) => {
        const next = [...prev];
        next[rowIdx] = {
          ...next[rowIdx],
          _checked:    true,
          firstWeight: inheritWeight || next[rowIdx].firstWeight,
        };
        return next;
      });

      setForm((prev) => ({
        ...prev,
        firstWeight:   inheritWeight,
        secondWeight:  "",
        netWeight:     "",
        currentWeight: "",
      }));
    } else {
      setActiveRowIdx(null);
    }
  };

  /**
   * GET WEIGHT button:
   *   First click  → value goes to strip's First Weight  → replicate to item row firstWeight
   *   Second click → value goes to strip's Second Weight → replicate to item row secondWeight
   *                   net = |first − second|             → replicate to item row netWeight
   *   After both weights captured → auto-scroll to items section
   */
  const getWeight = () => {
    const weight = parseFloat(form.currentWeight);
    if (!weight) { alert("Enter a weight value first"); return; }

    /* ── First weight not yet captured ── */
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

    /* ── Second weight not yet captured ── */
    if (!form.secondWeight) {
      const first = parseFloat(form.firstWeight) || 0;
      const net   = Math.abs(first - weight);

      setForm((prev) => ({
        ...prev,
        secondWeight:  String(weight),
        netWeight:     String(net),
        currentWeight: "",
      }));

      if (activeRowIdx !== null) {
        setItems((prev) => {
          const next = [...prev];
          const row  = { ...next[activeRowIdx] };

          /* ── REQUIREMENT: second weight captured → replicate to item row ── */
          row.secondWeight = String(weight);
          row.netWeight    = String(net);
          row._checked     = false;

          next[activeRowIdx] = row;
          return next;
        });
        setActiveRowIdx(null);
      }

      /* ── REQUIREMENT: after both weights saved scroll down to items section ── */
      setTimeout(() => {
        itemsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);

      return;
    }

    alert("First and Second Weight already recorded");
  };

  /* ─── row focus: auto-inherit previous row's secondWeight ─────────────── */
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

  /* ─── item field change (remarks only; weights are auto-filled) ─────────── */
  const handleItemChange = (rowIdx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [field]: value };
      return next;
    });
  };

  /* ─── delete checked rows ─────────────────────────────────────────────── */
  const handleDeleteChecked = () => {
    setItems((prev) =>
      prev.filter((r) => !r._checked).map((r, i) => ({ ...r, sNo: i + 1 }))
    );
    setActiveRowIdx(null);
  };

  /* ─── insert rows ─────────────────────────────────────────────────────── */
  const handleInsertRows = () => {
    const count = Math.max(1, Math.min(50, Number(insertCount) || 1));
    setItems((prev) => {
      const startSNo = prev.length + 1;
      return [...prev, ...Array.from({ length: count }, (_, i) => blankItem(startSNo + i))];
    });
  };

  const anyChecked = items.some((r) => r._checked);

  /* ─── save ────────────────────────────────────────────────────────────── */
  const handleSave = async (asDraft = false) => {
    if (!form.vehicleNo?.trim()) { alert("Vehicle Number is required"); return; }

    setSaving(true);
    try {
      const { currentWeight, ...mainForm } = form;

      const cleanItems = items
        .filter((r) => {
          const { sNo, _checked, ...rest } = r;
          return Object.values(rest).some((v) => v !== "");
        })
        .map(({ _checked, ...r }) => r);

      const payload = {
        ...mainForm,
        status: asDraft ? "Draft" : mainForm.status,
        items:  cleanItems,
      };

      const res = await axios.put(`${WEIGHMENT_API}/${id}`, payload);

      if (res.data.success) {
        alert(asDraft ? "Saved as Draft" : "Weighment Updated Successfully");
        navigate("/weighment-search");
      } else {
        alert(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="wd-page">
        <ModuleNavbar />
        <div className="wd-loading">Loading weighment record...</div>
      </div>
    );
  }

  if (!form) return null;

  const typeClass        = (form.transactionType || "").toLowerCase();
  const weightDisabled   = !!form.firstWeight && !!form.secondWeight;
  const weightButtonText = !form.firstWeight
    ? "Get Weight (→ 1st)"
    : !form.secondWeight
    ? "Get Weight (→ 2nd)"
    : "Completed";
  const weightHint = !form.firstWeight
    ? " - will set First Weight"
    : !form.secondWeight
    ? " - will set Second Weight"
    : " - completed";

  return (
    <div className="wd-page">
      <ModuleNavbar />

      {/* ── PAGE HEADER ── */}
      <div className="wd-page-header">
        <button className="wd-back-btn" onClick={() => navigate(-1)}>←</button>

        <div className="wd-header-info">
          <h2>Weighment Detail</h2>
          <span className="wd-weighment-no">{form.weighmentNo || "-"}</span>
        </div>

        <div className="wd-header-badges">
          <span className={`wd-type-badge ${typeClass}`}>{form.transactionType || "-"}</span>
          <span className={`wd-status-badge ${(form.status || "").toLowerCase()}`}>
            {form.status || "Open"}
          </span>

          {/* ── EDIT BUTTON — toggles edit mode ── */}
          {!editMode ? (
            <button className="wd-edit-btn" onClick={() => setEditMode(true)}>
              ✏ Edit
            </button>
          ) : (
            <button className="wd-editing-indicator" onClick={() => setEditMode(false)}>
              👁 Viewing (click to cancel edit)
            </button>
          )}
        </div>
      </div>

      {editMode && (
        <div className="wd-edit-banner">
          You are in <strong>Edit Mode</strong> — fields are now editable. Click
          <em> Save &amp; Update</em> to persist changes.
        </div>
      )}

      {/* ── GIN REFERENCE (always read-only) ── */}
      <div className="wd-card">
        <div className="wd-section-title">GIN / Note Reference</div>
        <div className="wd-ref-grid">
          {[
            ["GIN / Note No",      form.inwardOutwardNoteNo, true],
            ["Vendor Code",        form.vendorCode],
            ["Vendor Name",        form.vendorName],
            ["PO/CPO No",          form.poCpoNo],
            ["Manufacturer Name",  form.manufacturerName],
            ["Challan Date",       form.challanDate],
            ["E-Way Date",         form.ewayDate],
          ].map(([label, value, highlight]) => (
            <div className="wd-ref-field" key={label}>
              <span className="wd-ref-label">{label}</span>
              <span className={`wd-ref-value${highlight ? " wd-ref-highlight" : ""}`}>
                {value || "-"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── WEIGHMENT INFORMATION ── */}
      <div className="wd-card">
        <div className="wd-section-title">Weighment Information</div>

        <div className="wd-form-grid">
          {/* Weighment No */}
          <div className="wd-field">
            <label>Weighment No</label>
            <input
              name="weighmentNo"
              value={form.weighmentNo || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Transaction Category */}
          <div className="wd-field">
            <label>Transaction Category *</label>
            {editMode ? (
              <select name="transactionCategory" value={form.transactionCategory || ""} onChange={handleChange}>
                <option value="">Select</option>
                <option>Purchase</option>
                <option>Sales</option>
              </select>
            ) : (
              <input value={form.transactionCategory || "-"} readOnly className="wd-readonly" />
            )}
          </div>

          {/* Status */}
          <div className="wd-field">
            <label>Status</label>
            {editMode ? (
              <select name="status" value={form.status || "Open"} onChange={handleChange}>
                <option>Open</option>
                <option>Closed</option>
                <option>Draft</option>
              </select>
            ) : (
              <input value={form.status || "Open"} readOnly className="wd-readonly" />
            )}
          </div>

          {/* Transaction Type */}
          <div className="wd-field">
            <label>Transaction Type</label>
            <input value={form.transactionType || ""} readOnly className="wd-readonly" />
          </div>

          {/* Inward/Outward Note No */}
          <div className="wd-field">
            <label>Inward/Outward Note No</label>
            <input
              name="inwardOutwardNoteNo"
              value={form.inwardOutwardNoteNo || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Vehicle No */}
          <div className="wd-field">
            <label>Vehicle No *</label>
            <input
              name="vehicleNo"
              value={form.vehicleNo || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Party Name */}
          <div className="wd-field">
            <label>Party Name</label>
            <input
              name="partyName"
              value={form.partyName || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Transporter Name */}
          <div className="wd-field">
            <label>Transporter Name</label>
            <input
              name="transporterName"
              value={form.transporterName || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Site */}
          <div className="wd-field">
            <label>Site</label>
            <input
              name="site"
              value={form.site || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Weighment Date */}
          <div className="wd-field">
            <label>Weighment Date</label>
            <input
              type="date"
              name="weighmentDate"
              value={form.weighmentDate || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Weighment In Date */}
          <div className="wd-field">
            <label>Weighment In Date</label>
            <input
              type="date"
              name="weighmentInDate"
              value={form.weighmentInDate || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Weighment In Time */}
          <div className="wd-field">
            <label>Weighment In Time</label>
            <input
              type="time"
              name="weighmentInTime"
              value={form.weighmentInTime || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Weighment Out Date */}
          <div className="wd-field">
            <label>Weighment Out Date</label>
            <input
              type="date"
              name="weighmentOutDate"
              value={form.weighmentOutDate || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Weighment Out Time */}
          <div className="wd-field">
            <label>Weighment Out Time</label>
            <input
              type="time"
              name="weighmentOutTime"
              value={form.weighmentOutTime || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Supplier Invoice No */}
          <div className="wd-field">
            <label>Supplier Invoice No</label>
            <input
              name="supplierInvoiceNo"
              value={form.supplierInvoiceNo || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Supplier Invoice Date */}
          <div className="wd-field">
            <label>Supplier Invoice Date</label>
            <input
              type="date"
              name="supplierInvoiceDate"
              value={form.supplierInvoiceDate || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Bill No */}
          <div className="wd-field">
            <label>Bill No</label>
            <input
              name="billNo"
              value={form.billNo || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Bill Date */}
          <div className="wd-field">
            <label>Bill Date</label>
            <input
              type="date"
              name="billDate"
              value={form.billDate || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Total Dispatch Weight */}
          <div className="wd-field">
            <label>Total Dispatch Weight</label>
            <input
              name="totalDispatchWeight"
              value={form.totalDispatchWeight || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>

          {/* Transit Date */}
          <div className="wd-field">
            <label>Transit Date</label>
            <input
              type="date"
              name="transitDate"
              value={form.transitDate || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>
        </div>

        {/* ── WEIGHT CAPTURE STRIP ── always interactive ── */}
        <div className="wd-weight-strip wd-weight-strip-single-line">
          <div className="wd-weight-box">
            <label>First Weight (MT)</label>
            <input
              value={form.firstWeight || ""}
              readOnly
              className="wd-weight-yellow"
              placeholder="-"
            />
          </div>

          <div className="wd-weight-box">
            <label>Second Weight (MT)</label>
            <input
              value={form.secondWeight || ""}
              readOnly
              className="wd-weight-yellow"
              placeholder="-"
            />
          </div>

          <div className="wd-weight-box">
            <label>Net Weight (MT)</label>
            <input
              value={form.netWeight || ""}
              readOnly
              className="wd-weight-green"
              placeholder="-"
            />
          </div>

          <div className="wd-weight-box wd-weight-input-box wd-weight-get-box">
            <label>
              Weight (In MT)<span>{weightHint}</span>
            </label>
            <div className="wd-weight-action">
              <input
                type="number"
                step="0.001"
                name="currentWeight"
                value={form.currentWeight || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, currentWeight: e.target.value }))
                }
                placeholder="Enter value"
                disabled={weightDisabled}
              />
              <button type="button" onClick={getWeight} disabled={weightDisabled}>
                {weightButtonText}
              </button>
            </div>
          </div>
        </div>

        {activeRowIdx !== null && (
          <div className="wd-active-row-hint">
            Row {activeRowIdx + 1} selected — enter weight above and click Get Weight
          </div>
        )}

        {/* Remarks */}
        <div className="wd-textarea-row">
          <div className="wd-field">
            <label>Remarks</label>
            <textarea
              rows="3"
              name="remarks"
              value={form.remarks || ""}
              onChange={handleChange}
              readOnly={!editMode}
              className={!editMode ? "wd-readonly" : ""}
            />
          </div>
        </div>

        {/* Bulk Weigh */}
        <div className="wd-checkbox-row">
          <label className="wd-checkbox-label">
            <input
              type="checkbox"
              name="bulkWeigh"
              checked={!!form.bulkWeigh}
              onChange={handleChange}
              disabled={!editMode}
            />
            Bulk Weigh
          </label>
        </div>
      </div>

      {/* ── ITEMS TABLE ── */}
      <div className="wd-card" ref={itemsSectionRef}>
        <div className="wd-items-section">
          <div className="wd-items-header">
            <span className="wd-items-title">* Items</span>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {activeRowIdx !== null && (
                <span className="wd-active-badge">Row {activeRowIdx + 1} active</span>
              )}
              {anyChecked && (
                <button className="wd-del-rows-btn" onClick={handleDeleteChecked}>
                  Delete Selected
                </button>
              )}
            </div>
          </div>

          <div className="wd-items-table-wrap">
            <table className="wd-items-table">
              <thead>
                <tr>
                  <th>S No</th>
                  <th>
                    {/* tick column header explains purpose */}
                    ✓ / Active
                    <div className="wd-tick-hint">tick to inherit weight</div>
                  </th>
                  <th>First Weight (MT)</th>
                  <th>Second Weight (MT)</th>
                  <th>Net Weight (MT)</th>
                  <th>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {items.map((row, idx) => {
                  const isActive  = activeRowIdx === idx;
                  const hasFirst  = !!row.firstWeight;
                  const hasSecond = !!row.secondWeight;
                  const hasNet    = !!row.netWeight;

                  return (
                    <tr
                      key={idx}
                      className={`${row._checked ? "wd-row-checked" : ""} ${isActive ? "wd-row-active" : ""}`}
                      onFocus={() => handleRowFocus(idx)}
                    >
                      <td className="wd-sno">{row.sNo}</td>

                      {/* ── TICK CHECKBOX ── */}
                      <td className="wd-check-cell">
                        <input
                          type="checkbox"
                          checked={!!row._checked}
                          onChange={(e) => handleItemCheck(idx, e.target.checked)}
                          title="Tick to use this row's second weight as the next first weight"
                        />
                      </td>

                      {/* First Weight — auto-filled, read-only */}
                      <td>
                        <input
                          className={`wd-item-input wd-wt-input wd-item-yellow ${hasFirst ? "wd-wt-filled" : ""}`}
                          value={row.firstWeight}
                          readOnly
                          placeholder="← auto"
                        />
                      </td>

                      {/* Second Weight — auto-filled, read-only */}
                      <td>
                        <input
                          className={`wd-item-input wd-wt-input wd-item-yellow ${hasSecond ? "wd-wt-filled" : ""}`}
                          value={row.secondWeight}
                          readOnly
                          placeholder="-"
                        />
                      </td>

                      {/* Net Weight — auto-computed, read-only */}
                      <td>
                        <input
                          className={`wd-item-input wd-net-input wd-item-green ${hasNet ? "wd-net-filled" : ""}`}
                          value={row.netWeight}
                          readOnly
                          placeholder="-"
                        />
                      </td>

                      {/* Remarks — always editable */}
                      <td>
                        <input
                          className="wd-item-input wd-rem-input"
                          value={row.remarks}
                          onChange={(e) => handleItemChange(idx, "remarks", e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="wd-insert-bar">
            <span className="wd-insert-label">Rows to add:</span>
            <input
              type="number"
              min="1"
              max="50"
              className="wd-insert-count"
              value={insertCount}
              onChange={(e) => setInsertCount(e.target.value)}
            />
            <button className="wd-insert-btn" onClick={handleInsertRows}>
              Insert Row
            </button>
          </div>
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <div className="wd-actions">
        <button className="wd-cancel-btn" onClick={() => navigate(-1)} disabled={saving}>
          Cancel
        </button>
        {editMode && (
          <>
            <button className="wd-draft-btn" onClick={() => handleSave(true)} disabled={saving}>
              Save as Draft
            </button>
            <button className="wd-save-btn" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? "Saving..." : "Save & Update"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WeighmentDetail;