import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../MasterShared.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const SIZES = [
  { key: "size8",  label: "8"  },
  { key: "size10", label: "10" },
  { key: "size12", label: "12" },
  { key: "size16", label: "16" },
  { key: "size20", label: "20" },
  { key: "size25", label: "25" },
];

const SchemeMaster = () => {
  const navigate = useNavigate();
  const [data, setData]         = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("");
  const [expanded, setExpanded] = useState(null); // which scheme row is expanded

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/schemes`);
      setData(res.data); setFiltered(res.data);
    } catch (err) { console.log(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = () => {
    let f = [...data];
    if (search) f = f.filter((i) => i.schemeName?.toLowerCase().includes(search.toLowerCase()));
    if (status) f = f.filter((i) => i.status === status);
    setFiltered(f);
  };

  const handleReset = () => { setSearch(""); setStatus(""); setFiltered(data); };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API_URL}/api/scheme/${id}`); fetchData(); }
    catch (err) { console.log(err); }
  };

  return (
    <div className="transaction-page">
      <ModuleNavbar />
      <div className="transaction-topbar">
        <h1>Scheme Master</h1>
        <button className="create-btn" onClick={() => navigate("/create-scheme")}>Create ▼</button>
      </div>

      <div className="search-container">
        <div className="search-title">Search</div>
        <div className="search-grid">
          <div className="form-group">
            <label>Scheme Name</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search scheme..." />
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

        {/* MAIN LIST TABLE */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>S No</th>
                <th>Scheme Name</th>
                <th>Basic Price (X)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((item, i) => (
                <React.Fragment key={item._id}>
                  <tr>
                    <td>{i + 1}</td>
                    <td>{item.schemeName}</td>
                    <td>₹ {item.basicPrice?.toLocaleString("en-IN")}</td>
                    <td>{item.status}</td>
                    <td>
                      <button className="edit-btn"
                        onClick={() => setExpanded(expanded === item._id ? null : item._id)}>
                        {expanded === item._id ? "Hide" : "View"} Matrix
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                    </td>
                  </tr>

                  {/* INLINE PRICE MATRIX */}
                  {expanded === item._id && (
                    <tr>
                      <td colSpan="5" style={{ padding: "0 20px 20px", background: "#f9f9f9" }}>
                        <div style={{ paddingTop: "12px" }}>
                          <strong style={{ fontSize: "13px", color: "#444" }}>
                            Price Matrix — BASIC (X) = ₹ {item.basicPrice?.toLocaleString("en-IN")}
                          </strong>
                          <table className="scheme-matrix" style={{ marginTop: "10px" }}>
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
                                  <td>₹ {item.prices?.[key]?.raipur?.toLocaleString("en-IN") ?? "-"}</td>
                                  <td>₹ {item.prices?.[key]?.raipurBasic?.toLocaleString("en-IN") ?? "-"}</td>
                                  <td>₹ {item.prices?.[key]?.for12mm?.toLocaleString("en-IN") ?? "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )) : <tr><td colSpan="5" className="no-data">No Data Found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchemeMaster;