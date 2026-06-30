import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./PartyMaster.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";
import UploadModal from "../../../../components/UploadModal/UploadModal";

/* Fields definition used by the UploadModal */
const PARTY_FIELDS = [
  { key: "partyCode", label: "Party Code", required: true },
  { key: "partyName", label: "Party Name", required: true },
  { key: "type", label: "Type", required: false },
  { key: "city", label: "City", required: false },
  { key: "addressLine1", label: "Address Line 1", required: false },
  { key: "addressLine2", label: "Address Line 2", required: false },
  { key: "pin", label: "Pin", required: false },
  { key: "gstNo", label: "GST No", required: false },
  { key: "mobile", label: "Mobile", required: false },
  { key: "payTerms", label: "Pay Terms", required: false },
  { key: "creditDays", label: "Credit Days", required: false },
  { key: "status", label: "Status", required: false, default: "Active" },
];

/* Type is a fixed list — no longer sourced from a Type master */
const PARTY_TYPE_OPTIONS = ["Supplier", "Customer", "Both"];

const getValue = (item, keys) => {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const value = keyList
    .map((key) => item?.[key])
    .find((fieldValue) => fieldValue !== undefined && fieldValue !== null && fieldValue.toString().trim() !== "");

  return value || "";
};

const PartyMaster = () => {
  const navigate = useNavigate();

  const [parties, setParties] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);

  /* SEARCH FIELDS */
  const [partyCode, setPartyCode] = useState("");
  const [partyName, setPartyName] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  /* FETCH */
  const fetchParties = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/parties`);
      setParties(res.data);
      setFilteredData(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  /* SEARCH */
  const handleSearch = () => {
    let filtered = [...parties];
    if (partyCode) filtered = filtered.filter((i) => i.partyCode?.toLowerCase().includes(partyCode.toLowerCase()));
    if (partyName) filtered = filtered.filter((i) => i.partyName?.toLowerCase().includes(partyName.toLowerCase()));
    if (type) filtered = filtered.filter((i) => i.type === type);
    if (status) filtered = filtered.filter((i) => i.status === status);
    setFilteredData(filtered);
  };

  /* RESET */
  const handleReset = () => {
    setPartyCode("");
    setPartyName("");
    setType("");
    setStatus("");
    setFilteredData(parties);
  };

  return (
    <div className="transaction-page">
      <ModuleNavbar />

      {/* TOPBAR */}
      <div className="transaction-topbar">
        <h1>Party Master</h1>
        <div className="topbar-actions">
          <button className="upload-btn" onClick={() => setUploadOpen(true)}>
            Upload
          </button>
          <button className="create-btn" onClick={() => navigate("/create-party")}>
            Create
          </button>
        </div>
      </div>

      {/* UPLOAD MODAL */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={fetchParties}
        entityType="party"
        fields={PARTY_FIELDS}
        bulkEndpoint="/api/bulk-create-parties"
      />

      {/* SEARCH */}
      <div className="search-container">
        <div className="search-title">Search</div>

        <div className="search-grid">
          <div className="form-group">
            <label>Party Code</label>
            <input type="text" value={partyCode} onChange={(e) => setPartyCode(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Party Name</label>
            <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">- Select -</option>
              {PARTY_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">- Select -</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div className="button-group">
          <button className="search-btn" onClick={handleSearch}>Search</button>
          <button className="reset-btn" onClick={handleReset}>Reset</button>
        </div>

        {/* TABLE */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>S No</th>
                <th>Party Code</th>
                <th>Party Name</th>
                <th>Type</th>
                <th>City</th>
                <th>Address Line 1</th>
                <th>Address Line 2</th>
                <th>Pin</th>
                <th>GST No</th>
                <th>Mobile</th>
                <th>Pay Terms</th>
                <th>Credit Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => {
                  const partyIdentifier = item._id || item.id || item.partyCode;

                  return (
                  <tr key={partyIdentifier}>
                    <td>{index + 1}</td>
                    <td>
                      <Link
                        className="party-code-link"
                        to={`/party-detail/${encodeURIComponent(partyIdentifier)}`}
                        state={{ party: item }}
                      >
                        {item.partyCode}
                      </Link>
                    </td>
                    <td>{getValue(item, "partyName")}</td>
                    <td>{getValue(item, "type")}</td>
                    <td>{getValue(item, "city")}</td>
                    <td>{getValue(item, ["addressLine1", "address1", "address_1", "address line 1", "Address Line 1"])}</td>
                    <td>{getValue(item, ["addressLine2", "address2", "address_2", "address line 2", "Address Line 2"])}</td>
                    <td>{getValue(item, ["pin", "pincode", "pinCode", "pinNo", "Pin", "PIN", "Pin Code"])}</td>
                    <td>{getValue(item, "gstNo")}</td>
                    <td>{getValue(item, "mobile")}</td>
                    <td>{getValue(item, "payTerms")}</td>
                    <td>{getValue(item, "creditDays")}</td>
                    <td>{getValue(item, "status")}</td>
                  </tr>
                  );
                })
              ) : (
                <tr><td colSpan="13" className="no-data">No Data Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartyMaster;