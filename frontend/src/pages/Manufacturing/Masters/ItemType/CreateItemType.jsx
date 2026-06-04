import React, { useState } from "react";
import axios from "axios";
import "../MasterShared.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const TYPE_OPTIONS = [
  "Billet", "Ingot", "TMT Bar", "Wire Rod", "Coil", "Scrap", "Packing Material",
];

const CreateItemType = () => {
  const [formData, setFormData] = useState({ typeName: "", description: "", status: "Active" });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/create-item-type`, formData);
      alert(res.data.message);
    } catch (err) { console.log(err); alert("Error Saving Item Type"); }
  };

  return (
    <div className="create-page">
      <ModuleNavbar />
      <div className="create-header"><h1>Item Type</h1></div>
      <div className="create-container">
        <div className="create-title">Create Item Type</div>
        <div className="create-grid">

          <div className="form-group">
            <label>* Type Name</label>
            <select name="typeName" value={formData.typeName} onChange={handleChange}>
              <option value="">- Select -</option>
              {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input type="text" name="description" value={formData.description} onChange={handleChange} />
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

export default CreateItemType;