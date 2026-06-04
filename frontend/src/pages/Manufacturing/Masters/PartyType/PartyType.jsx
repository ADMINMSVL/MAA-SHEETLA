import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../PartyMaster/PartyMaster.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const PARTY_TYPES = [
  "Customer",
  "Supplier",
  "Customer + Supplier",
  "Transporter",
  "Job Worker",
  "Service Provider",
];

const PartyType = () => {
  const navigate = useNavigate();

  const [partyTypes, setPartyTypes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [partyType, setPartyType] = useState("");
  const [status, setStatus] = useState("");

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ partyType: "", description: "", status: "" });

  const fetchPartyTypes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/party-types`);
      setPartyTypes(res.data);
      setFilteredData(res.data);
    } catch (error) { console.log(error); }
  };

  useEffect(() => { fetchPartyTypes(); }, []);

  const handleSearch = () => {
    let filtered = [...partyTypes];
    if (partyType) filtered = filtered.filter((i) => i.partyType === partyType);
    if (status) filtered = filtered.filter((i) => i.status === status);
    setFilteredData(filtered);
  };

  const handleReset = () => {
    setPartyType(""); setStatus("");
    setFilteredData(partyTypes);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/party-type/${id}`);
      fetchPartyTypes();
    } catch (error) { console.log(error); }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setEditData({ partyType: item.partyType, description: item.description, status: item.status });
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`${API_URL}/api/party-type/${id}`, editData);
      setEditId(null);
      fetchPartyTypes();
    } catch (error) { console.log(error); }
  };

  return (
    <div className="transaction-page">
      <ModuleNavbar />

      <div className="transaction-topbar">
        <h1>Party Type</h1>
        <button className="create-btn" onClick={() => navigate("/create-party-type")}>Create ▼</button>
      </div>

      <div className="search-container">
        <div className="search-title">Search</div>

        <div className="search-grid">
          <div className="form-group">
            <label>Party Type</label>
            <select value={partyType} onChange={(e) => setPartyType(e.target.value)}>
              <option value="">- Select -</option>
              {PARTY_TYPES.map((t) => <option key={t}>{t}</option>)}
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

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>S No</th>
                <th>Party Type</th>
                <th>Description</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>

                    <td>
                      {editId === item._id ? (
                        <select
                          value={editData.partyType}
                          onChange={(e) => setEditData({ ...editData, partyType: e.target.value })}
                        >
                          {PARTY_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      ) : item.partyType}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <input
                          type="text"
                          value={editData.description}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        />
                      ) : item.description}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <select
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        >
                          <option>Active</option>
                          <option>Inactive</option>
                        </select>
                      ) : item.status}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <button className="save-btn" onClick={() => handleUpdate(item._id)}>Save</button>
                      ) : (
                        <button className="edit-btn" onClick={() => handleEdit(item)}>Edit</button>
                      )}
                      <button className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="no-data">No Data Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartyType;