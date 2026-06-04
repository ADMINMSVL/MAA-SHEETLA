import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../PartyMaster/CreateParty.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

/*
  Item Master — Create Page
  ─────────────────────────
  - UOM dropdown is NOT hardcoded.
  - It fetches saved UOMs from the UOM Master (stockUOM field).
  - So whatever was entered in UOM Master appears as options here.
*/

const CreateItem = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    itemCode: "",
    itemName: "",
    category: "",
    uom: "",
    hsn: "",
    gstPercent: "",
    grade: "",
    size: "",
    status: "Active",
  });

  /* UOMs loaded from DB */
  const [uomOptions, setUomOptions] = useState([]);

  useEffect(() => {
    const fetchUOMs = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/uoms`);
        /* Show only Active UOMs, use stockUOM as the display + value */
        const active = res.data.filter((u) => u.status === "Active");
        setUomOptions(active);
      } catch (err) {
        console.log("Error loading UOMs:", err);
      }
    };
    fetchUOMs();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.itemCode.trim() || !formData.itemName.trim()) {
      return alert("Item Code and Item Name are required.");
    }
    try {
      const res = await axios.post(`${API_URL}/api/create-item`, formData);
      alert(res.data.message);
      setFormData({
        itemCode: "", itemName: "", category: "", uom: "",
        hsn: "", gstPercent: "", grade: "", size: "", status: "Active",
      });
    } catch (err) {
      console.log(err);
      alert("Error Saving Item");
    }
  };

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

          {/* CATEGORY */}
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="">- Select -</option>
              <option>Raw Material</option>
              <option>Semi Finished</option>
              <option>Finished Goods</option>
              <option>Consumables</option>
              <option>Packing Material</option>
              <option>Scrap</option>
              <option>Service</option>
            </select>
          </div>

          {/* UOM — loaded from UOM Master DB */}
          <div className="form-group">
            <label>UOM</label>
            <select name="uom" value={formData.uom} onChange={handleChange}>
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

          {/* GST % */}
          <div className="form-group">
            <label>GST %</label>
            <select name="gstPercent" value={formData.gstPercent} onChange={handleChange}>
              <option value="">- Select -</option>
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
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
              placeholder="e.g. 8, 10, 12"
            />
          </div>

          {/* STATUS */}
          <div className="form-group">
            <label>Status</label>
            <input type="text" name="status" value={formData.status} readOnly />
          </div>

        </div>

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