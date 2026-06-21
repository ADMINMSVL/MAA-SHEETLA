import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./Createdirectgrn.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const GRN_API = `${API_URL}/api/direct-grn`;
const WEIGHMENT_API = `${API_URL}/api/weighment`;
const DIRECT_GRN_MODULE = "Inventory";
const DIRECT_GRN_ENTITY = "GRN";
const today = new Date().toISOString().split("T")[0];

const blankItem = (sNo) => ({
  sNo,
  itemCode: "",
  itemName: "",
  uom: "",
  qty: "",
  rate: "",
  totalAmount: "",
  _checked: false,
});

const blankCharge = (sNo) => ({
  sNo,
  code: "",
  description: "",
  addOrSubtract: "",
  amount: "",
  _checked: false,
});

const defaultForm = () => ({
  grnNo: "",
  status: "Open",
  grnDate: today,
  grnDescription: "",
  grnType: "F and A Impact",
  transactionCategory: "",
  site: "",
  challanInvoiceNo: "",
  challanDate: today,
  vendorCode: "",
  vendorName: "",
  vehicleNo: "",
  linkedGinNo: "",
  remarks: "",
});

const CreateDirectGRN = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const fromWeight = !!location.state?.fromWeight;
  const isDetail = !!id;

  const [form, setForm] = useState(defaultForm());
  const [items, setItems] = useState([blankItem(1)]);
  const [charges, setCharges] = useState([blankCharge(1)]);
  const [insertCount, setInsertCount] = useState(1);
  const [chargeInsertCount, setChargeInsertCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const [sites, setSites] = useState([]);
  const [txCategories, setTxCategories] = useState([]);
  const [itemMaster, setItemMaster] = useState([]);
  const [chargeMaster, setChargeMaster] = useState([]);
  const [weighments, setWeighments] = useState([]);
  const [weightLoading, setWeightLoading] = useState(false);
  const [selectedWeightId, setSelectedWeightId] = useState("");
  const [showCharges, setShowCharges] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const canEdit = !isDetail || editMode;

  /* fromWeight + not editing an existing record => show the weighment
     picker first; user lands on the actual create form only after
     choosing a weighment (or immediately for a plain "Create DGRN"). */
  const [viewMode, setViewMode] = useState(fromWeight && !isDetail ? "list" : "form");
  const [previewGrnNo, setPreviewGrnNo] = useState("");

  useEffect(() => {
    axios.get(`${API_URL}/api/sites`)
      .then((res) => setSites((Array.isArray(res.data) ? res.data : []).filter((s) => s.status !== "Inactive")))
      .catch(() => setSites([]));

    axios.get(`${API_URL}/api/transactions`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setTxCategories(list.filter((tx) =>
          tx.module === DIRECT_GRN_MODULE &&
          tx.businessEntity === DIRECT_GRN_ENTITY &&
          (tx.status || "").toLowerCase() === "open"
        ));
      })
      .catch(() => setTxCategories([]));

    axios.get(`${API_URL}/api/items`)
      .then((res) => setItemMaster((Array.isArray(res.data) ? res.data : []).filter((it) => it.status !== "Inactive")))
      .catch(() => setItemMaster([]));

    axios.get(`${API_URL}/api/charges-master`)
      .then((res) => setChargeMaster((Array.isArray(res.data) ? res.data : []).filter((ch) => ch.status !== "Inactive")))
      .catch(() => setChargeMaster([]));
  }, []);

  useEffect(() => {
    if (!isDetail) return;
    const loadRecord = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${GRN_API}/${id}`);
        const data = res.data?.data || res.data;
        setForm({ ...defaultForm(), ...data });
        setItems(Array.isArray(data.items) && data.items.length > 0
          ? data.items.map((item, idx) => ({ ...blankItem(idx + 1), ...item, sNo: idx + 1, _checked: false }))
          : [blankItem(1)]);
        setCharges(Array.isArray(data.charges) && data.charges.length > 0
          ? data.charges.map((charge, idx) => ({ ...blankCharge(idx + 1), ...charge, sNo: idx + 1, _checked: false }))
          : [blankCharge(1)]);
        setShowCharges(Array.isArray(data.charges) && data.charges.length > 0);
      } catch (err) {
        console.error(err);
        alert("Failed to load Direct GRN");
        navigate("/direct-grn");
      } finally {
        setLoading(false);
      }
    };
    loadRecord();
  }, [id, isDetail, navigate]);

  useEffect(() => {
    if (!fromWeight) return;
    const loadWeighments = async () => {
      setWeightLoading(true);
      try {
        const res = await axios.get(WEIGHMENT_API);
        setWeighments((res.data?.data || []).filter((row) => (row.status || "").toLowerCase() !== "closed"));
      } catch (err) {
        console.error(err);
        setWeighments([]);
      } finally {
        setWeightLoading(false);
      }
    };
    loadWeighments();
  }, [fromWeight]);

  useEffect(() => {
    if (isDetail) return;
    axios
      .get(`${GRN_API}/preview-grn-no`, { params: { transactionCategory: form.transactionCategory || "" } })
      .then((res) => setPreviewGrnNo(res.data?.grnNo || ""))
      .catch(() => setPreviewGrnNo(""));
  }, [isDetail, form.transactionCategory]);

  useEffect(() => {
    if (sites.length > 0 && !form.site) {
      const site = sites[0];
      setForm((prev) => ({ ...prev, site: site.siteCode || site.siteName || "" }));
    }
  }, [sites, form.site]);

  const itemNameOptions = useMemo(() => itemMaster.map((it) => it.itemName).filter(Boolean), [itemMaster]);
  const itemCodeOptions = useMemo(() => itemMaster.map((it) => it.itemCode).filter(Boolean), [itemMaster]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (!canEdit) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectWeighment = async (weighment) => {
    setSelectedWeightId(weighment._id);
    setWeightLoading(true);
    try {
      const res = await axios.get(`${WEIGHMENT_API}/${weighment._id}`);
      const full = res.data?.data || weighment;

      setForm((prev) => ({
        ...prev,
        grnDate: full.weighmentDate || prev.grnDate,
        grnDescription: full.description || `From weighment ${full.weighmentNo || ""}`,
        transactionCategory: full.transactionCategory || prev.transactionCategory,
        site: full.site || prev.site,
        challanInvoiceNo: full.supplierInvoiceNo || full.billNo || prev.challanInvoiceNo,
        challanDate: full.supplierInvoiceDate || full.challanDate || prev.challanDate,
        vendorCode: full.vendorCode || prev.vendorCode,
        vendorName: full.vendorName || full.partyName || prev.vendorName,
        vehicleNo: full.vehicleNo || prev.vehicleNo,
        linkedGinNo: full.inwardOutwardNoteNo || full.weighmentNo || prev.linkedGinNo,
        remarks: full.remarks || prev.remarks,
      }));

      const sourceItems = Array.isArray(full.items) && full.items.length > 0
        ? full.items
        : [{
            itemCode: "",
            itemName: "",
            uom: "",
            netWeight: full.netWeight || "",
          }];

      setItems(sourceItems.map((item, idx) => ({
        sNo: idx + 1,
        itemCode: item.itemCode || "",
        itemName: item.itemName || "",
        uom: item.uom || "",
        qty: item.netWeight || "",
        rate: "",
        totalAmount: "",
        _checked: false,
      })));

      setViewMode("form");
    } catch (err) {
      console.error(err);
      alert("Failed to fetch weighment details. Please try again.");
    } finally {
      setWeightLoading(false);
    }
  };

  const handleItemChange = (idx, field, value) => {
    if (!canEdit) return;
    setItems((prev) => {
      const next = [...prev];
      const row = { ...next[idx], [field]: value };
      if (field === "qty" || field === "rate") {
        const qty = Number(field === "qty" ? value : row.qty) || 0;
        const rate = Number(field === "rate" ? value : row.rate) || 0;
        row.totalAmount = qty && rate ? String(qty * rate) : "";
      }
      next[idx] = row;
      return next;
    });
  };

  const fillItemFromMaster = (idx, field, value) => {
    const found = itemMaster.find((it) => it[field] === value);
    setItems((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [field]: value,
        itemCode: found?.itemCode || next[idx].itemCode || "",
        itemName: found?.itemName || next[idx].itemName || "",
        uom: found?.uom || next[idx].uom || "",
      };
      return next;
    });
  };

  const handleItemCheck = (idx, checked) => {
    if (!canEdit) return;
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], _checked: checked };
      return next;
    });
  };

  const handleInsertRows = () => {
    if (!canEdit) return;
    const count = Math.max(1, Math.min(50, Number(insertCount) || 1));
    setItems((prev) => [
      ...prev,
      ...Array.from({ length: count }, (_, i) => blankItem(prev.length + i + 1)),
    ]);
  };

  const handleDeleteChecked = () => {
    if (!canEdit) return;
    setItems((prev) => prev.filter((row) => !row._checked).map((row, idx) => ({ ...row, sNo: idx + 1 })));
  };

  const handleChargeChange = (idx, field, value) => {
    if (!canEdit) return;
    setCharges((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const selectCharge = (idx, code) => {
    if (!canEdit) return;
    const found = chargeMaster.find((charge) => charge.code === code);
    setCharges((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        code,
        description: found?.details || "",
        addOrSubtract: found?.addOrSubtract || "",
      };
      return next;
    });
  };

  const handleChargeCheck = (idx, checked) => {
    if (!canEdit) return;
    setCharges((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], _checked: checked };
      return next;
    });
  };

  const handleInsertCharges = () => {
    if (!canEdit) return;
    const count = Math.max(1, Math.min(50, Number(chargeInsertCount) || 1));
    setCharges((prev) => [
      ...prev,
      ...Array.from({ length: count }, (_, i) => blankCharge(prev.length + i + 1)),
    ]);
  };

  const handleDeleteCharges = () => {
    if (!canEdit) return;
    setCharges((prev) => prev.filter((row) => !row._checked).map((row, idx) => ({ ...row, sNo: idx + 1 })));
  };

  const handleSave = async (asDraft = false) => {
    if (!form.grnDate) { alert("Date is required"); return; }
    if (!form.transactionCategory) { alert("Transaction Category is required"); return; }
    if (!form.site) { alert("Site is required"); return; }

    const cleanItems = items
      .filter(({ sNo, _checked, ...rest }) => Object.values(rest).some((value) => String(value ?? "").trim() !== ""))
      .map(({ _checked, ...row }) => row);

    const cleanCharges = charges
      .filter(({ sNo, _checked, ...rest }) => Object.values(rest).some((value) => String(value ?? "").trim() !== ""))
      .map(({ _checked, ...row }) => row);

    try {
      setLoading(true);
      const payload = {
        ...form,
        status: asDraft ? "Draft" : form.status,
        items: cleanItems,
        charges: cleanCharges,
      };
      const res = isDetail
        ? await axios.put(`${GRN_API}/${id}`, payload)
        : await axios.post(GRN_API, payload);
      if (res.data?.success) {
        alert(asDraft ? "Saved as Draft" : "Direct GRN Saved Successfully");
        navigate("/direct-grn");
      } else {
        alert(res.data?.message || "Save failed");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Save Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const anyItemsChecked = items.some((row) => row._checked);
  const anyChargesChecked = charges.some((row) => row._checked);
  const itemsTotal = items.reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0);
  const chargesTotal = charges.reduce((sum, row) => {
    const amount = Number(row.amount) || 0;
    return row.addOrSubtract === "Subtraction" ? sum - amount : sum + amount;
  }, 0);
  const grandTotal = itemsTotal + chargesTotal;

  /* ── Step 1 of the "Create From Weight" flow: a standalone page that
     just lists open/draft weighments. Picking one fetches its full
     record and only then takes the user to the create form below. ── */
  if (fromWeight && !isDetail && viewMode === "list") {
    return (
      <div className="cdgrn-page">
        <ModuleNavbar />

        <div className="cdgrn-page-header">
          <button className="cdgrn-back-btn" onClick={() => navigate("/direct-grn")}>←</button>
          <h2>Select Weighment for Direct GRN</h2>
        </div>

        <div className="cdgrn-card">
          <div className="cdgrn-section-label">Open Weighments (Closed records are hidden)</div>
          {weightLoading && <div className="cdgrn-placeholder">Loading weighments...</div>}
          {!weightLoading && weighments.length === 0 && <div className="cdgrn-placeholder">No weighment records found</div>}
          {!weightLoading && weighments.length > 0 && (
            <div className="cdgrn-gin-table-wrap">
              <table className="cdgrn-gin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Weighment No</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Party</th>
                    <th>Vehicle</th>
                    <th>Net Weight</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weighments.map((weight, idx) => (
                    <tr
                      key={weight._id}
                      className="cdgrn-gin-row"
                      onClick={() => selectWeighment(weight)}
                    >
                      <td>{idx + 1}</td>
                      <td><strong>{weight.weighmentNo || "-"}</strong></td>
                      <td>{weight.weighmentDate || "-"}</td>
                      <td>{weight.transactionType || "-"}</td>
                      <td>{weight.vendorName || weight.partyName || "-"}</td>
                      <td>{weight.vehicleNo || "-"}</td>
                      <td>{weight.netWeight || "-"}</td>
                      <td>{weight.status || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="cdgrn-page">
      <ModuleNavbar />

      <div className="cdgrn-page-header">
        <button
          className="cdgrn-back-btn"
          onClick={() => (fromWeight && !isDetail ? setViewMode("list") : navigate("/direct-grn"))}
        >
          ←
        </button>
        <h2>{isDetail ? "Direct GRN Detail" : fromWeight ? "Create Direct GRN From Weight" : "Create Direct GRN"}</h2>
        {isDetail && (!editMode ? (
          <button className="cdgrn-submit-btn" type="button" onClick={() => setEditMode(true)}>Edit</button>
        ) : (
          <button className="cdgrn-cancel-btn" type="button" onClick={() => setEditMode(false)}>Viewing</button>
        ))}
      </div>

      <div className="cdgrn-card">
        {form.linkedGinNo && (
          <div className="cdgrn-linked-banner">
            Linked reference: <strong>{form.linkedGinNo}</strong>
          </div>
        )}

        <div className="cdgrn-section-label">Direct GRN Header</div>
        <div className="cdgrn-main-grid">
          <div className="cdgrn-fg">
            <label>Date *</label>
            <input type="date" name="grnDate" value={form.grnDate} onChange={handleChange} readOnly={!canEdit} />
          </div>

          <div className="cdgrn-fg">
            <label>GRN No *</label>
            <input
              name="grnNo"
              value={isDetail ? form.grnNo : (previewGrnNo ? `${previewGrnNo}` : "Generated on save")}
              readOnly
              className="cdgrn-readonly"
            />
          </div>

          <div className="cdgrn-fg">
            <label>GRN Description</label>
            <input name="grnDescription" value={form.grnDescription} onChange={handleChange} readOnly={!canEdit} />
          </div>

          <div className="cdgrn-fg">
            <label>GRN Type</label>
            <select name="grnType" value={form.grnType} onChange={handleChange} disabled={!canEdit}>
              <option>F and A Impact</option>
              <option>Domestic</option>
              <option>International</option>
              <option>No Impact</option>
            </select>
          </div>

          <div className="cdgrn-fg">
            <label>Transaction Category *</label>
            <select name="transactionCategory" value={form.transactionCategory} onChange={handleChange} disabled={!canEdit || isDetail}>
              <option value="">Select</option>
              {form.transactionCategory && !txCategories.some((tx) => tx.categoryDescription === form.transactionCategory) && (
                <option value={form.transactionCategory}>{form.transactionCategory}</option>
              )}
              {txCategories.map((tx) => (
                <option key={tx._id} value={tx.categoryDescription}>
                  {tx.transactionCategoryCode} - {tx.categoryDescription}
                </option>
              ))}
            </select>
          </div>

          <div className="cdgrn-fg">
            <label>Site *</label>
            <select name="site" value={form.site} onChange={handleChange} disabled={!canEdit}>
              <option value="">Select</option>
              {sites.map((site) => (
                <option key={site._id} value={site.siteCode || site.siteName}>
                  {site.siteCode || site.siteName}
                  {site.siteName ? ` - ${site.siteName}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="cdgrn-fg">
            <label>Inv / Challan No</label>
            <input name="challanInvoiceNo" value={form.challanInvoiceNo} onChange={handleChange} readOnly={!canEdit} />
          </div>

          <div className="cdgrn-fg">
            <label>Inv / Challan Date</label>
            <input type="date" name="challanDate" value={form.challanDate} onChange={handleChange} readOnly={!canEdit} />
          </div>

          <div className="cdgrn-fg">
            <label>Vendor Code</label>
            <input name="vendorCode" value={form.vendorCode} onChange={handleChange} readOnly={!canEdit} />
          </div>

          <div className="cdgrn-fg">
            <label>Vendor Name</label>
            <input name="vendorName" value={form.vendorName} onChange={handleChange} readOnly={!canEdit} />
          </div>

          <div className="cdgrn-fg">
            <label>Vehicle No</label>
            <input name="vehicleNo" value={form.vehicleNo} onChange={handleChange} readOnly={!canEdit} />
          </div>

          <div className="cdgrn-fg">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange} disabled={!canEdit}>
              <option>Open</option>
              <option>Closed</option>
              <option>Draft</option>
            </select>
          </div>
        </div>
      </div>

      <div className="cdgrn-card">
        <div className="cdgrn-items-header">
          <span className="cdgrn-items-title">Items</span>
          {anyItemsChecked && <button className="cdgrn-del-rows-btn" onClick={handleDeleteChecked}>Delete Selected</button>}
        </div>

        <div className="cdgrn-items-table-wrap">
          <table className="cdgrn-items-table">
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Del</th>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>UOM</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={idx} className={row._checked ? "cdgrn-row-checked" : ""}>
                  <td className="cdgrn-sno">{row.sNo}</td>
                  <td className="cdgrn-check-cell">
                    <input type="checkbox" checked={!!row._checked} onChange={(e) => handleItemCheck(idx, e.target.checked)} />
                  </td>
                  <td>
                    <input
                      className="cdgrn-item-input"
                      list="cdgrn-item-codes"
                      value={row.itemCode}
                      onChange={(e) => handleItemChange(idx, "itemCode", e.target.value)}
                      onBlur={() => fillItemFromMaster(idx, "itemCode", row.itemCode)}
                      readOnly={!canEdit}
                    />
                  </td>
                  <td>
                    <input
                      className="cdgrn-item-input cdgrn-item-wide"
                      list="cdgrn-item-names"
                      value={row.itemName}
                      onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                      onBlur={() => fillItemFromMaster(idx, "itemName", row.itemName)}
                      readOnly={!canEdit}
                    />
                  </td>
                  <td>
                    <input className="cdgrn-item-input cdgrn-item-sm" value={row.uom} onChange={(e) => handleItemChange(idx, "uom", e.target.value)} readOnly={!canEdit} />
                  </td>
                  <td>
                    <input type="number" className="cdgrn-item-input cdgrn-item-num" value={row.qty} onChange={(e) => handleItemChange(idx, "qty", e.target.value)} readOnly={!canEdit} />
                  </td>
                  <td>
                    <input type="number" className="cdgrn-item-input cdgrn-item-num" value={row.rate} onChange={(e) => handleItemChange(idx, "rate", e.target.value)} readOnly={!canEdit} />
                  </td>
                  <td>
                    <input type="number" className="cdgrn-item-input cdgrn-item-num" value={row.totalAmount} onChange={(e) => handleItemChange(idx, "totalAmount", e.target.value)} readOnly={!canEdit} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <datalist id="cdgrn-item-codes">
          {itemCodeOptions.map((code) => <option key={code} value={code} />)}
        </datalist>
        <datalist id="cdgrn-item-names">
          {itemNameOptions.map((name) => <option key={name} value={name} />)}
        </datalist>

        <div className="cdgrn-insert-bar">
          <input type="number" min="1" max="50" className="cdgrn-insert-count" value={insertCount} onChange={(e) => setInsertCount(e.target.value)} />
          <button className="cdgrn-insert-btn" onClick={handleInsertRows} disabled={!canEdit}>Add Row</button>
        </div>
        <div className="cdgrn-total-row">Item Total Amount: <strong>{itemsTotal.toFixed(2)}</strong></div>
      </div>

      <div className="cdgrn-card">
        <div className="cdgrn-items-header">
          <button className="cdgrn-toggle-btn" type="button" onClick={() => setShowCharges((prev) => !prev)}>
            {showCharges ? "Hide" : "Show"} Charges and Discount
          </button>
          {showCharges && anyChargesChecked && <button className="cdgrn-del-rows-btn" onClick={handleDeleteCharges}>Delete Selected</button>}
        </div>

        {showCharges && <div className="cdgrn-items-table-wrap">
          <table className="cdgrn-items-table">
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Del</th>
                <th>Code</th>
                <th>Description</th>
                <th>Add / Sub</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((row, idx) => (
                <tr key={idx} className={row._checked ? "cdgrn-row-checked" : ""}>
                  <td className="cdgrn-sno">{row.sNo}</td>
                  <td className="cdgrn-check-cell">
                    <input type="checkbox" checked={!!row._checked} onChange={(e) => handleChargeCheck(idx, e.target.checked)} disabled={!canEdit} />
                  </td>
                  <td>
                    <select className="cdgrn-item-input cdgrn-charge-code" value={row.code} onChange={(e) => selectCharge(idx, e.target.value)} disabled={!canEdit}>
                      <option value="">Select</option>
                      {chargeMaster.map((charge) => (
                        <option key={charge._id} value={charge.code}>{charge.code}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input className="cdgrn-item-input cdgrn-charge-desc" value={row.description} onChange={(e) => handleChargeChange(idx, "description", e.target.value)} readOnly={!canEdit} />
                  </td>
                  <td>
                    <select className="cdgrn-item-input cdgrn-charge-code" value={row.addOrSubtract} onChange={(e) => handleChargeChange(idx, "addOrSubtract", e.target.value)} disabled={!canEdit}>
                      <option value="">Select</option>
                      <option>Addition</option>
                      <option>Subtraction</option>
                    </select>
                  </td>
                  <td>
                    <input type="number" className="cdgrn-item-input cdgrn-item-num" value={row.amount} onChange={(e) => handleChargeChange(idx, "amount", e.target.value)} readOnly={!canEdit} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

        {showCharges && <div className="cdgrn-insert-bar">
          <input type="number" min="1" max="50" className="cdgrn-insert-count" value={chargeInsertCount} onChange={(e) => setChargeInsertCount(e.target.value)} />
          <button className="cdgrn-insert-btn" onClick={handleInsertCharges} disabled={!canEdit}>Add Row</button>
        </div>}
        <div className="cdgrn-total-row">Grand Total Amount: <strong>{grandTotal.toFixed(2)}</strong></div>
      </div>

      {canEdit && <div className="cdgrn-form-actions">
        <button className="cdgrn-draft-btn" onClick={() => handleSave(true)} disabled={loading}>Save as Draft</button>
        <button className="cdgrn-submit-btn" onClick={() => handleSave(false)} disabled={loading}>
          {loading ? "Saving..." : "Submit"}
        </button>
        <button className="cdgrn-cancel-btn" onClick={() => navigate("/direct-grn")} disabled={loading}>Cancel</button>
      </div>}
    </div>
  );
};

export default CreateDirectGRN;