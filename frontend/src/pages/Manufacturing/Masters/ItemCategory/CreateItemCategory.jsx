import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../MasterShared.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const CreateItemCategory = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    categoryName: "",
    description:  "",
    status:       "Active",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.categoryName.trim()) {
      return alert("Category Name is required.");
    }
    try {
      const res = await axios.post(`${API_URL}/api/create-item-category`, formData);
      alert(res.data.message);
      setFormData({ categoryName: "", description: "", status: "Active" });
    } catch (err) {
      console.log(err);
      alert("Error Saving Item Category");
    }
  };

  return (
    <div className="create-page">
      <ModuleNavbar />

      <div className="create-header">
        <button className="back-btn" onClick={() => navigate("/item-category")}>
          ← Back
        </button>
        <h1>Item Category</h1>
      </div>

      <div className="create-container">
        <div className="create-title">Create Item Category</div>

        <div className="create-grid">

          <div className="form-group">
            <label>* Category Name</label>
            <input
              type="text"
              name="categoryName"
              value={formData.categoryName}
              onChange={handleChange}
              placeholder="e.g. TMT, Iron, Cement"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description"
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
          <button className="cancel-btn" onClick={() => navigate("/item-category")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateItemCategory;
