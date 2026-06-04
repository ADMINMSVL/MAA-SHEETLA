import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../PartyMaster/CreateParty.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";
import { MODULE_BUSINESS_MAP, SOLUTION_MAP } from "../../../../module/moduleBusinessMap";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh",
];

const CreateSite = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    module:         "",
    businessEntity: "",
    siteCode:       "",
    siteName:       "",
    address:        "",
    city:           "",
    state:          "",
    pinCode:        "",
    contactPerson:  "",
    mobile:         "",
    gstNo:          "",
    status:         "Active",
  });

  const [loading, setLoading] = useState(false);

  /* Business entities cascade from selected module */
  const businessEntities = formData.module
    ? MODULE_BUSINESS_MAP[formData.module] || []
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "module") {
      setFormData({ ...formData, module: value, businessEntity: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async () => {
    if (!formData.module || !formData.businessEntity) {
      return alert("Module and Business Entity are required.");
    }
    if (!formData.siteCode.trim() || !formData.siteName.trim()) {
      return alert("Site Code and Site Name are required.");
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/create-site`, formData);
      alert(res.data.message);
      setFormData({
        module: "", businessEntity: "", siteCode: "", siteName: "",
        address: "", city: "", state: "", pinCode: "",
        contactPerson: "", mobile: "", gstNo: "", status: "Active",
      });
    } catch (err) {
      alert(err.response?.data?.message || "Error Saving Site");
    } finally {
      setLoading(false);
    }
  };

  /* Grouped module selector */
  const ModuleSelect = () => (
    <select name="module" value={formData.module} onChange={handleChange}>
      <option value="">- Select Module -</option>
      {Object.entries(SOLUTION_MAP).map(([solution, mods]) => (
        <optgroup key={solution} label={`── ${solution} ──`}>
          {mods.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  return (
    <div className="create-page">
      <ModuleNavbar />

      <div className="create-header">
        <h1>Site Master</h1>
      </div>

      <div className="create-container">
        <div className="create-title">Create Site</div>

        <div className="create-grid">

          {/* MODULE */}
          <div className="form-group">
            <label>* Module</label>
            <ModuleSelect />
          </div>

          {/* BUSINESS ENTITY — cascades from Module */}
          <div className="form-group">
            <label>* Business Entity</label>
            <select
              name="businessEntity"
              value={formData.businessEntity}
              onChange={handleChange}
              disabled={!formData.module}
            >
              <option value="">
                {formData.module ? "- Select Business Entity -" : "- Select Module first -"}
              </option>
              {businessEntities.map((be) => (
                <option key={be} value={be}>{be}</option>
              ))}
            </select>
          </div>

          {/* SITE CODE */}
          <div className="form-group">
            <label>* Site Code</label>
            <input
              type="text"
              name="siteCode"
              value={formData.siteCode}
              onChange={handleChange}
              placeholder="e.g. SITE001"
            />
          </div>

          {/* SITE NAME */}
          <div className="form-group">
            <label>* Site Name</label>
            <input
              type="text"
              name="siteName"
              value={formData.siteName}
              onChange={handleChange}
              placeholder="Full site name"
            />
          </div>

          {/* CITY */}
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g. Raipur"
            />
          </div>

          {/* STATE */}
          <div className="form-group">
            <label>State</label>
            <select name="state" value={formData.state} onChange={handleChange}>
              <option value="">- Select State -</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* PIN CODE */}
          <div className="form-group">
            <label>Pin Code</label>
            <input
              type="text"
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              placeholder="6-digit pin"
              maxLength={6}
            />
          </div>

          {/* GST NO */}
          <div className="form-group">
            <label>GST No</label>
            <input
              type="text"
              name="gstNo"
              value={formData.gstNo}
              onChange={handleChange}
              placeholder="15-digit GSTIN"
              maxLength={15}
            />
          </div>

          {/* CONTACT PERSON */}
          <div className="form-group">
            <label>Contact Person</label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
            />
          </div>

          {/* MOBILE */}
          <div className="form-group">
            <label>Mobile</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="10-digit"
              maxLength={10}
            />
          </div>

          {/* STATUS */}
          <div className="form-group">
            <label>Status</label>
            <input type="text" name="status" value={formData.status} readOnly />
          </div>

          {/* ADDRESS — full width */}
          <div className="form-group" style={{ gridColumn: "span 4" }}>
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full address"
            />
          </div>

        </div>

        <div className="action-buttons">
          <button className="draft-btn">Save as Draft</button>
          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Submit"}
          </button>
          <button className="cancel-btn" onClick={() => navigate("/site-master")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSite;
