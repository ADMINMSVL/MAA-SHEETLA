import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../PartyMaster/PartyMaster.css"; // shared styles
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const ItemMaster = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    itemCode: "", itemName: "", category: "", uom: "",
    hsn: "", gstPercent: "", grade: "", size: "", status: "",
  });

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/items`);
      setItems(res.data);
      setFilteredData(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSearch = () => {
    let filtered = [...items];
    if (itemCode) filtered = filtered.filter((i) => i.itemCode?.toLowerCase().includes(itemCode.toLowerCase()));
    if (itemName) filtered = filtered.filter((i) => i.itemName?.toLowerCase().includes(itemName.toLowerCase()));
    if (category) filtered = filtered.filter((i) => i.category?.toLowerCase().includes(category.toLowerCase()));
    if (status) filtered = filtered.filter((i) => i.status === status);
    setFilteredData(filtered);
  };

  const handleReset = () => {
    setItemCode(""); setItemName(""); setCategory(""); setStatus("");
    setFilteredData(items);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/item/${id}`);
      fetchItems();
    } catch (error) { console.log(error); }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setEditData({
      itemCode: item.itemCode, itemName: item.itemName, category: item.category,
      uom: item.uom, hsn: item.hsn, gstPercent: item.gstPercent,
      grade: item.grade, size: item.size, status: item.status,
    });
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`${API_URL}/api/item/${id}`, editData);
      setEditId(null);
      fetchItems();
    } catch (error) { console.log(error); }
  };

  return (
    <div className="transaction-page">
      <ModuleNavbar />

      <div className="transaction-topbar">
        <h1>Item Master</h1>
        <button className="create-btn" onClick={() => navigate("/create-item")}>Create ▼</button>
      </div>

      <div className="search-container">
        <div className="search-title">Search</div>

        <div className="search-grid">
          <div className="form-group">
            <label>Item Code</label>
            <input type="text" value={itemCode} onChange={(e) => setItemCode(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Item Name</label>
            <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
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
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>UOM</th>
                <th>HSN</th>
                <th>GST %</th>
                <th>Grade</th>
                <th>Size</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    {["itemCode","itemName","category","uom","hsn","gstPercent","grade","size"].map((field) => (
                      <td key={field}>
                        {editId === item._id ? (
                          <input
                            type={field === "gstPercent" ? "number" : "text"}
                            value={editData[field]}
                            onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                          />
                        ) : (
                          item[field]
                        )}
                      </td>
                    ))}
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
                <tr><td colSpan="11" className="no-data">No Data Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ItemMaster;