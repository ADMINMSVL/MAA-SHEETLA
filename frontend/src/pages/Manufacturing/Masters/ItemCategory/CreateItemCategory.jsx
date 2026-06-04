import React, { useState } from "react";
import axios from "axios";
import "../MasterShared.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const CATEGORY_OPTIONS = [
  "Raw Material",
  "Semi Finished",
  "Finished Goods",
  "Consumables",
  "Packing Material",
  "Scrap",
  "Service",
];

const CreateItemCategory = () => {
  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
    status: "Active",
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/create-item-category`, formData);
      alert(res.data.message);
    } catch (err) { console.log(err); alert("Error Saving Item Category"); }
  };

  return (
    <div className="create-page">
      <ModuleNavbar />
      <div className="create-header"><h1>Item Category</h1></div>
      <div className="create-container">
        <div className="create-title">Create Item Category</div>
        <div className="create-grid">

          <div className="form-group">
            <label>* Category Name</label>
            <select name="categoryName" value={formData.categoryName} onChange={handleChange}>
              <option value="">- Select -</option>
              {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
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

export default CreateItemCategory;