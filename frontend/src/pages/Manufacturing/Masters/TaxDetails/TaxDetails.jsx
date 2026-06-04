import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../MasterShared.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const TaxDetails = () => {
  const navigate = useNavigate();
  const [data, setData]         = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [hsnCode, setHsnCode]   = useState("");
  const [status, setStatus]     = useState("");
  const [editId, setEditId]     = useState(null);
  const [editData, setEditData] = useState({ hsnCode: "", gstPercent: "", description: "", status: "" });

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tax-details`);
      setData(res.data); setFiltered(res.data);
    } catch (err) { console.log(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = () => {
    let f = [...data];
    if (hsnCode) f = f.filter((i) => i.hsnCode?.toLowerCase().includes(hsnCode.toLowerCase()));
    if (status)  f = f.filter((i) => i.status === status);
    setFiltered(f);
  };

  const handleReset = () => { setHsnCode(""); setStatus(""); setFiltered(data); };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API_URL}/api/tax-details/${id}`); fetchData(); }
    catch (err) { console.log(err); }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setEditData({ hsnCode: item.hsnCode, gstPercent: item.gstPercent, description: item.description, status: item.status });
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`${API_URL}/api/tax-details/${id}`, editData);
      setEditId(null); fetchData();
    } catch (err) { console.log(err); }
  };

  return (
    <div className="transaction-page">
      <ModuleNavbar />
      <div className="transaction-topbar">
        <h1>Tax Details</h1>
        <button className="create-btn" onClick={() => navigate("/create-tax-details")}>Create ▼</button>
      </div>

      <div className="search-container">
        <div className="search-title">Search</div>
        <div className="search-grid">
          <div className="form-group">
            <label>HSN Code</label>
            <input type="text" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="Search HSN..." />
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
                <th>S No</th><th>HSN Code</th><th>GST %</th><th>Description</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td>
                    {editId === item._id ? (
                      <input type="text" value={editData.hsnCode}
                        onChange={(e) => setEditData({ ...editData, hsnCode: e.target.value })} />
                    ) : item.hsnCode}
                  </td>
                  <td>
                    {editId === item._id ? (
                      <input type="number" value={editData.gstPercent}
                        onChange={(e) => setEditData({ ...editData, gstPercent: e.target.value })} />
                    ) : `${item.gstPercent}%`}
                  </td>
                  <td>
                    {editId === item._id ? (
                      <input type="text" value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
                    ) : item.description}
                  </td>
                  <td>
                    {editId === item._id ? (
                      <select value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                        <option>Active</option><option>Inactive</option>
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
              )) : <tr><td colSpan="6" className="no-data">No Data Found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaxDetails;