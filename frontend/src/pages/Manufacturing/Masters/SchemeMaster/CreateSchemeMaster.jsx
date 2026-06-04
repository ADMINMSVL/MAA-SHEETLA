import React, { useState } from "react";
import axios from "axios";
import "../MasterShared.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

/*
  OFFSET TABLE — mirrors backend exactly
  SIZE | RAIPUR  | RAIPUR BASIC | FOR 12MM
   8   | +2000   | +2000        | +3540
  10   | 0       | 0            | +2360
  12   | 0       | 0            | 0
  16   | 0       | 0            | +1180
  20   | 0       | 0            | +1180
  25   | 0       | 0            | +1180
*/
const OFFSETS = {
  size8:  { raipur: 2000, raipurBasic: 2000, for12mm: 3540 },
  size10: { raipur: 0,    raipurBasic: 0,    for12mm: 2360 },
  size12: { raipur: 0,    raipurBasic: 0,    for12mm: 0    },
  size16: { raipur: 0,    raipurBasic: 0,    for12mm: 1180 },
  size20: { raipur: 0,    raipurBasic: 0,    for12mm: 1180 },
  size25: { raipur: 0,    raipurBasic: 0,    for12mm: 1180 },
};

const SIZES = [
  { key: "size8",  label: "8"  },
  { key: "size10", label: "10" },
  { key: "size12", label: "12" },
  { key: "size16", label: "16" },
  { key: "size20", label: "20" },
  { key: "size25", label: "25" },
];

/* Format: if offset = 0 show "X", else show "X + 2000" */
const formatCell = (basicPrice, offset) => {
  if (!basicPrice || isNaN(Number(basicPrice))) {
    return offset === 0 ? "X" : `X + ${offset.toLocaleString("en-IN")}`;
  }
  const X = Number(basicPrice);
  const computed = X + offset;
  const label = offset === 0 ? `X` : `X + ${offset.toLocaleString("en-IN")}`;
  return `${label}  =  ₹ ${computed.toLocaleString("en-IN")}`;
};

const CreateSchemeMaster = () => {
  const [formData, setFormData] = useState({
    schemeName: "",
    basicPrice: "",
    status: "Active",
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.schemeName || !formData.basicPrice) {
      return alert("Scheme Name and Basic Price are required.");
    }
    try {
      const res = await axios.post(`${API_URL}/api/create-scheme`, formData);
      alert(res.data.message);
    } catch (err) {
      console.log(err);
      alert("Error Saving Scheme");
    }
  };

  const X = Number(formData.basicPrice);
  const hasBasic = formData.basicPrice !== "" && !isNaN(X);

  return (
    <div className="create-page">
      <ModuleNavbar />
      <div className="create-header"><h1>Scheme Master</h1></div>
      <div className="create-container">
        <div className="create-title">Create Scheme</div>

        {/* BASIC FIELDS */}
        <div className="basic-info">

          <div className="form-group">
            <label>* Scheme Name</label>
            <input
              type="text"
              name="schemeName"
              value={formData.schemeName}
              onChange={handleChange}
              placeholder="e.g. Raipur Scheme June 2026"
            />
          </div>

          <div className="form-group">
            <label>* Basic Price (X) ₹</label>
            <input
              type="number"
              name="basicPrice"
              value={formData.basicPrice}
              onChange={handleChange}
              placeholder="Enter base price"
            />
            {hasBasic && (
              <span className="computed-value">
                BASIC (X) = ₹ {X.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Status</label>
            <input type="text" name="status" value={formData.status} readOnly />
          </div>

        </div>

        {/* LIVE PRICE MATRIX PREVIEW */}
        <div className="scheme-table-wrap">
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#444", marginBottom: "10px" }}>
            Price Matrix Preview
            {hasBasic && (
              <span style={{ fontWeight: "400", color: "#43bfe7", marginLeft: "10px" }}>
                (BASIC X = ₹ {X.toLocaleString("en-IN")})
              </span>
            )}
          </div>

          <table className="scheme-matrix">
            <thead>
              <tr>
                <th>SCHEME → ITEM</th>
                <th>RAIPUR</th>
                <th>RAIPUR BASIC</th>
                <th>FOR 12MM</th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map(({ key, label }) => (
                <tr key={key}>
                  <td>{label}</td>
                  <td>{formatCell(formData.basicPrice, OFFSETS[key].raipur)}</td>
                  <td>{formatCell(formData.basicPrice, OFFSETS[key].raipurBasic)}</td>
                  <td>{formatCell(formData.basicPrice, OFFSETS[key].for12mm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default CreateSchemeMaster;