import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./PartyMaster.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const PartyMaster = () => {
  const navigate = useNavigate();

  const [parties, setParties] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  /* SEARCH FIELDS */
  const [partyCode, setPartyCode] = useState("");
  const [partyName, setPartyName] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  /* EDIT STATE */
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    partyCode: "",
    partyName: "",
    type: "",
    city: "",
    gstNo: "",
    mobile: "",
    payTerms: "",
    creditDays: "",
    status: "",
  });

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
    if (partyCode)
      filtered = filtered.filter((i) =>
        i.partyCode?.toLowerCase().includes(partyCode.toLowerCase())
      );
    if (partyName)
      filtered = filtered.filter((i) =>
        i.partyName?.toLowerCase().includes(partyName.toLowerCase())
      );
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

  /* DELETE */
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/party/${id}`);
      fetchParties();
    } catch (error) {
      console.log(error);
    }
  };

  /* EDIT */
  const handleEdit = (item) => {
    setEditId(item._id);
    setEditData({
      partyCode: item.partyCode,
      partyName: item.partyName,
      type: item.type,
      city: item.city,
      gstNo: item.gstNo,
      mobile: item.mobile,
      payTerms: item.payTerms,
      creditDays: item.creditDays,
      status: item.status,
    });
  };

  /* UPDATE */
  const handleUpdate = async (id) => {
    try {
      await axios.put(`${API_URL}/api/party/${id}`, editData);
      setEditId(null);
      fetchParties();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="transaction-page">
      <ModuleNavbar />

      {/* TOPBAR */}
      <div className="transaction-topbar">
        <h1>Party Master</h1>
        <button
          className="create-btn"
          onClick={() => navigate("/create-party")}
        >
          Create ▼
        </button>
      </div>

      {/* SEARCH */}
      <div className="search-container">
        <div className="search-title">Search</div>

        <div className="search-grid">
          <div className="form-group">
            <label>Party Code</label>
            <input
              type="text"
              value={partyCode}
              onChange={(e) => setPartyCode(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Party Name</label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">- Select -</option>
              <option>Customer</option>
              <option>Supplier</option>
              <option>Customer + Supplier</option>
              <option>Transporter</option>
              <option>Job Worker</option>
              <option>Service Provider</option>
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
          <button className="search-btn" onClick={handleSearch}>
            Search
          </button>
          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>
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
                <th>GST No</th>
                <th>Mobile</th>
                <th>Pay Terms</th>
                <th>Credit Days</th>
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
                        <input
                          type="text"
                          value={editData.partyCode}
                          onChange={(e) =>
                            setEditData({ ...editData, partyCode: e.target.value })
                          }
                        />
                      ) : (
                        item.partyCode
                      )}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <input
                          type="text"
                          value={editData.partyName}
                          onChange={(e) =>
                            setEditData({ ...editData, partyName: e.target.value })
                          }
                        />
                      ) : (
                        item.partyName
                      )}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <select
                          value={editData.type}
                          onChange={(e) =>
                            setEditData({ ...editData, type: e.target.value })
                          }
                        >
                          <option>Customer</option>
                          <option>Supplier</option>
                          <option>Customer + Supplier</option>
                          <option>Transporter</option>
                          <option>Job Worker</option>
                          <option>Service Provider</option>
                        </select>
                      ) : (
                        item.type
                      )}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <input
                          type="text"
                          value={editData.city}
                          onChange={(e) =>
                            setEditData({ ...editData, city: e.target.value })
                          }
                        />
                      ) : (
                        item.city
                      )}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <input
                          type="text"
                          value={editData.gstNo}
                          onChange={(e) =>
                            setEditData({ ...editData, gstNo: e.target.value })
                          }
                        />
                      ) : (
                        item.gstNo
                      )}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <input
                          type="text"
                          value={editData.mobile}
                          onChange={(e) =>
                            setEditData({ ...editData, mobile: e.target.value })
                          }
                        />
                      ) : (
                        item.mobile
                      )}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <select
                          value={editData.payTerms}
                          onChange={(e) =>
                            setEditData({ ...editData, payTerms: e.target.value })
                          }
                        >
                          <option value="">- Select -</option>
                          <option>Advance</option>
                          <option>Credit</option>
                          <option>COD</option>
                        </select>
                      ) : (
                        item.payTerms
                      )}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <input
                          type="number"
                          value={editData.creditDays}
                          onChange={(e) =>
                            setEditData({ ...editData, creditDays: e.target.value })
                          }
                        />
                      ) : (
                        item.creditDays
                      )}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <select
                          value={editData.status}
                          onChange={(e) =>
                            setEditData({ ...editData, status: e.target.value })
                          }
                        >
                          <option>Active</option>
                          <option>Inactive</option>
                        </select>
                      ) : (
                        item.status
                      )}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <button
                          className="save-btn"
                          onClick={() => handleUpdate(item._id)}
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="no-data">
                    No Data Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartyMaster;