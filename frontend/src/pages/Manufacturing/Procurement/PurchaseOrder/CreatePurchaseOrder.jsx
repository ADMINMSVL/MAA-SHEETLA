import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";
import "./PurchaseOrder.css";

const PAYMENT_MODES  = ["Cash", "Cheque", "NEFT/RTGS", "UPI", "Credit", "LC"];
// Status is always "Ordered" on create — no change allowed here
const DEFAULT_STATUS = "Ordered";

/* ── blank row factories ── */
const blankRow = (sNo) => ({
  sNo,
  itemCategory: "",
  itemCode:     "",
  itemName:     "",
  uom:          "",
  qty:          "",
  rate:         "",
  basicAmount:  "",
  _checked:     false,
});

const blankServiceRow = (sNo) => ({
  sNo,
  serviceCode: "",
  serviceName: "",
  qty:         "",
  rate:        "",
  amount:      "",
});

const blankChargeRow = (sNo) => ({
  sNo,
  code:        "",
  description: "",
  amount:      "",
});

const blankTaxRow = (sNo) => ({
  sNo,
  taxType:    "",
  taxCode:    "",
  taxName:    "",
  totalTax:   "",
  amount:     "",
});

/* ── Typeahead ── */
const TypeAhead = ({ label, value, onChange, suggestions, onSelect, required }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = suggestions.filter((s) => s?.toLowerCase().includes((value || "").toLowerCase()));
  return (
    <div className="cgin-field" ref={ref}>
      <label>{required ? `* ${label}` : label}</label>
      <div style={{ position: "relative" }}>
        <input
          type="text" value={value} autoComplete="off"
          placeholder={`Search ${label}…`}
          onChange={(e) => { onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
        />
        {show && value && filtered.length > 0 && (
          <ul className="po-suggestion-list">
            {filtered.map((s) => (
              <li key={s} onMouseDown={() => { onSelect(s); setShow(false); }}>{s}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const ItemRowTypeAhead = ({ value, suggestions, onSelect, onChange }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = suggestions.filter((s) => s?.toLowerCase().includes((value || "").toLowerCase()));
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <input
        className="cgin-item-input cgin-item-wide" type="text" value={value}
        autoComplete="off" placeholder="Search item…"
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
      />
      {show && value && filtered.length > 0 && (
        <ul className="po-suggestion-list" style={{ top: 30, zIndex: 999 }}>
          {filtered.slice(0, 10).map((s) => (
            <li key={s} onMouseDown={() => { onSelect(s); setShow(false); }}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CreatePurchaseOrder = () => {
  const navigate = useNavigate();

  /* ── Masters ── */
  const [parties,    setParties]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [allItems,   setAllItems]   = useState([]);
  const [sites,      setSites]      = useState([]);
  const [serviceMaster,  setServiceMaster]  = useState([]);
  const [chargesMaster,  setChargesMaster]  = useState([]);
  const [taxMaster,      setTaxMaster]      = useState([]);

  /* ── Header ── */
  const [form, setForm] = useState({
    poNo:        "",
    poDate:      new Date().toISOString().split("T")[0],
    poType:      "",
    partyCode:   "",
    partyName:   "",
    site:        "",
    paymentMode: "",
    eta:         "",
    dueDate:     "",
    status:      DEFAULT_STATUS,
    remarks:     "",
  });

  /* ── Item rows ── */
  const [rows,        setRows]        = useState([blankRow(1)]);
  const [insertCount, setInsertCount] = useState(1);

  /* ── Sub-section visibility toggles ── */
  const [showService,  setShowService]  = useState(false);
  const [showCharges,  setShowCharges]  = useState(false);
  const [showTax,      setShowTax]      = useState(false);

  /* ── Sub-section rows ── */
  const [serviceRows, setServiceRows] = useState([blankServiceRow(1)]);
  const [chargeRows,  setChargeRows]  = useState([blankChargeRow(1)]);
  const [taxRows,     setTaxRows]     = useState([blankTaxRow(1)]);

  /* ── Fetch masters + PO No ── */
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const fetchAll = async () => {
      try {
        const [partyRes, catRes, itemRes, seqRes, siteRes, svcRes, chgRes, taxRes] = await Promise.all([
          axios.get(`${API_URL}/api/parties`),
          axios.get(`${API_URL}/api/item-categories`),
          axios.get(`${API_URL}/api/items`),
          axios.get(`${API_URL}/api/document-sequence`),
          axios.get(`${API_URL}/api/sites`),
          axios.get(`${API_URL}/api/service-master`),
          axios.get(`${API_URL}/api/charges-master`),
          axios.get(`${API_URL}/api/tax-details`),
        ]);
        setParties(partyRes.data.filter((p) => p.status === "Active"));
        setCategories(catRes.data.filter((c) => c.status === "Active"));
        setAllItems(itemRes.data.filter((i) => i.status === "Active"));
        setSites(siteRes.data.filter((s) => s.status === "Active"));
        setServiceMaster(svcRes.data.filter((s) => s.status === "Active"));
        setChargesMaster(chgRes.data.filter((c) => c.status === "Active"));
        setTaxMaster(taxRes.data.filter((t) => t.status === "Active"));

        const allSeq = seqRes.data || [];
        const matching = allSeq.filter(
          (r) =>
            (r.module && r.module.toLowerCase().includes("purchase order")) ||
            (r.businessEntity && r.businessEntity.toLowerCase().includes("purchase order")) ||
            (r.businessEntity && r.businessEntity.toUpperCase() === "REQ.PO")
        );
        const lastRecord = matching.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        let poNo = "PO01";
        if (lastRecord) {
          const nextIncrement = matching.length > 0
            ? Math.max(...matching.map((r) => Number(r.incrementNo))) + 1 : 1;
          const digits    = Math.max(1, Number(lastRecord.sequenceDigits) || 2);
          const seqFormat = lastRecord.sequenceFormat || "dd/mm/yy";
          const useDateFrag = lastRecord.useDateFragment ?? true;
          const prefix    = lastRecord.entityPrefix || "PO";
          let datePart = "";
          if (useDateFrag) {
            const d  = new Date();
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const yy = String(new Date().getFullYear()).slice(-2);
            if (seqFormat === "mm/dd/yy")      datePart = `${mm}${dd}${yy}`;
            else if (seqFormat === "yy/mm/dd") datePart = `${yy}${mm}${dd}`;
            else                               datePart = `${dd}${mm}${yy}`;
          }
          poNo = `${prefix}${datePart}${String(nextIncrement).padStart(digits, "0")}`;
        }
        setForm((p) => ({ ...p, poNo, poDate: today }));
      } catch (err) {
        console.error("Masters fetch error:", err);
        setForm((p) => ({ ...p, poNo: "PO01", poDate: today }));
      }
    };
    fetchAll();
  }, []);

  const partyNames    = [...new Set(parties.map((p) => p.partyName).filter(Boolean))].sort();
  const categoryNames = [...new Set(categories.map((c) => c.categoryName).filter(Boolean))].sort();

  const handlePartySelect = (name) => {
    const p = parties.find((x) => x.partyName === name);
    setForm((f) => ({ ...f, partyName: name, partyCode: p?.partyCode || "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  /* ── Item row helpers ── */
  const handleRowChange = (idx, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "qty" || field === "rate") {
        const qty  = Number(field === "qty"  ? value : next[idx].qty  || 0);
        const rate = Number(field === "rate" ? value : next[idx].rate || 0);
        next[idx].basicAmount = qty && rate ? (qty * rate).toFixed(2) : "";
      }
      if (field === "itemName") {
        const it = allItems.find((x) => x.itemName === value);
        if (it) {
          next[idx].itemCode     = it.itemCode || "";
          next[idx].uom          = it.uom      || "";
          next[idx].itemCategory = it.category || next[idx].itemCategory;
        }
      }
      return next;
    });
  };

  const handleRowCheck   = (idx, checked) =>
    setRows((prev) => { const n=[...prev]; n[idx]={...n[idx],_checked:checked}; return n; });

  const handleInsertRows = () => {
    const count = Math.max(1, Math.min(50, Number(insertCount) || 1));
    setRows((prev) => {
      const start = prev.length + 1;
      return [...prev, ...Array.from({ length: count }, (_, i) => blankRow(start + i))];
    });
  };

  const handleDeleteChecked = () =>
    setRows((prev) => {
      const kept = prev.filter((r) => !r._checked).map((r, i) => ({ ...r, sNo: i + 1 }));
      return kept.length > 0 ? kept : [blankRow(1)];
    });

  const itemsForRow = (rowIdx) => {
    const cat  = rows[rowIdx].itemCategory;
    const list = cat ? allItems.filter((i) => i.category === cat) : allItems;
    return [...new Set(list.map((i) => i.itemName).filter(Boolean))].sort();
  };

  /* ── Service row helpers ── */
  const handleServiceRowChange = (idx, field, value) => {
    setServiceRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "serviceCode") {
        const svc = serviceMaster.find((s) => s.serviceCode === value);
        if (svc) next[idx].serviceName = svc.serviceDetails || "";
      }
      if (field === "qty" || field === "rate") {
        const qty  = Number(field === "qty"  ? value : next[idx].qty  || 0);
        const rate = Number(field === "rate" ? value : next[idx].rate || 0);
        next[idx].amount = qty && rate ? (qty * rate).toFixed(2) : "";
      }
      return next;
    });
  };

  /* ── Charges row helpers ── */
  const handleChargeRowChange = (idx, field, value) => {
    setChargeRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "code") {
        const chg = chargesMaster.find((c) => c.code === value);
        if (chg) next[idx].description = chg.details || "";
      }
      return next;
    });
  };

  /* ── Tax row helpers ── */
  const handleTaxRowChange = (idx, field, value) => {
    setTaxRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "taxCode") {
        const tx = taxMaster.find((t) => t.taxCode === value);
        if (tx) {
          next[idx].taxType = tx.taxType    || "";
          next[idx].taxName = tx.taxName    || "";
          next[idx].totalTax = tx.percentage ? `${tx.percentage}%` : "";
        }
      }
      return next;
    });
  };

  /* ── Totals ── */
  const itemBasic    = rows.reduce((s, r) => s + Number(r.basicAmount || 0), 0);
  const serviceTotal = showService
    ? serviceRows.reduce((s, r) => s + Number(r.amount || 0), 0) : 0;
  const chargeTotal  = showCharges
    ? chargeRows.reduce((s, r) => s + Number(r.amount || 0), 0) : 0;
  const taxTotal     = showTax
    ? taxRows.reduce((s, r) => s + Number(r.amount || 0), 0) : 0;
  const grandTotal   = itemBasic + serviceTotal + chargeTotal + taxTotal;

  /* ── Save ── */
  const handleSave = async () => {
    if (!form.partyName.trim()) return alert("Party Name is required.");
    const validRows = rows.filter((r) => r.itemName && r.itemName.trim());
    if (validRows.length === 0) return alert("Add at least one item.");

    const toNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
    const payload = {
      ...form,
      status: DEFAULT_STATUS,
      items: validRows.map(({ _checked, ...r }) => ({
        ...r,
        qty:         toNum(r.qty),
        rate:        toNum(r.rate),
        basicAmount: toNum(r.basicAmount),
        netAmount:   toNum(r.basicAmount), // items don't carry SC/charges/discount individually anymore
        serviceCharge: 0,
        charges:       0,
        discount:      0,
      })),
      basicAmount: Number(itemBasic.toFixed(2)),
      netAmount:   Number(grandTotal.toFixed(2)),
      serviceRows: showService ? serviceRows : [],
      chargeRows:  showCharges ? chargeRows  : [],
      taxRows:     showTax     ? taxRows     : [],
    };

    try {
      try {
        const seqSnap = await axios.get(`${API_URL}/api/document-sequence`);
        const allSeq  = seqSnap.data || [];
        const poSeq   = allSeq
          .filter(
            (r) =>
              (r.module && r.module.toLowerCase().includes("purchase order")) ||
              (r.businessEntity && r.businessEntity.toLowerCase().includes("purchase order")) ||
              (r.businessEntity && r.businessEntity.toUpperCase() === "REQ.PO")
          )
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        if (poSeq) {
          await axios.post(`${API_URL}/api/create-document-sequence`, {
            module:         poSeq.module,
            businessEntity: poSeq.businessEntity,
            entityPrefix:   poSeq.entityPrefix,
          });
        }
      } catch (seqErr) {
        console.warn("Sequence increment skipped:", seqErr.message);
      }
      await axios.post(`${API_URL}/api/create-purchase-order`, payload);
      alert("Purchase Order saved successfully!");
      navigate("/purchase-order");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error saving Purchase Order");
    }
  };

  const handleReset = () => {
    setRows([blankRow(1)]);
    setServiceRows([blankServiceRow(1)]);
    setChargeRows([blankChargeRow(1)]);
    setTaxRows([blankTaxRow(1)]);
    setShowService(false); setShowCharges(false); setShowTax(false);
    setForm((f) => ({
      ...f, poType: "", partyCode: "", partyName: "", site: "",
      paymentMode: "", eta: "", dueDate: "", status: DEFAULT_STATUS, remarks: "",
    }));
  };

  return (
    <div className="cpo-page">
      <ModuleNavbar />

      {/* PAGE HEADER */}
      <div className="cgin-header">
        <div className="cgin-header-left">
          <button className="back-btn" onClick={() => navigate("/purchase-order")}>←</button>
          <h2>Create Purchase Order</h2>
        </div>
        <span className="cpo-pono-badge">PO No: {form.poNo}</span>
      </div>

      {/* ══════════ ORDER DETAILS CARD ══════════ */}
      <div className="cgin-card" style={{ marginBottom: 20 }}>
        <div className="cgin-card-title">Order Details</div>

        <div className="cgin-grid">

          {/* 1. PO No */}
          <div className="cgin-field">
            <label>PO No</label>
            <input type="text" value={form.poNo} readOnly style={{ background: "#f1f5f9", fontWeight: 700 }} />
          </div>

          {/* 2. PO Date */}
          <div className="cgin-field">
            <label>* PO Date</label>
            <input type="date" name="poDate" value={form.poDate} onChange={handleChange} />
          </div>

          {/* 3. PO Type */}
          <div className="cgin-field">
            <label>PO Type</label>
            <select name="poType" value={form.poType} onChange={handleChange}>
              <option value="">- Select -</option>
              <option value="T">T</option>
              <option value="UT">UT</option>
            </select>
          </div>

          {/* 4. Party Code — auto filled */}
          <div className="cgin-field">
            <label>Party Code</label>
            <input type="text" value={form.partyCode} readOnly style={{ background: "#f1f5f9" }} />
          </div>

          {/* 5. Party Name — typeahead */}
          <div className="cgin-field" style={{ position: "relative" }}>
            <TypeAhead
              label="Party Name" required
              value={form.partyName}
              onChange={(v) => setForm((f) => ({ ...f, partyName: v }))}
              suggestions={partyNames}
              onSelect={handlePartySelect}
            />
          </div>

          {/* 6. Site */}
          <div className="cgin-field">
            <label>Site</label>
            <select name="site" value={form.site} onChange={handleChange}>
              <option value="">- Select Site -</option>
              {sites.map((s) => (
                <option key={s._id} value={s.siteCode}>{s.siteCode} - {s.siteName}</option>
              ))}
            </select>
          </div>

          {/* 7. Payment Mode */}
          <div className="cgin-field">
            <label>Payment Mode</label>
            <select name="paymentMode" value={form.paymentMode} onChange={handleChange}>
              <option value="">- Select -</option>
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* 8. ETA */}
          <div className="cgin-field">
            <label>ETA</label>
            <input type="date" name="eta" value={form.eta} onChange={handleChange} />
          </div>

          {/* 9. Due Date */}
          <div className="cgin-field">
            <label>Due Date</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
          </div>

          {/* 10. Status — always Ordered, read-only */}
          <div className="cgin-field">
            <label>Status</label>
            <input type="text" value={DEFAULT_STATUS} readOnly style={{ background: "#f1f5f9", color: "#1d4ed8", fontWeight: 600 }} />
          </div>

          {/* 11. Remarks */}
          <div className="cgin-field" style={{ gridColumn: "span 2" }}>
            <label>Remarks</label>
            <input type="text" name="remarks" value={form.remarks} onChange={handleChange} placeholder="Optional remarks" />
          </div>

        </div>
      </div>

      {/* ══════════ ITEMS GRID ══════════ */}
      <div className="cgin-card">
        <div className="cgin-items-header">
          <span className="cgin-items-title">Items</span>
          <button className="cgin-del-rows-btn" onClick={handleDeleteChecked}>Delete Selected</button>
        </div>

        <div className="cgin-items-table-wrap">
          <table className="cgin-items-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox"
                    onChange={(e) => setRows((p) => p.map((r) => ({ ...r, _checked: e.target.checked })))} />
                </th>
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
              {rows.map((row, idx) => (
                <tr key={idx} className={row._checked ? "cgin-row-checked" : ""}>
                  <td className="cgin-check-cell">
                    <input type="checkbox" checked={row._checked}
                      onChange={(e) => handleRowCheck(idx, e.target.checked)} />
                  </td>
                  <td className="cgin-sno-cell">{row.sNo}</td>
                  <td>
                    <select className="cgin-item-input cgin-item-wide" value={row.itemCategory}
                      onChange={(e) => {
                        handleRowChange(idx, "itemCategory", e.target.value);
                        handleRowChange(idx, "itemName", "");
                        handleRowChange(idx, "itemCode", "");
                      }}>
                      <option value="">- Select -</option>
                      {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td>
                    <input className="cgin-item-input" value={row.itemCode} readOnly
                      style={{ background: "#f8fafc" }} />
                  </td>
                  <td>
                    <ItemRowTypeAhead
                      value={row.itemName}
                      suggestions={itemsForRow(idx)}
                      onSelect={(v) => handleRowChange(idx, "itemName", v)}
                      onChange={(v) => handleRowChange(idx, "itemName", v)}
                    />
                  </td>
                  <td>
                    <input className="cgin-item-input cgin-item-sm" value={row.uom} readOnly
                      style={{ background: "#f8fafc" }} />
                  </td>
                  <td>
                    <input type="number" className="cgin-item-input cgin-item-num" value={row.qty} min="0"
                      onChange={(e) => handleRowChange(idx, "qty", e.target.value)} />
                  </td>
                  <td>
                    <input type="number" className="cgin-item-input cgin-item-num" value={row.rate} min="0"
                      onChange={(e) => handleRowChange(idx, "rate", e.target.value)} />
                  </td>
                  <td>
                    <input className="cgin-item-input cgin-item-num" value={row.basicAmount} readOnly
                      style={{ background: "#f8fafc", fontWeight: 600 }} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="8" style={{ textAlign: "right", fontWeight: 700, padding: "8px 10px", background: "#eef1f7" }}>
                  Item Basic Total:
                </td>
                <td style={{ fontWeight: 700, padding: "8px 10px", background: "#eef1f7" }}>
                  {itemBasic.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* INSERT ROW BAR */}
        <div className="cgin-insert-row-bar">
          <span style={{ fontSize: 13, color: "#555" }}>Insert rows:</span>
          <input type="number" className="cgin-insert-count" min={1} max={50}
            value={insertCount} onChange={(e) => setInsertCount(e.target.value)} />
          <button className="cgin-insert-row-btn" onClick={handleInsertRows}>+ Add Rows</button>
        </div>

        {/* ── SUB-SECTION TOGGLE BUTTONS ── */}
        <div className="cpo-sub-toggle-bar">
          <button
            className={`cpo-sub-toggle-btn ${showService ? "active" : ""}`}
            onClick={() => setShowService((v) => !v)}
          >
            {showService ? "▼" : "▶"} Service
          </button>
          <button
            className={`cpo-sub-toggle-btn ${showCharges ? "active" : ""}`}
            onClick={() => setShowCharges((v) => !v)}
          >
            {showCharges ? "▼" : "▶"} Charges / Discount
          </button>
          <button
            className={`cpo-sub-toggle-btn ${showTax ? "active" : ""}`}
            onClick={() => setShowTax((v) => !v)}
          >
            {showTax ? "▼" : "▶"} Tax Details
          </button>
        </div>

        {/* ── SERVICE SUB-TABLE ── */}
        {showService && (
          <div className="cpo-sub-section">
            <div className="cpo-sub-title">Service</div>
            <div className="cgin-items-table-wrap">
              <table className="cgin-items-table">
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
                  {serviceRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="cgin-sno-cell">{row.sNo}</td>
                      <td>
                        <select className="cgin-item-input"
                          value={row.serviceCode}
                          onChange={(e) => handleServiceRowChange(idx, "serviceCode", e.target.value)}>
                          <option value="">- Select -</option>
                          {serviceMaster.map((s) => (
                            <option key={s._id} value={s.serviceCode}>{s.serviceCode}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input className="cgin-item-input cgin-item-wide" value={row.serviceName} readOnly
                          style={{ background: "#f8fafc" }} />
                      </td>
                      <td>
                        <input type="number" className="cgin-item-input cgin-item-num" value={row.qty}
                          onChange={(e) => handleServiceRowChange(idx, "qty", e.target.value)} />
                      </td>
                      <td>
                        <input type="number" className="cgin-item-input cgin-item-num" value={row.rate}
                          onChange={(e) => handleServiceRowChange(idx, "rate", e.target.value)} />
                      </td>
                      <td>
                        <input className="cgin-item-input cgin-item-num" value={row.amount} readOnly
                          style={{ background: "#f8fafc", fontWeight: 600 }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5" style={{ textAlign: "right", fontWeight: 700, padding: "8px 10px", background: "#eef1f7" }}>
                      Service Total:
                    </td>
                    <td style={{ fontWeight: 700, padding: "8px 10px", background: "#eef1f7" }}>
                      {serviceTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="cgin-insert-row-bar">
              <button className="cgin-insert-row-btn" onClick={() =>
                setServiceRows((p) => [...p, blankServiceRow(p.length + 1)])}>
                + Add Row
              </button>
            </div>
          </div>
        )}

        {/* ── CHARGES/DISCOUNT SUB-TABLE ── */}
        {showCharges && (
          <div className="cpo-sub-section">
            <div className="cpo-sub-title">Charges / Discount</div>
            <div className="cgin-items-table-wrap">
              <table className="cgin-items-table">
                <thead>
                  <tr>
                    <th>S No</th>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {chargeRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="cgin-sno-cell">{row.sNo}</td>
                      <td>
                        <select className="cgin-item-input"
                          value={row.code}
                          onChange={(e) => handleChargeRowChange(idx, "code", e.target.value)}>
                          <option value="">- Select -</option>
                          {chargesMaster.map((c) => (
                            <option key={c._id} value={c.code}>{c.code}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input className="cgin-item-input cgin-item-wide" value={row.description} readOnly
                          style={{ background: "#f8fafc" }} />
                      </td>
                      <td>
                        <input type="number" className="cgin-item-input cgin-item-num" value={row.amount}
                          onChange={(e) => handleChargeRowChange(idx, "amount", e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ textAlign: "right", fontWeight: 700, padding: "8px 10px", background: "#eef1f7" }}>
                      Charges Total:
                    </td>
                    <td style={{ fontWeight: 700, padding: "8px 10px", background: "#eef1f7" }}>
                      {chargeTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="cgin-insert-row-bar">
              <button className="cgin-insert-row-btn" onClick={() =>
                setChargeRows((p) => [...p, blankChargeRow(p.length + 1)])}>
                + Add Row
              </button>
            </div>
          </div>
        )}

        {/* ── TAX DETAILS SUB-TABLE ── */}
        {showTax && (
          <div className="cpo-sub-section">
            <div className="cpo-sub-title">Tax Details</div>
            <div className="cgin-items-table-wrap">
              <table className="cgin-items-table">
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
                  {taxRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="cgin-sno-cell">{row.sNo}</td>
                      <td>
                        <input className="cgin-item-input" value={row.taxType} readOnly
                          style={{ background: "#f8fafc" }} />
                      </td>
                      <td>
                        <select className="cgin-item-input"
                          value={row.taxCode}
                          onChange={(e) => handleTaxRowChange(idx, "taxCode", e.target.value)}>
                          <option value="">- Select -</option>
                          {taxMaster.map((t) => (
                            <option key={t._id} value={t.taxCode}>{t.taxCode}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input className="cgin-item-input cgin-item-wide" value={row.taxName} readOnly
                          style={{ background: "#f8fafc" }} />
                      </td>
                      <td>
                        <input className="cgin-item-input" value={row.totalTax} readOnly
                          style={{ background: "#f8fafc" }} />
                      </td>
                      <td>
                        <input type="number" className="cgin-item-input cgin-item-num" value={row.amount}
                          onChange={(e) => handleTaxRowChange(idx, "amount", e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5" style={{ textAlign: "right", fontWeight: 700, padding: "8px 10px", background: "#eef1f7" }}>
                      Tax Total:
                    </td>
                    <td style={{ fontWeight: 700, padding: "8px 10px", background: "#eef1f7" }}>
                      {taxTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="cgin-insert-row-bar">
              <button className="cgin-insert-row-btn" onClick={() =>
                setTaxRows((p) => [...p, blankTaxRow(p.length + 1)])}>
                + Add Row
              </button>
            </div>
          </div>
        )}

        {/* ── GRAND TOTAL ── */}
        <div className="cpo-grand-total-bar">
          <span>Grand Total Amount:</span>
          <strong>₹ {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
        </div>

      </div>

      {/* ACTION BUTTONS */}
      <div className="cgin-actions">
        <button className="btn-reset" onClick={handleReset}>Reset</button>
        <button className="btn-save"  onClick={handleSave}>Save PO</button>
      </div>

    </div>
  );
};

export default CreatePurchaseOrder;