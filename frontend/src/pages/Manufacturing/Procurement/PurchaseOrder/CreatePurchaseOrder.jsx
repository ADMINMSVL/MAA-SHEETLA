import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";
import "./PurchaseOrder.css";

/* ── Excel columns:
   PO NO | DATE | PARTY NAME | TYPE | ITEM CAT. | ITEM | QTY MTS |
   RATE/MTS | BASIC AMOUNT | PAYMENT MODE | ETA | DUE DATE | STATUS |
   REFERENCE/REMARKS | MOBILE NO | MESSAGE | NOTIFICATION
────────────────────────────────────────────────────────────────── */

const PAYMENT_MODES  = ["Cash", "Cheque", "NEFT/RTGS", "UPI", "Credit", "LC"];
const STATUS_OPTIONS = ["Ordered", "Partially Received", "Dispatch", "Cancelled"];

const blankRow = (sNo) => ({
  sNo,
  itemCode:     "",
  itemCategory: "",
  itemName:     "",
  uom:          "",
  qty:          "",
  rate:         "",
  basicAmount:  "",
  _checked:     false,
});

/* Typeahead helper */
const TypeAhead = ({ label, value, onChange, suggestions, onSelect, required }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = suggestions.filter((s) =>
    s?.toLowerCase().includes((value || "").toLowerCase())
  );

  return (
    <div className="cpo-field" ref={ref}>
      <label>{required ? `* ${label}` : label}</label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          autoComplete="off"
          placeholder={`Search ${label}…`}
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

const CreatePurchaseOrder = () => {
  const navigate = useNavigate();

  /* ── Master data ── */
  const [parties,    setParties]    = useState([]);
  const [partyTypes, setPartyTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allItems,   setAllItems]   = useState([]);

  /* ── Header form ── */
  const [form, setForm] = useState({
    poNo:        "",
    poDate:      new Date().toISOString().split("T")[0],
    partyName:   "",
    partyCode:   "",
    mobileNo:    "",
    transactionType:   "",
    paymentMode: "",
    eta:         "",
    dueDate:     "",
    status:      "Ordered",
    remarks:     "",
  });

  /* ── Items grid ── */
  const [rows,        setRows]        = useState([blankRow(1)]);
  const [insertCount, setInsertCount] = useState(1);

  /* ── Fetch masters + PO No ── */
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    const fetchAll = async () => {
      try {
        const [partyRes, ptRes, catRes, itemRes, seqRes] = await Promise.all([
          axios.get(`${API_URL}/api/parties`),
          axios.get(`${API_URL}/api/party-types`),
          axios.get(`${API_URL}/api/item-categories`),
          axios.get(`${API_URL}/api/items`),
          axios.get(`${API_URL}/api/document-sequence`),
        ]);

        setParties(partyRes.data.filter((p) => p.status === "Active"));
        setPartyTypes(ptRes.data.filter((p) => p.status === "Active"));
        setCategories(catRes.data.filter((c) => c.status === "Active"));
        setAllItems(itemRes.data.filter((i) => i.status === "Active"));

        /* Build PO No — fully driven by what's saved in the sequence master */
        const matching = seqRes.data.filter(
          (r) => r.module === "Procurement" && r.businessEntity === "Purchase Order"
        );
        const lastRecord = matching.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        )[0];

        // nextIncrement: max of all existing records + 1, or 1 if none
        const nextIncrement = matching.length > 0
          ? Math.max(...matching.map((r) => Number(r.incrementNo))) + 1
          : 1;

        // Read every setting from the saved sequence master record
        const digits      = Math.max(1, Number(lastRecord?.sequenceDigits) || 2);
        const seqFormat   = lastRecord?.sequenceFormat   || "dd/mm/yyyy";
        const useDateFrag = lastRecord?.useDateFragment  ?? false; // default false = no date
        const prefix      = lastRecord?.entityPrefix     || "PO";

        // Only build a date part when the master explicitly has useDateFragment = true
        let datePart = "";
        if (useDateFrag) {
          const d    = new Date();
          const dd   = String(d.getDate()).padStart(2, "0");
          const mm   = String(d.getMonth() + 1).padStart(2, "0");
          const yyyy = String(d.getFullYear());
          if (seqFormat === "mm/dd/yyyy")      datePart = `${mm}${dd}${yyyy}`;
          else if (seqFormat === "yyyy/mm/dd") datePart = `${yyyy}${mm}${dd}`;
          else                                 datePart = `${dd}${mm}${yyyy}`;
        }

        // e.g.  useDateFrag=false → "PO01"   useDateFrag=true → "PO0606202601"
        const poNo = `${prefix}${datePart}${String(nextIncrement).padStart(digits, "0")}`;
        setForm((p) => ({ ...p, poNo, poDate: today, eta: today, dueDate: today }));
      } catch (err) {
        console.error("Masters fetch error:", err);
        // Fallback: no date fragment — pure prefix + sequence number
        setForm((p) => ({
          ...p,
          poNo:    "PO01",
          poDate:  today,
          eta:     today,
          dueDate: today,
        }));
      }
    };

    fetchAll();
  }, []);

  /* ── Derived lists ── */
  const partyNames  = [...new Set(parties.map((p) => p.partyName).filter(Boolean))].sort();
  const categoryNames = [...new Set(categories.map((c) => c.categoryName).filter(Boolean))].sort();

  /* when party name chosen — auto fill code, mobile, type */
  const handlePartySelect = (name) => {
    const p = parties.find((x) => x.partyName === name);
    setForm((f) => ({
      ...f,
      partyName: name,
      partyCode: p?.partyCode  || "",
      mobileNo:  p?.mobile     || "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  /* ── Row helpers ── */
  const handleRowChange = (idx, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };

      /* auto-compute basic amount */
      if (field === "qty" || field === "rate") {
        const qty  = field === "qty"  ? Number(value) : Number(next[idx].qty);
        const rate = field === "rate" ? Number(value) : Number(next[idx].rate);
        next[idx].basicAmount = (qty && rate) ? (qty * rate).toFixed(2) : "";
      }

      /* when itemName chosen, auto-fill itemCode + uom from master */
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

  const handleRowCheck = (idx, checked) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], _checked: checked };
      return next;
    });
  };

  const handleInsertRows = () => {
    const count = Math.max(1, Math.min(50, Number(insertCount) || 1));
    setRows((prev) => {
      const start = prev.length + 1;
      return [...prev, ...Array.from({ length: count }, (_, i) => blankRow(start + i))];
    });
  };

  const handleDeleteChecked = () => {
    setRows((prev) => {
      const kept = prev.filter((r) => !r._checked).map((r, i) => ({ ...r, sNo: i + 1 }));
      return kept.length > 0 ? kept : [blankRow(1)];
    });
  };

  /* ── Submit ── */
  const handleSave = async () => {
    if (!form.partyName.trim()) return alert("Party Name is required.");
    const validRows = rows.filter((r) => r.itemName.trim());
    if (validRows.length === 0) return alert("Add at least one item.");

    const basicAmount = validRows.reduce((s, r) => s + Number(r.basicAmount || 0), 0);

    const payload = {
      ...form,
      items:       validRows.map(({ _checked, ...r }) => r),
      basicAmount: basicAmount.toFixed(2),
    };

    try {
      /* Increment the sequence counter in the master (does NOT change format/date settings) */
      await axios.post(`${API_URL}/api/create-document-sequence`, {
        module:         "Procurement",
        businessEntity: "Purchase Order",
        entityPrefix:   "PO",
        // No useDateFragment / sequenceFormat here — backend reads last record's settings
      });

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
    setForm((f) => ({
      ...f,
      partyName: "", partyCode: "", mobileNo: "",
      partyType: "", paymentMode: "", remarks: "",
      status: "Ordered",
    }));
  };

  /* items filtered by category selected in a row */
  const itemsForRow = (rowIdx) => {
    const cat = rows[rowIdx].itemCategory;
    const list = cat
      ? allItems.filter((i) => i.category === cat)
      : allItems;
    return [...new Set(list.map((i) => i.itemName).filter(Boolean))].sort();
  };

  const totalBasic = rows.reduce((s, r) => s + Number(r.basicAmount || 0), 0);

  return (
    <div className="cpo-page">
      <ModuleNavbar />

      {/* HEADER */}
      <div className="cgin-header">
        <div className="cgin-header-left">
          <button className="back-btn" onClick={() => navigate("/purchase-order")}>←</button>
          <h2>Create Purchase Order</h2>
        </div>
        <span className="cpo-pono-badge">PO No: {form.poNo}</span>
      </div>

      {/* MAIN CARD */}
      <div className="cgin-card" style={{ marginBottom: 20 }}>
        <div className="cgin-card-title">Order Details</div>

        <div className="cgin-grid">

          {/* PO No — read only */}
          <div className="cgin-field">
            <label>PO No</label>
            <input type="text" value={form.poNo} readOnly style={{ background: "#f1f5f9", fontWeight: 700 }} />
          </div>

          {/* PO Date */}
          <div className="cgin-field">
            <label>* PO Date</label>
            <input type="date" name="poDate" value={form.poDate} onChange={handleChange} />
          </div>

          {/* Party Name — typeahead from Party master */}
          <div className="cgin-field" style={{ position: "relative" }}>
            {/* <label>* Party Name</label> */}
            <TypeAhead
              label="Party Name"
              value={form.partyName}
              onChange={(v) => setForm((f) => ({ ...f, partyName: v }))}
              suggestions={partyNames}
              onSelect={handlePartySelect}
              required
            />
          </div>

          {/* Party Code — auto filled */}
          <div className="cgin-field">
            <label>Party Code</label>
            <input type="text" value={form.partyCode} readOnly style={{ background: "#f1f5f9" }} />
          </div>

          {/* Mobile No — auto filled from Party */}
          <div className="cgin-field">
            <label>Mobile No</label>
            <input type="text" name="mobileNo" value={form.mobileNo}
              onChange={handleChange} placeholder="Mobile No" />
          </div>

          {/* Party Type — auto filled, can override */}
       <div className="cgin-field">
        <label>Transaction Type</label>
        <select
          name="transactionType"
          value={form.transactionType}
          onChange={handleChange}
        >
          <option value="">- Select -</option>
          <option value="Purchase">T</option>
          <option value="Import Purchase">UT</option>
        </select>
      </div>

          {/* Payment Mode */}
          <div className="cgin-field">
            <label>Payment Mode</label>
            <select name="paymentMode" value={form.paymentMode} onChange={handleChange}>
              <option value="">- Select -</option>
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* ETA */}
          <div className="cgin-field">
            <label>ETA</label>
            <input type="date" name="eta" value={form.eta} onChange={handleChange} />
          </div>

          {/* Due Date */}
          <div className="cgin-field">
            <label>Due Date</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
          </div>

          {/* Status */}
          <div className="cgin-field">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Remarks */}
          <div className="cgin-field">
            <label>Reference / Remarks</label>
            <input type="text" name="remarks" value={form.remarks}
              onChange={handleChange} placeholder="Optional remarks" />
          </div>

        </div>
      </div>

      {/* ITEMS GRID */}
      <div className="cgin-card">
        <div className="cgin-items-section" style={{ border: "none" }}>

          <div className="cgin-items-header">
            <span className="cgin-items-title">Items</span>
            <button className="cgin-del-rows-btn" onClick={handleDeleteChecked}>
              Delete Selected
            </button>
          </div>

          <div className="cgin-items-table-wrap">
            <table className="cgin-items-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox"
                      onChange={(e) => setRows((p) => p.map((r) => ({ ...r, _checked: e.target.checked })))}
                    />
                  </th>
                  <th>S No</th>
                  <th>Item Category</th>
                  <th>Item Name</th>
                  <th>Item Code</th>
                  <th>UOM</th>
                  <th>Qty (MTS)</th>
                  <th>Rate / MTS</th>
                  <th>Basic Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className={row._checked ? "cgin-row-checked" : ""}>

                    {/* checkbox */}
                    <td className="cgin-check-cell">
                      <input type="checkbox" checked={row._checked}
                        onChange={(e) => handleRowCheck(idx, e.target.checked)} />
                    </td>

                    {/* S No */}
                    <td className="cgin-sno-cell">{row.sNo}</td>

                    {/* Item Category — from master */}
                    <td>
                      <select
                        className="cgin-item-input cgin-item-wide"
                        value={row.itemCategory}
                        onChange={(e) => {
                          handleRowChange(idx, "itemCategory", e.target.value);
                          handleRowChange(idx, "itemName", "");
                          handleRowChange(idx, "itemCode", "");
                        }}
                      >
                        <option value="">- Select -</option>
                        {categoryNames.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>

                    {/* Item Name — filtered by category */}
                    <td>
                      <ItemRowTypeAhead
                        value={row.itemName}
                        suggestions={itemsForRow(idx)}
                        onSelect={(v) => handleRowChange(idx, "itemName", v)}
                        onChange={(v) => handleRowChange(idx, "itemName", v)}
                      />
                    </td>

                    {/* Item Code — auto filled */}
                    <td>
                      <input className="cgin-item-input" value={row.itemCode} readOnly
                        style={{ background: "#f8fafc" }} />
                    </td>

                    {/* UOM — auto filled */}
                    <td>
                      <input className="cgin-item-input cgin-item-sm" value={row.uom} readOnly
                        style={{ background: "#f8fafc" }} />
                    </td>

                    {/* Qty */}
                    <td>
                      <input type="number" className="cgin-item-input cgin-item-num"
                        value={row.qty}
                        onChange={(e) => handleRowChange(idx, "qty", e.target.value)}
                        min="0" placeholder="0"
                      />
                    </td>

                    {/* Rate */}
                    <td>
                      <input type="number" className="cgin-item-input cgin-item-num"
                        value={row.rate}
                        onChange={(e) => handleRowChange(idx, "rate", e.target.value)}
                        min="0" placeholder="0"
                      />
                    </td>

                    {/* Basic Amount — auto calc */}
                    <td>
                      <input className="cgin-item-input cgin-item-num" value={row.basicAmount}
                        readOnly style={{ background: "#f8fafc", fontWeight: 600 }} />
                    </td>

                  </tr>
                ))}
              </tbody>

              {/* TOTAL ROW */}
              <tfoot>
                <tr>
                  <td colSpan="8" style={{ textAlign: "right", fontWeight: 700, padding: "8px 10px", background: "#eef1f7" }}>
                    Total Basic Amount:
                  </td>
                  <td style={{ fontWeight: 700, padding: "8px 10px", background: "#eef1f7" }}>
                    {totalBasic.toFixed(2)}
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
            <button className="cgin-insert-row-btn" onClick={handleInsertRows}>
              + Add Rows
            </button>
          </div>

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

/* ── Inline typeahead for item rows ── */
const ItemRowTypeAhead = ({ value, suggestions, onSelect, onChange }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = suggestions.filter((s) =>
    s?.toLowerCase().includes((value || "").toLowerCase())
  );

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <input
        className="cgin-item-input cgin-item-wide"
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        autoComplete="off"
        placeholder="Search item…"
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

export default CreatePurchaseOrder;