import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";
// import "./ItemConversion.css";

/* ── TypeAhead (plain string list — used for header item code) ── */
const TypeAhead = ({ value, onChange, suggestions, onSelect, placeholder, className }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = suggestions.filter(
    (s) => !value || s?.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 10);
  return (
    <div style={{ position: "relative", width: "100%" }} ref={ref}>
      <input
        type="text"
        className={className || "ic-input"}
        style={{ width: "100%", boxSizing: "border-box" }}
        value={value}
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {show && filtered.length > 0 && (
        <ul className="ic-suggestions">
          {filtered.map((s, i) => (
            <li key={i} onMouseDown={() => { onSelect(s); setShow(false); }}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   ItemTypeAhead — searches full item objects by name OR code.
   Dropdown shows: ItemName  (ItemCode · UOM)
   onSelectItem(item) gives the full item object to the caller.
───────────────────────────────────────────────────────────────── */
const ItemTypeAhead = ({ value, onChange, items, onSelectItem, placeholder, className }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = items.filter((item) => {
    if (!value) return true;
    const q = value.toLowerCase();
    return (
      item.itemName?.toLowerCase().includes(q) ||
      item.itemCode?.toLowerCase().includes(q)
    );
  }).slice(0, 12);

  return (
    <div style={{ position: "relative", width: "100%" }} ref={ref}>
      <input
        type="text"
        className={className || "ic-item-input"}
        style={{ width: "100%", boxSizing: "border-box" }}
        value={value}
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        placeholder={placeholder || "Type to search item…"}
        autoComplete="off"
      />
      {show && filtered.length > 0 && (
        <ul className="ic-suggestions" style={{ zIndex: 9999 }}>
          {filtered.map((item, i) => (
            <li
              key={item._id || i}
              onMouseDown={() => { onSelectItem(item); setShow(false); }}
              style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}
            >
              <span>{item.itemName}</span>
              <span style={{ opacity: 0.55, fontSize: "0.82em", whiteSpace: "nowrap" }}>
                {item.itemCode}{item.uom ? ` · ${item.uom}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ── Blank conversion row ── */
const blankRow = (sNo, prevUom = "") => ({
  sNo,
  inventoryName: "",
  inventoryCode: "",
  uom: prevUom,   // carry forward UOM from previous row
  raQty: "",      // manual entry
  rate: "",       // manual entry
  amount: 0,      // raQty * rate (auto-calculated)
});

const CreateItemConversion = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);

  /* ── master data ── */
  const [itemList, setItemList] = useState([]);   // full item objects from Item Master

  /* ── form header ── */
  const [icNo,           setIcNo]           = useState("");
  const [conversionDate, setConversionDate] = useState("");
  const [poNo,           setPoNo]           = useState("");
  const [vehicleNo,      setVehicleNo]      = useState("");
  const [partyName,      setPartyName]      = useState("");
  const [partyCode,      setPartyCode]      = useState("");
  const [ginId,          setGinId]          = useState("");
  const [remarks,        setRemarks]        = useState("");

  /* ── base item ── */
  const [itemCode,        setItemCode]        = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [baseQty,         setBaseQty]         = useState("");
  const [baseRate,        setBaseRate]        = useState(0);
  const [uom,             setUom]             = useState("");

  /* ── conversion rows ── */
  const [rows, setRows] = useState([blankRow(1)]);

  /* ── derived totals (auto from bifurcation rows) ── */
  const totalRaQty  = rows.reduce((s, r) => s + (Number(r.raQty)  || 0), 0);
  const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  /* ── Fetch ALL active items from Item Master ── */
  useEffect(() => {
    axios.get(`${API_URL}/api/items`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        // Keep all items (Active filter — keep if no status field too)
        const active = data.filter((i) => !i.status || i.status === "Active");
        setItemList(active);
      })
      .catch(console.error);
  }, []);

  /* ── Generate IC No ── */
  useEffect(() => {
    axios.get(`${API_URL}/api/item-conversion/next-sequence`)
      .then((res) => {
        if (res.data.success) setIcNo(res.data.nextCode);
        else setIcNo("IC??? (Create document sequence first)");
      })
      .catch(() => setIcNo("IC??? (Create document sequence first)"));
  }, []);

  /* ── Default today ── */
  useEffect(() => {
    setConversionDate(new Date().toISOString().split("T")[0]);
  }, []);

  const ginRateRef = useRef(0);

  /* ── Pre-fill from GIN ── */
  useEffect(() => {
    if (!location.state?.fromGIN) return;
    const gin = location.state.fromGIN;
    setGinId(gin._id    || "");
    setPoNo(gin.poCpoNo || "");
    setVehicleNo(gin.vehicleNo || "");
    setPartyName(gin.partyName || "");
    setPartyCode(gin.partyCode || "");

    if (!gin.items || gin.items.length === 0) return;
    const first = gin.items[0];
    setItemCode(first.itemCode || "");
    setItemDescription(first.itemName || "");
    setBaseQty(first.qty || "");
    setUom(first.uom || "");

    const savedRate = Number(first.rate) || 0;
    if (savedRate > 0) {
      ginRateRef.current = savedRate;
      setBaseRate(savedRate);
      return;
    }

    if (gin.poCpoNo) {
      axios.get(`${API_URL}/api/purchase-orders`)
        .then((res) => {
          const allPOs = Array.isArray(res.data) ? res.data : [];
          const po = allPOs.find((p) => p.poNo === gin.poCpoNo);
          if (!po) return;
          const poItem = po.items?.find(
            (it) => it.itemCode === first.itemCode || it.itemName === first.itemName
          );
          if (!poItem) return;
          const poRate = Number(poItem.rate || poItem.netAmount || 0);
          if (poRate > 0) {
            ginRateRef.current = poRate;
            setBaseRate(poRate);
          }
        })
        .catch(console.error);
    }
  }, [location.state]); // eslint-disable-line

  /* ── When itemCode changes (header), auto-fill description + UOM ── */
  useEffect(() => {
    if (!itemCode) { setBaseRate(0); ginRateRef.current = 0; return; }
    if (ginRateRef.current > 0) { setBaseRate(ginRateRef.current); return; }
    const found = itemList.find((i) => i.itemCode === itemCode || i.itemName === itemCode);
    if (found) {
      setBaseRate(Number(found.rate || found.baseRate || found.price || 0));
      setItemDescription((prev) => prev || found.itemName || "");
      setUom((prev) => prev || found.uom || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCode, itemList]);

  /* ── Row handlers ── */

  // Called when user selects an item from the ItemTypeAhead dropdown in a row
  const handleRowItemSelect = (idx, item) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        inventoryName: item.itemName || "",
        inventoryCode: item.itemCode || "",
        uom:           item.uom      || "",   // ← directly from item object, always correct
        // rate stays as manual entry — do NOT touch it
      };
      // Recalculate amount with existing rate
      next[idx].amount = (Number(next[idx].raQty) || 0) * (Number(next[idx].rate) || 0);
      return next;
    });
  };

  // Called when user types in the item name field (before selecting)
  const handleRowItemTyping = (idx, typedValue) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        inventoryName: typedValue,
        // Clear code/uom if user is editing manually (not from a select)
        inventoryCode: "",
        uom:           next[idx].uom, // keep existing uom while typing
      };
      return next;
    });
  };

  const updateRow = (idx, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };

      // When raQty changes, recalculate amount
      if (field === "raQty") {
        next[idx].amount = (Number(value) || 0) * (Number(next[idx].rate) || 0);
      }

      // When rate changes (manual), recalculate amount immediately
      if (field === "rate") {
        next[idx].amount = (Number(next[idx].raQty) || 0) * (Number(value) || 0);
      }

      return next;
    });
  };

  // Add row — carry forward UOM from the last existing row
  const addRow = () =>
    setRows((prev) => {
      const lastUom = prev.length > 0 ? (prev[prev.length - 1].uom || "") : "";
      return [...prev, blankRow(prev.length + 1, lastUom)];
    });

  const deleteRow = (idx) =>
    setRows((prev) =>
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, sNo: i + 1 }))
    );

  /* ── Item code helpers (for header TypeAhead) ── */
  const itemCodes = itemList.map((i) => i.itemCode).filter(Boolean);

  const handleItemCodeSelect = (code) => {
    setItemCode(code);
    ginRateRef.current = 0;
    const found = itemList.find((i) => i.itemCode === code);
    if (found) {
      setItemDescription(found.itemName || "");
      setUom(found.uom || "");
      setBaseRate(Number(found.rate || found.baseRate || found.price || 0));
    }
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!itemCode)       { alert("Item Code is required"); return; }
    if (!conversionDate) { alert("Conversion Date is required"); return; }

    const payload = {
      icNo,
      ginId,
      poNo,
      vehicleNo,
      partyName,
      partyCode,
      itemCode,
      itemDescription,
      baseQty:    Number(baseQty)    || 0,
      baseRate,
      uom,
      conversionDate,
      remarks,
      totalRaQty,
      totalAmount,
      totalRate: totalAmount,
      conversionRows: rows.map((r) => ({
        sNo:           r.sNo,
        inventoryName: r.inventoryName,
        inventoryCode: r.inventoryCode || "",
        uom:           r.uom,
        raQty:         Number(r.raQty)  || 0,
        rate:          Number(r.rate)   || 0,
        amount:        Number(r.amount) || 0,
        cQty: Number(baseQty) || 0,
        rQty: Number(r.raQty) || 0,
      })),
    };

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/item-conversion`, payload);
      if (res.data.success) {
        alert("Item Conversion Saved Successfully");
        navigate("/item-conversion");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Save Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ic-page">
      <ModuleNavbar />

      {/* HEADER */}
      <div className="ic-topbar">
        <div className="ic-topbar-left">
          <button className="ic-back-btn" onClick={() => navigate("/item-conversion")}>← Back</button>
          <div>
            <h2>Create Item Conversion</h2>
            <span className="ic-topbar-sub">Fill in details and save</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: CONVERSION INFORMATION ── */}
      <div className="ic-card">
        <div className="ic-card-title">
          <span className="ic-card-icon">📋</span> Conversion Information
        </div>
        <div className="ic-form-grid">
          <div className="ic-field">
            <label>IC No</label>
            <input type="text" readOnly value={icNo || "Generating…"} className="ic-readonly ic-mono" />
          </div>
          <div className="ic-field">
            <label>* Conversion Date</label>
            <input type="date" value={conversionDate} onChange={(e) => setConversionDate(e.target.value)} />
          </div>
          <div className="ic-field">
            <label>PO No</label>
            <input type="text" value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="PO reference…" />
          </div>
          <div className="ic-field">
            <label>Vehicle No</label>
            <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="Vehicle number…" />
          </div>
          <div className="ic-field">
            <label>Party Name</label>
            <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Party name…" />
          </div>
          <div className="ic-field ic-field-full">
            <label>Remarks</label>
            <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter remarks…" />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: BASE ITEM ── */}
      <div className="ic-card">
        <div className="ic-card-title">
          <span className="ic-card-icon">📦</span> Base Item
        </div>

        <div className="ic-base-item-grid">
          {/* Row 1: Item Code | Item Name */}
          <div className="ic-field">
            <label>* Item Code</label>
            <TypeAhead
              value={itemCode}
              onChange={setItemCode}
              suggestions={itemCodes}
              onSelect={handleItemCodeSelect}
              placeholder="Type item code…"
            />
          </div>
          <div className="ic-field">
            <label>Item Name</label>
            <input
              type="text"
              value={itemDescription}
              readOnly
              className="ic-readonly"
              placeholder="Auto-filled from item master"
            />
          </div>

          {/* Row 2: CQty | RQty (auto) | Amount (auto) */}
          <div className="ic-field">
            <label>CQty (Base Qty)</label>
            <input
              type="number"
              value={baseQty}
              onChange={(e) => setBaseQty(e.target.value)}
              placeholder="Enter base qty"
              min="0"
            />
          </div>
          <div className="ic-field">
            <label>RQty <span className="ic-auto-badge">Auto</span></label>
            <input
              type="text"
              value={totalRaQty > 0 ? totalRaQty.toLocaleString("en-IN") : "—"}
              readOnly
              className="ic-readonly ic-auto-green"
              title="Sum of all RaQty from bifurcation rows"
            />
          </div>
          <div className="ic-field">
            <label>Amount <span className="ic-auto-badge">Auto</span></label>
            <input
              type="text"
              value={totalAmount > 0 ? `₹ ${totalAmount.toLocaleString("en-IN")}` : "—"}
              readOnly
              className="ic-readonly ic-auto-green"
              title="Sum of all amounts from bifurcation rows"
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
            Total Amount: <strong>₹ {totalAmount.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="ic-conv-table-wrap">
          <table className="ic-conv-table">
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>S No</th>
                <th>Item Name</th>
                <th>UOM</th>
                <th>RaQty</th>
                <th>Rate (₹)</th>
                <th>Amount (₹)</th>
                <th>Del</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "ic-row-even" : "ic-row-odd"}>
                  <td className="ic-sno">{row.sNo}</td>

                  {/* Item Name — ItemTypeAhead searches full item objects */}
                  <td style={{ overflow: "visible", position: "relative" }}>
                    <ItemTypeAhead
                      value={row.inventoryName}
                      onChange={(v) => handleRowItemTyping(idx, v)}
                      items={itemList}
                      onSelectItem={(item) => handleRowItemSelect(idx, item)}
                      placeholder="Search item name or code…"
                      className="ic-item-input"
                    />
                  </td>

                  {/* UOM — auto-filled from item master on selection */}
                  <td>
                    <input
                      type="text"
                      className="ic-item-input ic-readonly"
                      readOnly
                      value={row.uom || ""}
                      placeholder="—"
                      title="Auto-filled from Item Master"
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </td>

                  {/* RaQty — manual */}
                  <td>
                    <input
                      type="number"
                      className="ic-item-input ic-num"
                      style={{ width: "100%", boxSizing: "border-box" }}
                      value={row.raQty}
                      onChange={(e) => updateRow(idx, "raQty", e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </td>

                  {/* Rate — manual entry, amount auto-calculates on change */}
                  <td>
                    <input
                      type="number"
                      className="ic-item-input ic-num"
                      style={{ width: "100%", boxSizing: "border-box" }}
                      value={row.rate}
                      onChange={(e) => updateRow(idx, "rate", e.target.value)}
                      placeholder="Enter rate"
                      min="0"
                      step="0.01"
                    />
                  </td>

                  {/* Amount — auto: raQty × rate */}
                  <td className="ic-amount-cell">
                    {Number(row.amount || 0).toLocaleString("en-IN")}
                  </td>

                  <td>
                    <button
                      className="ic-del-row-btn"
                      onClick={() => deleteRow(idx)}
                      title="Remove row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="ic-total-label">Total</td>
                <td className="ic-total-qty">{totalRaQty.toLocaleString("en-IN")}</td>
                <td />
                <td className="ic-total-val">₹ {totalAmount.toLocaleString("en-IN")}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="ic-conv-actions">
          <button className="ic-add-row-btn" onClick={addRow}>+ Add Row</button>
        </div>
      </div>

      {/* SAVE / CANCEL */}
      <div className="ic-page-actions">
        <button className="ic-cancel-btn" onClick={() => navigate("/item-conversion")} disabled={loading}>
          Cancel
        </button>
        <button className="ic-save-btn" onClick={handleSave} disabled={loading}>
          {loading ? "Saving…" : "💾 Save"}
        </button>
      </div>
    </div>
  );
};

export default CreateItemConversion;