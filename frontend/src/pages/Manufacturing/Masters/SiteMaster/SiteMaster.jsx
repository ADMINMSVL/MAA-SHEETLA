import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../PartyMaster/PartyMaster.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";
import { MODULE_BUSINESS_MAP, MODULES, SOLUTION_MAP } from "../../../../config/moduleBusinessMap";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh",
];

const SiteMaster = () => {
  const navigate = useNavigate();

  const [data,     setData]     = useState([]);
  const [filtered, setFiltered] = useState([]);

  /* ── SEARCH FIELDS ── */
  const [filterModule,   setFilterModule]   = useState("");
  const [filterBusiness, setFilterBusiness] = useState("");
  const [filterSiteCode, setFilterSiteCode] = useState("");
  const [filterStatus,   setFilterStatus]   = useState("");

  /* ── EDIT STATE ── */
  const [editId,   setEditId]   = useState(null);
  const [editData, setEditData] = useState({
    module: "", businessEntity: "", siteCode: "", siteName: "",
    address: "", city: "", state: "", pinCode: "",
    contactPerson: "", mobile: "", gstNo: "", status: "",
  });

  /* Business entities for search cascade */
  const searchBusinessEntities = filterModule
    ? MODULE_BUSINESS_MAP[filterModule] || []
    : [];

  /* Business entities for inline edit cascade */
  const editBusinessEntities = editData.module
    ? MODULE_BUSINESS_MAP[editData.module] || []
    : [];

  /* ── FETCH ── */
  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sites`);
      setData(res.data);
      setFiltered(res.data);
    } catch (err) { console.log(err); }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── SEARCH ── */
  const handleSearch = () => {
    let f = [...data];
    if (filterModule)   f = f.filter((i) => i.module === filterModule);
    if (filterBusiness) f = f.filter((i) => i.businessEntity === filterBusiness);
    if (filterSiteCode) f = f.filter((i) =>
      i.siteCode?.toLowerCase().includes(filterSiteCode.toLowerCase())
    );
    if (filterStatus)   f = f.filter((i) => i.status === filterStatus);
    setFiltered(f);
  };

  const handleReset = () => {
    setFilterModule(""); setFilterBusiness("");
    setFilterSiteCode(""); setFilterStatus("");
    setFiltered(data);
  };

  /* ── DELETE ── */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this site?")) return;
    try {
      await axios.delete(`${API_URL}/api/site/${id}`);
      fetchData();
    } catch (err) { console.log(err); }
  };

  /* ── EDIT ── */
  const handleEdit = (item) => {
    setEditId(item._id);
    setEditData({
      module: item.module, businessEntity: item.businessEntity,
      siteCode: item.siteCode, siteName: item.siteName,
      address: item.address || "", city: item.city || "",
      state: item.state || "", pinCode: item.pinCode || "",
      contactPerson: item.contactPerson || "", mobile: item.mobile || "",
      gstNo: item.gstNo || "", status: item.status,
    });
  };

  /* ── UPDATE ── */
  const handleUpdate = async (id) => {
    try {
      await axios.put(`${API_URL}/api/site/${id}`, editData);
      setEditId(null);
      fetchData();
    } catch (err) { console.log(err); }
  };

  /* Reusable grouped module <select> */
  const ModuleSelect = ({ value, onChange, placeholder = "- All Modules -" }) => (
    <select value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {Object.entries(SOLUTION_MAP).map(([solution, mods]) => (
        <optgroup key={solution} label={`── ${solution} ──`}>
          {mods.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  return (
    <div className="transaction-page">
      <ModuleNavbar />

      {/* TOPBAR */}
      <div className="transaction-topbar">
        <h1>Site Master</h1>
        <button className="create-btn" onClick={() => navigate("/create-site")}>
          Create ▼
        </button>
      </div>

      {/* SEARCH */}
      <div className="search-container">
        <div className="search-title">Search</div>

        <div className="search-grid">

          <div className="form-group">
            <label>Module</label>
            <ModuleSelect
              value={filterModule}
              onChange={(e) => { setFilterModule(e.target.value); setFilterBusiness(""); }}
            />
          </div>

          <div className="form-group">
            <label>Business Entity</label>
            <select
              value={filterBusiness}
              onChange={(e) => setFilterBusiness(e.target.value)}
              disabled={!filterModule}
            >
              <option value="">
                {filterModule ? "- All Entities -" : "- Select Module first -"}
              </option>
              {searchBusinessEntities.map((be) => (
                <option key={be} value={be}>{be}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Site Code</label>
            <input
              type="text"
              value={filterSiteCode}
              onChange={(e) => setFilterSiteCode(e.target.value)}
              placeholder="Search..."
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">- All -</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

        </div>

        <div className="button-group">
          <button className="search-btn" onClick={handleSearch}>Search</button>
          <button className="reset-btn"  onClick={handleReset}>Reset</button>
        </div>

        {/* TABLE */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>S No</th>
                <th>Module</th>
                <th>Business Entity</th>
                <th>Site Code</th>
                <th>Site Name</th>
                <th>City</th>
                <th>State</th>
                <th>Pin Code</th>
                <th>Contact Person</th>
                <th>Mobile</th>
                <th>GST No</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item, i) => (
                  <tr key={item._id}>
                    <td>{i + 1}</td>

                    {/* MODULE — inline edit */}
                    <td>
                      {editId === item._id ? (
                        <ModuleSelect
                          value={editData.module}
                          placeholder="- Select -"
                          onChange={(e) =>
                            setEditData({ ...editData, module: e.target.value, businessEntity: "" })
                          }
                        />
                      ) : item.module}
                    </td>

                    {/* BUSINESS ENTITY — cascades in edit */}
                    <td>
                      {editId === item._id ? (
                        <select
                          value={editData.businessEntity}
                          onChange={(e) =>
                            setEditData({ ...editData, businessEntity: e.target.value })
                          }
                          disabled={!editData.module}
                        >
                          <option value="">- Select -</option>
                          {editBusinessEntities.map((be) => (
                            <option key={be} value={be}>{be}</option>
                          ))}
                        </select>
                      ) : item.businessEntity}
                    </td>

                    {/* SIMPLE TEXT FIELDS */}
                    {["siteCode","siteName","city","state","pinCode","contactPerson","mobile","gstNo"].map((field) => (
                      <td key={field}>
                        {editId === item._id ? (
                          <input
                            type="text"
                            value={editData[field] ?? ""}
                            onChange={(e) =>
                              setEditData({ ...editData, [field]: e.target.value })
                            }
                          />
                        ) : (item[field] || "—")}
                      </td>
                    ))}

                    {/* STATUS */}
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
                        <span style={{ color: item.status === "Active" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                          {item.status}
                        </span>
                      )}
                    </td>

                    {/* ACTION */}
                    <td style={{ whiteSpace: "nowrap" }}>
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
                <tr><td colSpan="13" className="no-data">No Data Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SiteMaster;