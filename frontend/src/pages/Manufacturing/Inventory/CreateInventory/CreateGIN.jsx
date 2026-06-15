import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./CreateGIN.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";
import useSiteOptions from "../../../../hooks/useSiteOptions";

/*
  Create Inward Outward Note
  ──────────────────────────
  • Transaction Category drives the IN/OUT WARD NO prefix
  • Party Code lookup → auto-fills Party Name (and vice-versa)
  • Item Group → filters items; Item Name/Code typeahead auto-fills Code/Name + UOM
  • PO No dropdown shows only "Intransit" POs; selecting one auto-fills party + items
*/

/* ── 2-digit year date builder ── */
const buildDatePart = (format) => {
  const d  = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  if (format === "mm/dd/yy") return `${mm}${dd}${yy}`;
  if (format === "yy/mm/dd") return `${yy}${mm}${dd}`;
  return `${dd}${mm}${yy}`;
};

const blankItem = (sNo) => ({
  sNo,
  itemCode: "",
  itemName: "",
  uom:      "",
  qty:      "",
  rate:     "",
  _checked: false,
});

/* ── Simple typeahead component ── */
const TypeAhead = ({ value, onChange, suggestions, onSelect, placeholder, className }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = value
    ? suggestions.filter((s) => s?.toLowerCase().includes(value.toLowerCase())).slice(0, 10)
    : [];

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <input
        type="text"
        className={className || "cgin-input"}
        value={value}
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {show && filtered.length > 0 && (
        <ul className="cgin-suggestions">
          {filtered.map((s, i) => (
            <li key={i} onMouseDown={() => { onSelect(s); setShow(false); }}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CreateGIN = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading,     setLoading]     = useState(false);
  const [insertCount, setInsertCount] = useState(1);

  /* ── master data ── */
  const { sites: siteOptions, loading: sitesLoading } = useSiteOptions("Inventory", "Inward");
  const [transactionCategories, setTransactionCategories] = useState([]);
  const [parties,    setParties]    = useState([]);
  const [itemList,   setItemList]   = useState([]);
  const [intransitPOs, setIntransitPOs] = useState([]);

  /* ── computed IN/OUT WARD NO ── */
  const [inOutNo, setInOutNo] = useState("");

  const [form, setForm] = useState({
    transactionCategory: "",
    ginNo:               "",
    inOutDescription:    "",
    inOutType:           "Inward",
    poCpoNo:             "",
    ginDate:             "",
    partyCode:           "",
    partyName:           "",
    partyDoc:            "",
    manufacturerName:    "",
    manufacturerAddress: "",
    status:              "Open",
    challanInvoiceNo:    "",
    challanDate:         "",
    vehicleNo:           "",
    remarks:             "",
    site:                "",
  });

  const [items, setItems] = useState([blankItem(1)]);

  /* ── Set default dates ── */
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setForm((p) => ({ ...p, ginDate: today, challanDate: today }));
  }, []);

  /* ── Default site ── */
  useEffect(() => {
    if (siteOptions.length > 0 && !form.site) {
      setForm((p) => ({ ...p, site: siteOptions[0].siteCode }));
    }
  }, [siteOptions]);

  /* ── Fetch transaction categories ── */
  useEffect(() => {
    axios.get(`${API_URL}/api/transactions`)
      .then((res) => {
        setTransactionCategories(
          res.data.filter(
            (t) => t.module === "Inventory" && t.businessEntity === "Inward" && t.status === "Open"
          )
        );
      })
      .catch(console.error);
  }, []);

  /* ── Fetch parties ── */
  useEffect(() => {
    axios.get(`${API_URL}/api/parties`)
      .then((res) => setParties(res.data.filter((p) => p.status === "Active")))
      .catch(console.error);
  }, []);

  /* ── Fetch items ── */
  useEffect(() => {
    axios.get(`${API_URL}/api/items`)
      .then((res) => setItemList(res.data.filter((i) => i.status === "Active")))
      .catch(console.error);
  }, []);

  /* ── Fetch Intransit POs ── */
  useEffect(() => {
    axios.get(`${API_URL}/api/purchase-orders`)
      .then((res) => setIntransitPOs(res.data.filter((po) => po.status === "Intransit")))
      .catch(console.error);
  }, []);

  /* ── Pre-fill from PO if navigated with state ── */
  useEffect(() => {
    if (location.state?.fromPO) {
      const po = location.state.fromPO;
      setForm((f) => ({
        ...f,
        poCpoNo:   po.poNo   || "",
        partyCode: po.partyCode || "",
        partyName: po.partyName || "",
        site:      po.site   || f.site,
      }));
      if (po.items && po.items.length > 0) {
        setItems(
          po.items.map((it, idx) => ({
            sNo:       idx + 1,
            itemCode:  it.itemCode     || "",
            itemName:  it.itemName     || "",
            uom:       it.uom          || "",
            qty:       it.qty          || "",
            rate:      it.rate         ?? it.netAmount ?? "",
            _checked:  false,
          }))
        );
      }
    }
  }, [location.state]);

  /* ── Compute IN/OUT WARD NO when transaction category changes ── */
  useEffect(() => {
    if (!form.transactionCategory) { setInOutNo(""); return; }
    const cat = transactionCategories.find((t) => t._id === form.transactionCategory);
    if (!cat) { setInOutNo(""); return; }
    const prefix = cat.transactionCategoryCode.trim().toUpperCase();

    axios.get(`${API_URL}/api/document-sequence`)
      .then((res) => {
        const matching = res.data.filter(
          (r) => r.module === "Inventory" && r.businessEntity === "Inward" && r.entityPrefix === prefix
        );
        if (!matching.length) { setInOutNo(`${prefix}??? (Create document sequence first)`); return; }
        const last    = matching.reduce((a, b) => Number(a.incrementNo) > Number(b.incrementNo) ? a : b);
        const digits  = Math.max(1, Number(last.sequenceDigits) || 2);
        const nextNo  = Number(last.incrementNo) + 1;
        const date    = last.useDateFragment ? buildDatePart(last.sequenceFormat || "dd/mm/yy") : "";
        setInOutNo(`${prefix}${date}${String(nextNo).padStart(digits, "0")}`);
      })
      .catch(() => setInOutNo(""));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.transactionCategory, transactionCategories]);

  /* ── helpers for party typeahead ── */
  const partyNames = parties.map((p) => p.partyName).filter(Boolean);
  const partyCodes = parties.map((p) => p.partyCode).filter(Boolean);

  const handlePartyNameSelect = (name) => {
    const p = parties.find((x) => x.partyName === name);
    setForm((f) => ({ ...f, partyName: name, partyCode: p?.partyCode || "" }));
  };
  const handlePartyCodeSelect = (code) => {
    const p = parties.find((x) => x.partyCode === code);
    setForm((f) => ({ ...f, partyCode: code, partyName: p?.partyName || "" }));
  };

  /* ── PO selection handler — auto-fills form + items ── */
  const handlePOSelect = (poNo) => {
    setForm((f) => ({ ...f, poCpoNo: poNo }));
    if (!poNo) return;
    const po = intransitPOs.find((p) => p.poNo === poNo);
    if (!po) return;
    setForm((f) => ({
      ...f,
      poCpoNo:   po.poNo      || "",
      partyCode: po.partyCode || "",
      partyName: po.partyName || "",
      site:      po.site      || f.site,
    }));
    if (po.items && po.items.length > 0) {
      setItems(
        po.items.map((it, idx) => ({
          sNo:       idx + 1,
          itemCode:  it.itemCode  || "",
          itemName:  it.itemName  || "",
          uom:       it.uom       || "",
          qty:       it.qty       || "",
          rate:      it.rate      ?? it.netAmount ?? "",
          _checked:  false,
        }))
      );
    }
  };

  /* ── helpers for item typeahead in rows ── */
  const allItemCodes = itemList.map((i) => i.itemCode).filter(Boolean);
  const allItemNames = itemList.map((i) => i.itemName).filter(Boolean);

  const handleItemCodeSelect = (rowIdx, code) => {
    const found = itemList.find((i) => i.itemCode === code);
    setItems((prev) => {
      const next = [...prev];
      next[rowIdx] = {
        ...next[rowIdx],
        itemCode: code,
        itemName: found?.itemName || "",
        uom:      found?.uom      || "",
      };
      return next;
    });
  };
  const handleItemNameSelect = (rowIdx, name) => {
    const found = itemList.find((i) => i.itemName === name);
    setItems((prev) => {
      const next = [...prev];
      next[rowIdx] = {
        ...next[rowIdx],
        itemName: name,
        itemCode: found?.itemCode || "",
        uom:      found?.uom      || "",
      };
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  /* ── item row handlers ── */
  const handleItemChange = (rowIdx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [field]: value };
      return next;
    });
  };
  const handleItemCheck = (rowIdx, checked) => {
    setItems((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], _checked: checked };
      return next;
    });
  };
  const handleInsertRows = () => {
    const count = Math.max(1, Math.min(50, Number(insertCount) || 1));
    setItems((prev) => {
      const start = prev.length + 1;
      return [...prev, ...Array.from({ length: count }, (_, i) => blankItem(start + i))];
    });
  };
  const handleDeleteChecked = () => {
    setItems((prev) => prev.filter((r) => !r._checked).map((r, i) => ({ ...r, sNo: i + 1 })));
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!form.transactionCategory) { alert("Please select a Transaction Category"); return; }
    if (!form.ginDate)             { alert("Date is required");                     return; }

    const cat = transactionCategories.find((t) => t._id === form.transactionCategory);
    if (!cat) { alert("Invalid transaction category"); return; }
    const prefix = cat.transactionCategoryCode.trim().toUpperCase();

    try {
      setLoading(true);

      /* 1. Register sequence → get official number */
      const seqRes = await axios.post(`${API_URL}/api/create-document-sequence`, {
        module:              "Inventory",
        businessEntity:      "Inward",
        entityPrefix:        prefix,
        transactionCategory: cat.categoryDescription,
      });
      const officialNo = seqRes.data.generatedCode;

      /* 2. Clean items */
      const cleanItems = items
        .filter((r) => {
          const { sNo, _checked, ...rest } = r;
          return Object.values(rest).some((v) => String(v).trim() !== "");
        })
        .map(({ _checked, ...r }) => ({ ...r, qty: Number(r.qty) || 0, rate: Number(r.rate) || 0 }));

      /* 3. Save note */
      const payload = {
        ...form,
        ginNo:               officialNo,
        transactionCategory: cat.categoryDescription,
        items:               cleanItems,
      };

      const res = await axios.post(`${API_URL}/api/goods-inward-note`, payload);
      if (res.data.success) {
        alert("Inward Outward Note Saved Successfully");
        navigate("/inward-outward-note");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Save Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const anyChecked = items.some((r) => r._checked);

  return (
    <div className="cgin-page">
      <ModuleNavbar />

      {/* HEADER */}
      <div className="cgin-header">
        <div className="cgin-header-left">
          <button className="cgin-back-btn" onClick={() => navigate("/inward-outward-note")}>←</button>
          <h2>Create Inward Outward Note</h2>
        </div>
      </div>

      <div className="cgin-card">
        <div className="cgin-section-title">IN/OUT WARD INFORMATION</div>

        <div className="cgin-grid">

          {/* 1. TRANSACTION CATEGORY */}
          <div className="cgin-field">
            <label>* Transaction Category</label>
            <select name="transactionCategory" value={form.transactionCategory} onChange={handleChange}>
              <option value="">- Select -</option>
              {transactionCategories.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.transactionCategoryCode} — {t.categoryDescription}
                </option>
              ))}
            </select>
          </div>

          {/* 2. IN/OUT WARD NO */}
          <div className="cgin-field">
            <label>IN/OUT WARD NO</label>
            <input
              type="text"
              readOnly
              value={!form.transactionCategory ? "Select category first…" : inOutNo || "Generating…"}
              style={{ fontWeight: 600, letterSpacing: 1, color: "#15803d" }}
            />
          </div>

          {/* 3. IN/OUT DESCRIPTION */}
          <div className="cgin-field">
            <label>IN/OUT Description</label>
            <input
              type="text"
              name="inOutDescription"
              value={form.inOutDescription}
              onChange={handleChange}
              placeholder="Enter description"
            />
          </div>

          {/* 4. IN/OUT TYPE */}
          <div className="cgin-field">
            <label>IN/OUT Type</label>
            <select name="inOutType" value={form.inOutType} onChange={handleChange}>
              <option value="Inward">Inward</option>
              <option value="Outward">Outward</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* 5. PO NO — dropdown of Intransit POs with auto-fill */}
          <div className="cgin-field">
            <label>PO No (Intransit)</label>
            <select
              name="poCpoNo"
              value={form.poCpoNo}
              onChange={(e) => handlePOSelect(e.target.value)}
            >
              <option value="">- Select PO -</option>
              {intransitPOs.map((po) => (
                <option key={po._id} value={po.poNo}>
                  {po.poNo} — {po.partyName}
                </option>
              ))}
            </select>
          </div>

          {/* 6. DATE */}
          <div className="cgin-field">
            <label>* Date</label>
            <input type="date" name="ginDate" value={form.ginDate} onChange={handleChange} />
          </div>

          {/* 7. PARTY CODE — typeahead */}
          <div className="cgin-field">
            <label>Party Code</label>
            <TypeAhead
              value={form.partyCode}
              onChange={(v) => setForm((f) => ({ ...f, partyCode: v }))}
              suggestions={partyCodes}
              onSelect={handlePartyCodeSelect}
              placeholder="Type party code…"
            />
          </div>

          {/* 8. PARTY NAME — typeahead, auto-fills code */}
          <div className="cgin-field">
            <label>Party Name</label>
            <TypeAhead
              value={form.partyName}
              onChange={(v) => setForm((f) => ({ ...f, partyName: v }))}
              suggestions={partyNames}
              onSelect={handlePartyNameSelect}
              placeholder="Type party name…"
            />
          </div>

          {/* 9. PARTY DOC */}
          <div className="cgin-field">
            <label>Party Doc</label>
            <input
              type="text"
              name="partyDoc"
              value={form.partyDoc}
              onChange={handleChange}
              placeholder="Enter party document no."
            />
          </div>

          {/* 10. MFG NAME */}
          <div className="cgin-field">
            <label>Mfg. Name</label>
            <input
              type="text"
              name="manufacturerName"
              value={form.manufacturerName}
              onChange={handleChange}
              placeholder="Enter manufacturer name"
            />
          </div>

          {/* 11. MFG ADDRESS */}
          <div className="cgin-field">
            <label>Mfg. Address</label>
            <input
              type="text"
              name="manufacturerAddress"
              value={form.manufacturerAddress}
              onChange={handleChange}
              placeholder="Enter manufacturer address"
            />
          </div>

          {/* 12. STATUS */}
          <div className="cgin-field">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Open">Open</option>
              <option value="Weighted">Weighted</option>
              <option value="OutPending">OutPending</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* 13. CHALLAN NO */}
          <div className="cgin-field">
            <label>Challan / Invoice No</label>
            <input
              type="text"
              name="challanInvoiceNo"
              value={form.challanInvoiceNo}
              onChange={handleChange}
              placeholder="Enter challan / invoice no"
              className="inp-highlight"
            />
          </div>

          {/* 14. CHALLAN DATE */}
          <div className="cgin-field">
            <label>Challan Invoice Date</label>
            <input
              type="date"
              name="challanDate"
              value={form.challanDate}
              onChange={handleChange}
              className="inp-highlight"
            />
          </div>

          {/* 15. VEHICLE NO */}
          <div className="cgin-field">
            <label>Vehicle No</label>
            <input
              type="text"
              name="vehicleNo"
              value={form.vehicleNo}
              onChange={handleChange}
              placeholder="Enter vehicle no"
            />
          </div>

          {/* 16. SITE */}
          <div className="cgin-field">
            <label>Site</label>
            <select name="site" value={form.site} onChange={handleChange} disabled={sitesLoading}>
              <option value="">{sitesLoading ? "Loading…" : "- Select Site -"}</option>
              {siteOptions.map((s) => (
                <option key={s._id} value={s.siteCode}>{s.siteCode} — {s.siteName}</option>
              ))}
            </select>
          </div>

        </div>

        {/* REMARKS */}
        <div className="cgin-full-width" style={{ marginTop: 12 }}>
          <div className="cgin-field">
            <label>Remarks</label>
            <textarea
              rows="3"
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="Enter remarks…"
            />
          </div>
        </div>

        {/* ── ITEMS SECTION ── */}
        <div className="cgin-items-section">
          <div className="cgin-items-header">
            <span className="cgin-items-title">Items</span>
            {anyChecked && (
              <button className="cgin-del-rows-btn" onClick={handleDeleteChecked}>
                Delete Selected
              </button>
            )}
          </div>

          <div className="cgin-items-table-wrap">
            <table className="cgin-items-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>✓</th>
                  <th style={{ width: 50 }}>Sl No</th>
                  <th style={{ minWidth: 160 }}>Item Code</th>
                  <th style={{ minWidth: 200 }}>Item Name</th>
                  <th style={{ width: 90 }}>UOM</th>
                  <th style={{ width: 100 }}>Qty</th>
                  <th style={{ width: 110 }}>Rate (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx} className={row._checked ? "cgin-row-checked" : ""}>
                    <td className="cgin-check-cell">
                      <input
                        type="checkbox"
                        checked={row._checked}
                        onChange={(e) => handleItemCheck(idx, e.target.checked)}
                      />
                    </td>
                    <td className="cgin-sno-cell">{row.sNo}</td>

                    {/* Item Code typeahead */}
                    <td style={{ position: "relative" }}>
                      <TypeAhead
                        value={row.itemCode}
                        onChange={(v) => handleItemChange(idx, "itemCode", v)}
                        suggestions={allItemCodes}
                        onSelect={(v) => handleItemCodeSelect(idx, v)}
                        placeholder="Code…"
                        className="cgin-item-input"
                      />
                    </td>

                    {/* Item Name typeahead */}
                    <td style={{ position: "relative" }}>
                      <TypeAhead
                        value={row.itemName}
                        onChange={(v) => handleItemChange(idx, "itemName", v)}
                        suggestions={allItemNames}
                        onSelect={(v) => handleItemNameSelect(idx, v)}
                        placeholder="Name…"
                        className="cgin-item-input cgin-item-wide"
                      />
                    </td>

                    {/* UOM — auto-filled, editable */}
                    <td>
                      <input
                        type="text"
                        className="cgin-item-input cgin-item-sm"
                        value={row.uom}
                        onChange={(e) => handleItemChange(idx, "uom", e.target.value)}
                        placeholder="MT"
                      />
                    </td>

                    {/* Qty */}
                    <td>
                      <input
                        type="number"
                        className="cgin-item-input cgin-item-num"
                        value={row.qty}
                        onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </td>

                    {/* Rate — pre-filled from PO, editable */}
                    <td>
                      <input
                        type="number"
                        className="cgin-item-input cgin-item-num"
                        value={row.rate}
                        onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Insert Rows bar */}
          <div className="cgin-insert-row-bar">
            <input
              type="number"
              min="1"
              max="50"
              className="cgin-insert-count"
              value={insertCount}
              onChange={(e) => setInsertCount(e.target.value)}
            />
            <button className="cgin-insert-row-btn" onClick={handleInsertRows}>
              Insert Row
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="cgin-actions">
          <button className="btn-cancel" onClick={() => navigate("/inward-outward-note")} disabled={loading}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Typeahead dropdown styles injected inline */}
      <style>{`
        .cgin-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          max-height: 180px;
          overflow-y: auto;
          z-index: 999;
          margin: 0;
          padding: 0;
          list-style: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .cgin-suggestions li {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          color: #1e293b;
        }
        .cgin-suggestions li:hover {
          background: #f0f9ff;
          color: #0369a1;
        }
      `}</style>
    </div>
  );
};

export default CreateGIN;