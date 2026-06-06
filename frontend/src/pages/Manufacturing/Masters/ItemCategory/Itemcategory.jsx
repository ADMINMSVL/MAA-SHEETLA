import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../MasterShared.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const ItemCategory = () => {
  const navigate = useNavigate();

  const [data,     setData]     = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [editId,   setEditId]   = useState(null);
  const [editData, setEditData] = useState({ categoryName: "", description: "", status: "" });

  const [suggestions, setSuggestions] = useState([]);
  const [showSug,     setShowSug]     = useState(false);
  const sugRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/item-categories`);
      setData(res.data);
      setFiltered(res.data);
    } catch (err) { console.log(err); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (sugRef.current && !sugRef.current.contains(e.target)) setShowSug(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchInput = (val) => {
    setSearch(val);
    if (val.trim()) {
      const lower = val.toLowerCase();
      const matches = [...new Set(data.map((d) => d.categoryName).filter((n) => n?.toLowerCase().includes(lower)))].sort();
      setSuggestions(matches);
      setShowSug(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSug(false);
    }
  };

  const handleSuggestionClick = (name) => { setSearch(name); setShowSug(false); };

  const handleSearch = () => {
    setShowSug(false);
    let f = [...data];
    if (search) f = f.filter((i) => i.categoryName?.toLowerCase().includes(search.toLowerCase()));
    if (status) f = f.filter((i) => i.status === status);
    setFiltered(f);
  };

  const handleReset = () => {
    setSearch(""); setStatus(""); setSuggestions([]); setShowSug(false);
    setFiltered(data);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
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
        <button className="create-btn" onClick={() => navigate("/create-item-category")}>Create ▼</button>
      </div>

      <div className="search-container">
        <div className="search-title">Search</div>

        <div className="search-grid">

          <div className="form-group" style={{ position: "relative" }} ref={sugRef}>
            <label>Category Name</label>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => search && suggestions.length > 0 && setShowSug(true)}
              placeholder="Type to search…"
              autoComplete="off"
            />
            {showSug && (
              <ul className="suggestion-list">
                {suggestions.map((s) => (
                  <li key={s} onClick={() => handleSuggestionClick(s)}>{s}</li>
                ))}
              </ul>
            )}
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
          <button className="reset-btn"  onClick={handleReset}>Reset</button>
        </div>

        <div className="table-container">
          <table style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "50px" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "35%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "120px" }} />
            </colgroup>
            <thead>
              <tr>
                <th>S No</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Status</th>
                <th className="action-col">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item, i) => (
                  <tr key={item._id}>
                    <td>{i + 1}</td>
                    <td title={item.categoryName}>
                      {editId === item._id ? (
                        <input type="text" value={editData.categoryName}
                          onChange={(e) => setEditData({ ...editData, categoryName: e.target.value })} />
                      ) : item.categoryName}
                    </td>
                    <td title={item.description}>
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
                    <td className="action-col">
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