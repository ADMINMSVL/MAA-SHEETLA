import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CreateParty.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";



const CreateParty = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    partyCode: "",
    partyName: "",
    type: "",
    city: "",
    addressLine1: "",
    addressLine2: "",
    pin: "",
    gstNo: "",
    mobile: "",
    payTerms: "",
    creditDays: "",
    status: "Active",
  });

  /* Party types loaded from DB */
  const [partyTypes, setPartyTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Fetch party types on mount */
  useEffect(() => {
    const fetchPartyTypes = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/party-types`);
        /* Only show Active types */
        const active = res.data.filter((t) => t.status === "Active");
        setPartyTypes(active);
      } catch (err) {
        console.log("Error loading party types:", err);
      }
    };
    fetchPartyTypes();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.partyCode.trim() || !formData.partyName.trim() || !formData.pin.trim()) {
      return alert("Party Code, Party Name and Pin are required.");
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/create-party`, formData);
      alert(res.data.message);
      setFormData({
        partyCode: "", partyName: "", type: "", city: "",
        addressLine1: "", addressLine2: "", pin: "",
        gstNo: "", mobile: "", payTerms: "", creditDays: "", status: "Active",
      });
    } catch (err) {
      console.log(err);
      alert("Error Saving Party");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      <ModuleNavbar />

      <div className="create-header">
        <h1>Party Master</h1>
      </div>

      <div className="create-container">
        <div className="create-title">Create Party</div>

        <div className="create-grid">

          {/* PARTY CODE */}
          <div className="form-group">
            <label>* Party Code</label>
            <input
              type="text"
              name="partyCode"
              value={formData.partyCode}
              onChange={handleChange}
              placeholder="e.g. PARTY001"
            />
          </div>

          {/* PARTY NAME */}
          <div className="form-group">
            <label>* Party Name</label>
            <input
              type="text"
              name="partyName"
              value={formData.partyName}
              onChange={handleChange}
              placeholder="Full name"
            />
          </div>

          {/* TYPE — loaded from DB */}
          <div className="form-group">
            <label>* Type</label>
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="">- Select -</option>
              {partyTypes.length > 0 ? (
                partyTypes.map((pt) => (
                  <option key={pt._id} value={pt.partyType}>
                    {pt.partyType}
                  </option>
                ))
              ) : (
                <option disabled>No party types found — add in Party Type master</option>
              )}
            </select>
            {partyTypes.length === 0 && (
              <span style={{ fontSize: "11px", color: "#e55", marginTop: "4px" }}>
                Go to Masters → Party Type and create types first.
              </span>
            )}
          </div>

          {/* CITY */}
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          {/* ADDRESS LINE 1 */}
          <div className="form-group">
            <label>Address Line 1</label>
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              placeholder="Street / area"
            />
          </div>

          {/* ADDRESS LINE 2 */}
          <div className="form-group">
            <label>Address Line 2</label>
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
              placeholder="Landmark / locality"
            />
          </div>

          {/* PIN */}
          <div className="form-group">
            <label>* Pin</label>
            <input
              type="text"
              name="pin"
              value={formData.pin}
              onChange={handleChange}
              placeholder="PIN code"
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
              placeholder="10-digit number"
            />
          </div>

          {/* PAY TERMS */}
          <div className="form-group">
            <label>Pay Terms</label>
            <select
              name="payTerms"
              value={formData.payTerms}
              onChange={handleChange}
            >
              <option value="">- Select -</option>
              <option>Advance</option>
              <option>Credit</option>
              <option>COD</option>
            </select>
          </div>

          {/* CREDIT DAYS */}
          <div className="form-group">
            <label>Credit Days</label>
            <input
              type="number"
              name="creditDays"
              value={formData.creditDays}
              onChange={handleChange}
              placeholder="e.g. 30"
            />
          </div>

          {/* STATUS */}
          <div className="form-group">
            <label>Status</label>
            <input
              type="text"
              name="status"
              value={formData.status}
              readOnly
            />
          </div>

        </div>

        <div className="action-buttons">
          <button className="draft-btn">Save as Draft</button>
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Submit"}
          </button>
          <button className="cancel-btn" onClick={() => navigate("/party-master")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateParty;
