import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../PartyMaster/CreateParty.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

/*
  Party Type Create Page
  ─────────────────────
  - User types the party type name manually (free text)
  - Saved to DB → PartyType collection
  - Party Master "Type" dropdown reads from this collection
*/

const CreatePartyType = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    partyType: "",
    description: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.partyType.trim()) {
      return alert("Party Type name is required.");
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${API_URL}/api/create-party-type`,
        formData
      );
      alert(res.data.message);
      setFormData({ partyType: "", description: "", status: "Active" });
    } catch (err) {
      console.log(err);
      alert("Error Saving Party Type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      <ModuleNavbar />

      <div className="create-header">
        <h1>Party Type</h1>
      </div>

      <div className="create-container">
        <div className="create-title">Create Party Type</div>

        <div className="create-grid">

          {/* PARTY TYPE — FREE TEXT */}
          <div className="form-group">
            <label>* Party Type</label>
            <input
              type="text"
              name="partyType"
              value={formData.partyType}
              onChange={handleChange}
              placeholder="e.g. Customer, Supplier, Transporter..."
            />
            <span style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
              This will appear as an option in Party Master
            </span>
          </div>

          {/* DESCRIPTION */}
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

        {/* HINT BOX */}
        <div style={{
          margin: "0 18px 18px",
          padding: "12px 16px",
          background: "#f0f9ff",
          border: "1px solid #bae0f5",
          fontSize: "13px",
          color: "#0369a1",
          borderRadius: "4px",
        }}>
          <strong>How it works:</strong> Whatever you type here (e.g. "Customer",
          "Supplier", "Transporter") gets saved to the database. Those saved
          values will automatically appear as dropdown options in the{" "}
          <strong>Party Master → Type</strong> field.
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
          <button className="cancel-btn" onClick={() => navigate("/party-type")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePartyType;