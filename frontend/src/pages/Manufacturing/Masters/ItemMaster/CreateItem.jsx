import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../PartyMaster/CreateParty.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

/* ── Generic Typeahead Input ───────────────────────────────────────── */
const TypeAhead = ({ value, onChange, onSelect, suggestions, show, setShow, placeholder, inputRef }) => (
  <div style={{ position: "relative" }} ref={inputRef}>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => value && suggestions.length > 0 && setShow(true)}
      placeholder={placeholder}
      autoComplete="off"
    />
    {show && suggestions.length > 0 && (
      <ul className="suggestion-list">
        {suggestions.map((s) => (
          <li key={s} onMouseDown={() => onSelect(s)}>
            {s}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const CreateItem = () => {
  const navigate = useNavigate();

  /* ── Master data ──────────────────────────────────────────────────── */
  const [categoryOptions, setCategoryOptions] = useState([]); // [{categoryName, ...}]
  const [allGroupOptions, setAllGroupOptions]  = useState([]); // [{itemTypes(=cat), itemGroup, ...}]
  const [uomOptions,      setUomOptions]       = useState([]);
  const [uomDetails,      setUomDetails]       = useState([]);

  /* ── Form state ────────────────────────────────────────────────────── */
  const [formData, setFormData] = useState({
    itemCode:   "",
    itemName:   "",
    itemGroup:  "",
    itemTypes:  "",   // item type (Raw Material etc.)
    category:   "",   // selected category name
    uom:        "",
    hsn:        "",
    gstPercent: "",
    grade:      "",
    size:       "",
    status:     "Active",
  });

  /* ── Category typeahead state ─────────────────────────────────────── */
  const [catInput,   setCatInput]   = useState("");
  const [catSug,     setCatSug]     = useState([]);
  const [showCatSug, setShowCatSug] = useState(false);
  const catRef = useRef(null);

  /* ── Filtered group options (depend on selected category) ─────────── */
  const [filteredGroups, setFilteredGroups] = useState([]);

  /* ── Fetch all master data on mount ───────────────────────────────── */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [catRes, groupRes, uomRes] = await Promise.all([
          axios.get(`${API_URL}/api/item-categories`),
          axios.get(`${API_URL}/api/item-types`),
          axios.get(`${API_URL}/api/uoms`),
        ]);
        setCategoryOptions(catRes.data.filter((c) => c.status === "Active"));
        setAllGroupOptions(groupRes.data.filter((g) => g.status === "Active"));
        setUomOptions(uomRes.data.filter((u) => u.status === "Active"));
      } catch (err) {
        console.log("Error loading master data:", err);
      }
    };
    fetchAll();
  }, []);

  /* Close typeahead on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setShowCatSug(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Category typeahead handlers ──────────────────────────────────── */
  const handleCatInput = (val) => {
    setCatInput(val);

    /* Reset category and group when user clears / changes */
    setFormData((prev) => ({ ...prev, category: "", itemGroup: "" }));
    setFilteredGroups([]);

    if (val.trim()) {
      const lower = val.toLowerCase();
      const matches = categoryOptions
        .map((c) => c.categoryName)
        .filter((n) => n?.toLowerCase().includes(lower));
      setCatSug(matches);
      setShowCatSug(matches.length > 0);
    } else {
      setCatSug([]);
      setShowCatSug(false);
    }
  };

  const handleCatSelect = (catName) => {
    setCatInput(catName);
    setShowCatSug(false);

    /* Filter groups whose itemTypes (= category name) matches */
    const groups = allGroupOptions
      .filter((g) => g.itemTypes?.toLowerCase() === catName.toLowerCase())
      .map((g) => g.itemGroup)
      .filter(Boolean);

    const uniqueGroups = [...new Set(groups)].sort();
    setFilteredGroups(uniqueGroups);
    setFormData((prev) => ({ ...prev, category: catName, itemGroup: "" }));
  };

  /* ── Generic change ───────────────────────────────────────────────── */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  /* ── Submit ───────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!formData.itemCode.trim() || !formData.itemName.trim()) {
      return alert("Item Code and Item Name are required.");
    }
    if (!formData.category) return alert("Category is required.");
    if (!formData.uom)      return alert("UOM is required.");

    try {
      const res = await axios.post(`${API_URL}/api/create-item`, { ...formData, uomDetails });
      alert(res.data.message);
      setFormData({
        itemCode: "", itemName: "", itemGroup: "", itemTypes: "",
        category: "", uom: "", hsn: "", gstPercent: "",
        grade: "", size: "", status: "Active",
      });
      setCatInput("");
      setFilteredGroups([]);
      setUomDetails([]);
    } catch (err) {
      console.log(err);
      alert("Error Saving Item");
    }
  };

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="create-page">
      <ModuleNavbar />

      <div className="create-header">
        <h1>Item Master</h1>
      </div>

      <div className="create-container">
        <div className="create-title">Create Item</div>

        <div className="create-grid">

          {/* ITEM CODE */}
          <div className="form-group">
            <label>* Item Code</label>
            <input
              type="text"
              name="itemCode"
              value={formData.itemCode}
              onChange={handleChange}
              placeholder="e.g. ITEM001"
            />
          </div>

          {/* ITEM NAME */}
          <div className="form-group">
            <label>* Item Name</label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              placeholder="Full item name"
            />
          </div>

          {/* CATEGORY — typeahead from DB ─────────────────────────────── */}
          <div className="form-group">
            <label>* Category</label>
            <TypeAhead
              value={catInput}
              onChange={handleCatInput}
              onSelect={handleCatSelect}
              suggestions={catSug}
              show={showCatSug}
              setShow={setShowCatSug}
              placeholder="Type category name…"
              inputRef={catRef}
            />
            {formData.category && (
              <span style={{ fontSize: "11px", color: "#2e7d32", marginTop: "4px" }}>
                ✓ {formData.category}
              </span>
            )}
          </div>

          {/* ITEM GROUP — filtered by selected category ──────────────── */}
          <div className="form-group">
            <label>Item Group</label>
            <select
              name="itemGroup"
              value={formData.itemGroup}
              onChange={handleChange}
              disabled={!formData.category}
            >
              <option value="">
                {formData.category
                  ? filteredGroups.length > 0
                    ? "- Select Group -"
                    : "No groups for this category"
                  : "Select a Category first"}
              </option>
              {filteredGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {formData.category && filteredGroups.length === 0 && (
              <span style={{ fontSize: "11px", color: "#e55", marginTop: "4px" }}>
                No item groups found for "{formData.category}". Add them in Masters → Item Group.
              </span>
            )}
          </div>

          {/* ITEM TYPES */}
          <div className="form-group">
            <label>Item Types</label>
            <select name="itemTypes" value={formData.itemTypes} onChange={handleChange}>
              <option value="">- Select -</option>
              <option value="Raw Material">Raw Material</option>
              <option value="Semi Finished">Semi Finished</option>
              <option value="Finished Goods">Finished Goods</option>
              <option value="Consumables">Consumables</option>
              <option value="Packing Material">Packing Material</option>
              <option value="Scrap">Scrap</option>
              <option value="Service">Service</option>
            </select>
          </div>

          {/* HSN */}
          <div className="form-group">
            <label>HSN</label>
            <input
              type="text"
              name="hsn"
              value={formData.hsn}
              onChange={handleChange}
              placeholder="e.g. 72141090"
            />
          </div>

          {/* UOM */}
          <div className="form-group">
            <label>* UOM</label>
            <select
              name="uom"
              value={formData.uom}
              onChange={(e) => {
                const selectedUom = e.target.value;
                setFormData({ ...formData, uom: selectedUom });
                setUomDetails([
                  { bUom: selectedUom, bQty: 1, wUom: selectedUom, wQty: 1, isBuom: true },
                ]);
              }}
            >
              <option value="">- Select -</option>
              {uomOptions.length > 0 ? (
                uomOptions.map((u) => (
                  <option key={u._id} value={u.stockUOM}>
                    {u.stockUOM}
                    {u.purchaseUOM && u.purchaseUOM !== u.stockUOM
                      ? ` (Purchase: ${u.purchaseUOM})`
                      : ""}
                  </option>
                ))
              ) : (
                <option disabled>No UOMs found — add in UOM Master</option>
              )}
            </select>
            {uomOptions.length === 0 && (
              <span style={{ fontSize: "11px", color: "#e55", marginTop: "4px" }}>
                Go to Masters → UOM Master and create UOMs first.
              </span>
            )}
          </div>

          {/* GST % */}
          <div className="form-group">
            <label>GST %</label>
            <input
              type="number"
              name="gstPercent"
              value={formData.gstPercent}
              onChange={handleChange}
              placeholder="e.g. 18"
            />
          </div>

          {/* GRADE */}
          <div className="form-group">
            <label>Grade</label>
            <input
              type="text"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              placeholder="e.g. Fe500"
            />
          </div>

          {/* SIZE */}
          <div className="form-group">
            <label>Size</label>
            <input
              type="text"
              name="size"
              value={formData.size}
              onChange={handleChange}
              placeholder="e.g. 12mm"
            />
          </div>

        </div>{/* /create-grid */}
         {/* UOM DETAIL SECTION */}
        {/* <div style={{ marginTop: "20px" }}>
          <h3>UOM Detailed Section</h3>

          {/* FIX 6: guard — must select Base UOM before adding rows */}
          {/* <button
            type="button"
            onClick={() => {
              if (!formData.uom) {
                alert("Select Base UOM first.");
                return;
              }
              setUomDetails([
                ...uomDetails,
                {
                  bUom: formData.uom,
                  bQty: 1,
                  wUom: "",
                  wQty: "",
                  isBuom: false,
                },
              ]);
            }}
          >
            + Add UOM
          </button>

          <table
            border="1"
            width="100%"
            style={{ marginTop: "10px", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th>SL NO</th>
                <th>B.UOM</th>
                <th>QTY</th>
                <th>W.UOM</th>
                <th>QTY</th>
                <th>IS BUOM</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {uomDetails.map((row, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{row.bUom}</td>

                  <td>
                    <input
                      type="number"
                      value={row.bQty}
                      onChange={(e) => {
                        const temp = [...uomDetails];
                        temp[index] = { ...temp[index], bQty: e.target.value };
                        setUomDetails(temp);
                      }}
                    />
                  </td>

                  <td>
                    <select
                      value={row.wUom}
                      disabled={row.isBuom}
                      onChange={(e) => {
                        const temp = [...uomDetails];
                        temp[index] = { ...temp[index], wUom: e.target.value };
                        setUomDetails(temp);
                      }}
                    >
                      <option value="">Select</option>
                      {uomOptions.map((u) => (
                        <option key={u._id} value={u.stockUOM}>
                          {u.stockUOM}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <input
                      type="number"
                      value={row.wQty}
                      onChange={(e) => {
                        const temp = [...uomDetails];
                        temp[index] = { ...temp[index], wQty: e.target.value };
                        setUomDetails(temp);
                      }}
                    />
                  </td>

                  <td>{row.isBuom ? "YES" : "NO"}</td>

                  <td>
                    {!row.isBuom && (
                      <button
                        onClick={() =>
                          setUomDetails(uomDetails.filter((_, i) => i !== index))
                        }
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> */} 

        <div className="action-buttons">
          <button className="draft-btn">Save as Draft</button>
          <button className="submit-btn" onClick={handleSubmit}>Submit</button>
          <button className="cancel-btn" onClick={() => navigate("/item-master")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateItem;