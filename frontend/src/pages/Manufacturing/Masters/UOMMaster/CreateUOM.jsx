import React, { useState } from "react";
import axios from "axios";
import "../PartyMaster/CreateParty.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const UOM_OPTIONS = ["MT", "KG", "PCS", "BUNDLE"];

const CreateUOM = () => {
  const [formData, setFormData] = useState({
    stockUOM: "",
    purchaseUOM: "",
    salesUOM: "",
    conversionFactor: "",
    status: "Active",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/create-uom`, formData);
      alert(res.data.message);
    } catch (error) {
      console.log(error);
      alert("Error Saving UOM");
    }
  };

  return (
    <div className="create-page">
      <ModuleNavbar />

      <div className="create-header">
        <h1>UOM Master</h1>
      </div>

      <div className="create-container">
        <div className="create-title">Create UOM</div>

        <div className="create-grid">

          <div className="form-group">
            <label>* Stock UOM</label>
            <select name="stockUOM" value={formData.stockUOM} onChange={handleChange}>
              <option value="">- Select -</option>
              {UOM_OPTIONS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>* Purchase UOM</label>
            <select name="purchaseUOM" value={formData.purchaseUOM} onChange={handleChange}>
              <option value="">- Select -</option>
              {UOM_OPTIONS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>* Sales UOM</label>
            <select name="salesUOM" value={formData.salesUOM} onChange={handleChange}>
              <option value="">- Select -</option>
              {UOM_OPTIONS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Conversion Factor</label>
            <input
              type="number"
              name="conversionFactor"
              value={formData.conversionFactor}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <input type="text" name="status" value={formData.status} readOnly />
          </div>

        </div>

        <div className="action-buttons">
          <button className="draft-btn">Save as Draft</button>
          <button className="submit-btn" onClick={handleSubmit}>Submit</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default CreateUOM;