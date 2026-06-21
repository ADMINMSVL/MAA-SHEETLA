import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DirectGRN.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const API = `${API_URL}/api/direct-grn`;

const EMPTY_FILTERS = {
  fromDate: "",
  toDate: "",
  grnNo: "",
  status: "",
  grnType: "",
  vendorCode: "",
  vendorName: "",
  vehicleNo: "",
  site: "",
  invoiceNo: "",
};

const DirectGRN = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState([]);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/sites`)
      .then((res) => setSites((Array.isArray(res.data) ? res.data : []).filter((s) => s.status !== "Inactive")))
      .catch(() => setSites([]));
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const fetchData = async (nextFilters = filters) => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const res = await axios.get(`${API}?${params.toString()}`);
      setResults(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error(err);
      setResults([]);
      alert("Failed to fetch Direct GRN records");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => fetchData(filters);

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="dgrn-page">
      <ModuleNavbar />

      <div className="dgrn-header">
        <h2>Direct GRN</h2>
        <div className="dgrn-create-wrap">
          <button className="dgrn-create-btn" onClick={() => setShowCreateMenu((prev) => !prev)}>
            + Create
          </button>
          {showCreateMenu && (
            <div className="dgrn-create-menu">
              <button onClick={() => navigate("/create-direct-grn")}>Create DGRN</button>
              <button onClick={() => navigate("/create-direct-grn", { state: { fromWeight: true } })}>
                Create From Weight
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="dgrn-body">
        <div className="dgrn-filter-panel">
          <div className="dgrn-filter-title">Search Filters</div>

          <div className="dgrn-filter-grid">
            <div className="dgrn-fg">
              <label>From Date</label>
              <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} />
            </div>

            <div className="dgrn-fg">
              <label>To Date</label>
              <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} />
            </div>

            <div className="dgrn-fg">
              <label>GRN No</label>
              <input name="grnNo" value={filters.grnNo} onChange={handleFilterChange} />
            </div>

            <div className="dgrn-fg">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option>Open</option>
                <option>Closed</option>
                <option>Draft</option>
              </select>
            </div>

            <div className="dgrn-fg">
              <label>GRN Type</label>
              <select name="grnType" value={filters.grnType} onChange={handleFilterChange}>
                <option value="">All</option>
                <option>F and A Impact</option>
                <option>Domestic</option>
                <option>International</option>
                <option>No Impact</option>
              </select>
            </div>

            <div className="dgrn-fg">
              <label>Vendor Code</label>
              <input name="vendorCode" value={filters.vendorCode} onChange={handleFilterChange} />
            </div>

            <div className="dgrn-fg">
              <label>Vendor Name</label>
              <input name="vendorName" value={filters.vendorName} onChange={handleFilterChange} />
            </div>

            <div className="dgrn-fg">
              <label>Vehicle No</label>
              <input name="vehicleNo" value={filters.vehicleNo} onChange={handleFilterChange} />
            </div>

            <div className="dgrn-fg">
              <label>Site</label>
              <select name="site" value={filters.site} onChange={handleFilterChange}>
                <option value="">All</option>
                {sites.map((site) => (
                  <option key={site._id} value={site.siteCode || site.siteName}>
                    {site.siteCode || site.siteName}
                    {site.siteName ? ` - ${site.siteName}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="dgrn-fg">
              <label>Invoice No</label>
              <input name="invoiceNo" value={filters.invoiceNo} onChange={handleFilterChange} />
            </div>
          </div>

          <div className="dgrn-filter-actions">
            <button className="dgrn-reset-btn" onClick={handleReset}>Reset</button>
            <button className="dgrn-apply-btn" onClick={handleApply} disabled={loading}>
              {loading ? "Searching..." : "Apply"}
            </button>
          </div>
        </div>

        <div className="dgrn-result-area">
          {!searched && !loading && <div className="dgrn-placeholder">Apply filters to display results</div>}
          {loading && <div className="dgrn-placeholder">Loading...</div>}
          {searched && !loading && results.length === 0 && <div className="dgrn-placeholder">No records found</div>}

          {searched && !loading && results.length > 0 && (
            <div className="dgrn-table-wrap">
              <table className="dgrn-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>GRN No</th>
                    <th>Date</th>
                    <th>Party Name</th>
                    <th>Inv No</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => (
                    <tr key={row._id || idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <button
                          className="dgrn-grn-link"
                          onClick={() => navigate(`/direct-grn-details/${row._id}`)}
                        >
                          {row.grnNo || "-"}
                        </button>
                      </td>
                      <td>{row.grnDate || "-"}</td>
                      <td>{row.vendorName || row.partyName || "-"}</td>
                      <td>{row.challanInvoiceNo || "-"}</td>
                      <td>{row.vehicleNo || "-"}</td>
                      <td>
                        <span className={`dgrn-badge dgrn-badge-${(row.status || "open").toLowerCase()}`}>
                          {row.status || "Open"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="dgrn-view-btn"
                          onClick={() => navigate(`/direct-grn-details/${row._id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectGRN;