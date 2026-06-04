import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../PartyMaster/PartyMaster.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const UOM_OPTIONS = ["MT", "KG", "PCS", "BUNDLE"];

const UOMMaster = () => {
  const navigate = useNavigate();

  const [uoms, setUoms] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [stockUOM, setStockUOM] = useState("");
  const [status, setStatus] = useState("");

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    stockUOM: "", purchaseUOM: "", salesUOM: "", conversionFactor: "", status: "",
  });

  const fetchUOMs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/uoms`);
      setUoms(res.data);
      setFilteredData(res.data);
    } catch (error) { console.log(error); }
  };

  useEffect(() => { fetchUOMs(); }, []);

  const handleSearch = () => {
    let filtered = [...uoms];
    if (stockUOM) filtered = filtered.filter((i) => i.stockUOM === stockUOM);
    if (status) filtered = filtered.filter((i) => i.status === status);
    setFilteredData(filtered);
  };

  const handleReset = () => {
    setStockUOM(""); setStatus("");
    setFilteredData(uoms);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/uom/${id}`);
      fetchUOMs();
    } catch (error) { console.log(error); }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setEditData({
      stockUOM: item.stockUOM, purchaseUOM: item.purchaseUOM,
      salesUOM: item.salesUOM, conversionFactor: item.conversionFactor,
      status: item.status,
    });
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`${API_URL}/api/uom/${id}`, editData);
      setEditId(null);
      fetchUOMs();
    } catch (error) { console.log(error); }
  };

  return (
    <div className="transaction-page">
      <ModuleNavbar />

      <div className="transaction-topbar">
        <h1>UOM Master</h1>
        <button className="create-btn" onClick={() => navigate("/create-uom")}>Create ▼</button>
      </div>

      <div className="search-container">
        <div className="search-title">Search</div>

        <div className="search-grid">
          <div className="form-group">
            <label>Stock UOM</label>
            <select value={stockUOM} onChange={(e) => setStockUOM(e.target.value)}>
              <option value="">- Select -</option>
              {UOM_OPTIONS.map((u) => <option key={u}>{u}</option>)}
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
                <th>Stock UOM</th>
                <th>Purchase UOM</th>
                <th>Sales UOM</th>
                <th>Conversion Factor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    {["stockUOM","purchaseUOM","salesUOM"].map((field) => (
                      <td key={field}>
                        {editId === item._id ? (
                          <select
                            value={editData[field]}
                            onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                          >
                            <option value="">- Select -</option>
                            {UOM_OPTIONS.map((u) => <option key={u}>{u}</option>)}
                          </select>
                        ) : item[field]}
                      </td>
                    ))}
                    <td>
                      {editId === item._id ? (
                        <input
                          type="number"
                          value={editData.conversionFactor}
                          onChange={(e) => setEditData({ ...editData, conversionFactor: e.target.value })}
                        />
                      ) : item.conversionFactor}
                    </td>
                    <td>
                      {editId === item._id ? (
                        <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
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
                <tr><td colSpan="7" className="no-data">No Data Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UOMMaster;