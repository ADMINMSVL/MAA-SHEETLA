import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./PartyMaster.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const detailFields = [
  { label: "Party Code", key: "partyCode" },
  { label: "Party Name", key: "partyName" },
  { label: "Type", key: "type" },
  { label: "City", key: "city" },
  { label: "Address Line 1", key: ["addressLine1", "address1", "address_1", "address line 1", "Address Line 1"] },
  { label: "Address Line 2", key: ["addressLine2", "address2", "address_2", "address line 2", "Address Line 2"] },
  { label: "Pin", key: ["pin", "pincode", "pinCode", "pinNo", "Pin", "PIN", "Pin Code"] },
  { label: "GST No", key: "gstNo" },
  { label: "Mobile", key: "mobile" },
  { label: "Pay Terms", key: "payTerms" },
  { label: "Credit Days", key: "creditDays" },
  { label: "Status", key: "status" },
];

const getValue = (item, keys) => {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const value = keyList
    .map((key) => item?.[key])
    .find((fieldValue) => fieldValue !== undefined && fieldValue !== null && fieldValue.toString().trim() !== "");

  return value || "-";
};

const PartyDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedParty = location.state?.party || null;
  const [party, setParty] = useState(selectedParty);
  const [loading, setLoading] = useState(!selectedParty);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedParty) {
      setParty(selectedParty);
      setLoading(false);
      setError("");
      return;
    }

    const fetchParty = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/party/${encodeURIComponent(id)}`);
        setParty(res.data);
      } catch (err) {
        console.log(err);
        setError(err.response?.data?.message || "Party details not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchParty();
  }, [id, selectedParty]);

  return (
    <div className="transaction-page">
      <ModuleNavbar />

      <div className="transaction-topbar">
        <h1>Party Details</h1>
        <button className="create-btn" onClick={() => navigate("/party-master")}>
          Back
        </button>
      </div>

      <div className="search-container">
        <div className="search-title">Details</div>

        {loading && <div className="detail-message">Loading...</div>}
        {!loading && error && <div className="detail-message">{error}</div>}

        {!loading && party && (
          <div className="detail-grid">
            {detailFields.map((field) => (
              <div className="detail-item" key={Array.isArray(field.key) ? field.key[0] : field.key}>
                <span>{field.label}</span>
                <strong>{getValue(party, field.key)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyDetail;
