import React, { useState } from "react";
import axios from "axios";
import "../MasterShared.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const GST_OPTIONS = [0, 5, 12, 18, 28];

const CreateTaxDetails = () => {
  const [formData, setFormData] = useState({
    hsnCode: "",
    gstPercent: "",
    description: "",
    status: "Active",
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/create-tax-details`, formData);
      alert(res.data.message);
    } catch (err) { console.log(err); alert("Error Saving Tax Details"); }
  };

  return (
    <div className="create-page">
      <ModuleNavbar />
      <div className="create-header"><h1>Tax Details</h1></div>
      <div className="create-container">
        <div className="create-title">Create Tax Details</div>
        <div className="create-grid">

          <div className="form-group">
            <label>* HSN Code</label>
            <input type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} placeholder="e.g. 72141090" />
          </div>

          <div className="form-group">
            <label>* GST %</label>
            <select name="gstPercent" value={formData.gstPercent} onChange={handleChange}>
              <option value="">- Select -</option>
              {GST_OPTIONS.map((g) => <option key={g} value={g}>{g}%</option>)}
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

export default CreateTaxDetails;