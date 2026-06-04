import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../MasterShared.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const CATEGORY_OPTIONS = [
  "Raw Material",
  "Semi Finished",
  "Finished Goods",
  "Consumables",
  "Packing Material",
  "Scrap",
  "Service",
];

const ItemCategory = () => {
  const navigate = useNavigate();

  const [data, setData]           = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState("");
  const [editId, setEditId]       = useState(null);
  const [editData, setEditData]   = useState({ categoryName: "", description: "", status: "" });

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/item-categories`);
      setData(res.data);
      setFiltered(res.data);
    } catch (err) { console.log(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = () => {
    let f = [...data];
    if (search) f = f.filter((i) => i.categoryName?.toLowerCase().includes(search.toLowerCase()));
    if (status) f = f.filter((i) => i.status === status);
    setFiltered(f);
  };

  const handleReset = () => { setSearch(""); setStatus(""); setFiltered(data); };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API_URL}/api/item-category/${id}`); fetchData(); }
    catch (err) { console.log(err); }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setEditData({ categoryName: item.categoryName, description: item.description, status: item.status });
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`${API_URL}/api/item-category/${id}`, editData);
      setEditId(null);
      fetchData();
    } catch (err) { console.log(err); }
  };

  return (
    <div className="transaction-page">
      <ModuleNavbar />

      <div className="transaction-topbar">
        <h1>Item Category</h1>
        <button className="create-btn" onClick={() => navigate("/create-item-category")}>
          Create ▼
        </button>
      </div>

      <div className="search-container">
        <div className="search-title">Search</div>

        <div className="search-grid">
          <div className="form-group">
            <label>Category Name</label>
            <select value={search} onChange={(e) => setSearch(e.target.value)}>
              <option value="">- Select -</option>
              {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
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
                <th>Category Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item, i) => (
                  <tr key={item._id}>
                    <td>{i + 1}</td>
                    <td>
                      {editId === item._id ? (
                        <select value={editData.categoryName}
                          onChange={(e) => setEditData({ ...editData, categoryName: e.target.value })}>
                          {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      ) : item.categoryName}
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

export default ItemCategory;