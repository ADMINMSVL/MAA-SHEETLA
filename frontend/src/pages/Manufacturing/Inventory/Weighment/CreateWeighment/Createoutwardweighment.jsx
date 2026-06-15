// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import ModuleNavbar from "../../../../../components/ModuleNavbar/ModuleNavbar";
// import { API_URL } from "../../../../../config";

// const GIN_API       = `${API_URL}/api/goods-inward-note`;
// const WEIGHMENT_API = `${API_URL}/api/weighment`;
// const today         = new Date().toISOString().split("T")[0];

// const blankFilters = {
//   ginNumber: "", vendorCode: "", vehicleNo: "", poCpoNo: "",
//   transactionCategory: "", status: "", fromDate: "", toDate: "",
// };

// const CreateOutwardWeighment = () => {
//   const navigate = useNavigate();

//   const [filters,  setFilters]  = useState(blankFilters);
//   const [results,  setResults]  = useState([]);
//   const [searched, setSearched] = useState(false);
//   const [loading,  setLoading]  = useState(false);
//   const [creating, setCreating] = useState(null);

//   const handleFilterChange = (e) =>
//     setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

//   const handleSearch = async () => {
//     setLoading(true);
//     setSearched(true);
//     try {
//       const params = new URLSearchParams();
//       params.append("vehicleEntry", "Outward");
//       Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
//       const res = await axios.get(`${GIN_API}?${params.toString()}`);
//       setResults(Array.isArray(res.data) ? res.data : res.data?.data || []);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to fetch GIN records");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     setFilters(blankFilters);
//     setResults([]);
//     setSearched(false);
//   };

//   /* ─── Click GIN No — check existing or create Outward weighment ─── */
//   const openOrCreate = async (e, gin) => {
//     e.stopPropagation();
//     const ginNo = gin?.ginNo;
//     if (!ginNo) { alert("GIN number not found"); return; }
//     setCreating(ginNo);

//     try {
//       /* 1. Check if weighment already exists */
//       const searchRes  = await axios.get(WEIGHMENT_API, {
//         params: { inwardOutwardNoteNo: ginNo, transactionType: "Outward" },
//       });
//       const list     = searchRes.data?.data || [];
//       const existing = list.find((w) => w.inwardOutwardNoteNo === ginNo) || list[0];

//       if (existing?._id) {
//         navigate(`/weighment-detail/${existing._id}`);
//         return;
//       }

//       /* 2. Get doc-sequence number */
//       const seqRes = await axios.get(`${WEIGHMENT_API}/next-no`, {
//         params: { transactionType: "Outward" },
//       });
//       const weighmentNo = seqRes.data?.weighmentNo || `OT${today.replace(/-/g, "").slice(2)}0001`;

//       /* 3. Create new Outward weighment */
//       const payload = {
//         weighmentNo,
//         transactionType:     "Outward",
//         transactionCategory: gin.transactionCategory || "",
//         status:              "Draft",
//         inwardOutwardNoteNo: gin.ginNo,
//         vehicleNo:           gin.vehicleNo         || "",
//         partyName:           gin.vendorName         || "",
//         site:                gin.site               || "Factory Office-GYPMART INDIA",
//         weighmentDate:       gin.ginDate            || today,
//         weighmentInDate:     gin.ginDate            || today,
//         weighmentOutDate:    gin.ginDate            || today,
//         supplierInvoiceNo:   gin.challanInvoiceNo   || "",
//         supplierInvoiceDate: gin.challanDate         || today,
//         billNo:              gin.billNo             || "",
//         billDate:            gin.billDate            || today,
//         remarks:             gin.remarks            || "",
//         vendorCode:          gin.vendorCode         || "",
//         vendorName:          gin.vendorName         || "",
//         poCpoNo:             gin.poCpoNo            || "",
//         manufacturerName:    gin.manufacturerName   || "",
//         manufacturerCode:    gin.manufacturerCode   || "",
//         challanDate:         gin.challanDate        || "",
//         ewayDate:            gin.ewayDate           || "",
//       };

//       const createRes = await axios.post(WEIGHMENT_API, payload);
//       if (createRes.data?.success && createRes.data?.data?._id) {
//         navigate(`/weighment-detail/${createRes.data.data._id}`);
//       } else {
//         alert("Failed to create weighment: " + (createRes.data?.message || "Unknown error"));
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Error: " + (err.response?.data?.message || err.message));
//     } finally {
//       setCreating(null);
//     }
//   };

//   return (
//     <div className="ciw-page">
//       <ModuleNavbar />

//       {/* ── Header ── */}
//       <div className="ciw-page-header">
//         <button className="ciw-back-btn" onClick={() => navigate("/weighment-search")}>←</button>
//         <h2>Create Outward Weighment</h2>
//         <span className="ciw-badge outward">Outward</span>
//       </div>

//       {/* ── Filters ── */}
//       <div className="ciw-card">
//         <div className="ciw-section-title">Search Outward GIN Records</div>
//         <div className="ciw-search-grid">

//           <div className="ciw-field">
//             <label>GIN Number</label>
//             <input type="text" name="ginNumber" value={filters.ginNumber}
//               onChange={handleFilterChange} placeholder="GIN/26-27/..." />
//           </div>

//           <div className="ciw-field">
//             <label>Vendor Code</label>
//             <input type="text" name="vendorCode" value={filters.vendorCode} onChange={handleFilterChange} />
//           </div>

//           <div className="ciw-field">
//             <label>Vehicle No</label>
//             <input type="text" name="vehicleNo" value={filters.vehicleNo} onChange={handleFilterChange} />
//           </div>

//           <div className="ciw-field">
//             <label>PO / CPO No</label>
//             <input type="text" name="poCpoNo" value={filters.poCpoNo} onChange={handleFilterChange} />
//           </div>

//           <div className="ciw-field">
//             <label>Transaction Category</label>
//             <select name="transactionCategory" value={filters.transactionCategory} onChange={handleFilterChange}>
//               <option value="">-- All --</option>
//               <option>Purchase</option>
//               <option>Sales</option>
//             </select>
//           </div>

//           <div className="ciw-field">
//             <label>Status</label>
//             <select name="status" value={filters.status} onChange={handleFilterChange}>
//               <option value="">-- All --</option>
//               <option>Open</option>
//               <option>Closed</option>
//             </select>
//           </div>

//           <div className="ciw-field">
//             <label>From Date</label>
//             <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} />
//           </div>

//           <div className="ciw-field">
//             <label>To Date</label>
//             <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} />
//           </div>

//         </div>
//         <div className="ciw-search-actions">
//           <button className="ciw-reset-btn" onClick={handleReset}>Reset</button>
//           <button className="ciw-search-btn" onClick={handleSearch} disabled={loading}>
//             {loading ? "Searching..." : "Search"}
//           </button>
//         </div>
//       </div>

//       {/* ── Results ── */}
//       {searched && (
//         <div className="ciw-card ciw-results-card">
//           <div className="ciw-section-title">
//             Outward GIN Records
//             {results.length > 0 && (
//               <span className="ciw-count">
//                 {results.length} record(s) — click GIN No to open / create weighment
//               </span>
//             )}
//           </div>

//           {loading && <div className="ciw-placeholder">Loading...</div>}

//           {!loading && results.length === 0 && (
//             <div className="ciw-placeholder">No Outward GIN records found</div>
//           )}

//           {!loading && results.length > 0 && (
//             <div className="ciw-table-wrap">
//               <table className="ciw-table">
//                 <thead>
//                   <tr>
//                     <th>#</th>
//                     <th>GIN No</th>
//                     <th>GIN Date</th>
//                     <th>Vehicle No</th>
//                     <th>PO / CPO No</th>
//                     <th>Transaction Category</th>
//                     <th>Vendor Code</th>
//                     <th>Vendor Name</th>
//                     <th>Manufacturer Name</th>
//                     <th>Bill No</th>
//                     <th>Bill Date</th>
//                     <th>Remarks</th>
//                     <th>Status</th>
//                     <th>Linked Weighment</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {results.map((row, idx) => (
//                     <tr key={row._id || idx}>
//                       <td>{idx + 1}</td>

//                       <td>
//                         <button
//                           className="ciw-gin-no-link"
//                           onClick={(e) => openOrCreate(e, row)}
//                           disabled={creating === row.ginNo}
//                           title={row.weighmentNo
//                             ? `Open: ${row.weighmentNo}`
//                             : "Click to create weighment"}
//                         >
//                           {creating === row.ginNo ? "..." : (row.ginNo || "—")}
//                         </button>
//                       </td>

//                       <td>{row.ginDate            || "—"}</td>
//                       <td>{row.vehicleNo           || "—"}</td>
//                       <td>{row.poCpoNo             || "—"}</td>
//                       <td>{row.transactionCategory || "—"}</td>
//                       <td>{row.vendorCode          || "—"}</td>
//                       <td>{row.vendorName          || "—"}</td>
//                       <td>{row.manufacturerName    || "—"}</td>
//                       <td>{row.billNo              || "—"}</td>
//                       <td>{row.billDate            || "—"}</td>
//                       <td>{row.remarks             || "—"}</td>
//                       <td>
//                         <span className={`ciw-status-badge ${(row.status || "").toLowerCase()}`}>
//                           {row.status || "—"}
//                         </span>
//                       </td>
//                       <td>
//                         {row.weighmentNo
//                           ? <span className="ciw-wt-linked">✓ {row.weighmentNo}</span>
//                           : <span className="ciw-wt-none">Not linked</span>}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       )}

//       <style>{`
//         .ciw-page { background: #f4f6fb; min-height: 100vh; padding-bottom: 40px; }
//         .ciw-page-header {
//           display: flex; align-items: center; gap: 12px;
//           padding: 14px 20px; background: #fff;
//           border-bottom: 1.5px solid #e5e7eb;
//         }
//         .ciw-back-btn {
//           background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px;
//           padding: 6px 12px; font-size: 16px; cursor: pointer;
//         }
//         .ciw-page-header h2 { flex: 1; margin: 0; font-size: 17px; font-weight: 700; color: #1e293b; }
//         .ciw-badge {
//           padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;
//         }
//         .ciw-badge.inward  { background: #dcfce7; color: #166534; }
//         .ciw-badge.outward { background: #fef3c7; color: #92400e; }

//         .ciw-card {
//           background: #fff; border-radius: 10px; border: 1px solid #e5e7eb;
//           margin: 12px 16px; padding: 16px 20px;
//           box-shadow: 0 1px 3px rgba(0,0,0,.04);
//         }
//         .ciw-section-title {
//           font-size: 13px; font-weight: 700; color: #374151;
//           border-bottom: 1.5px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 14px;
//           display: flex; align-items: center; justify-content: space-between;
//         }
//         .ciw-count { font-size: 12px; font-weight: 500; color: #6366f1; }

//         .ciw-search-grid {
//           display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 16px;
//         }
//         @media (max-width: 1000px) { .ciw-search-grid { grid-template-columns: repeat(3, 1fr); } }
//         @media (max-width: 700px)  { .ciw-search-grid { grid-template-columns: repeat(2, 1fr); } }
//         @media (max-width: 480px)  { .ciw-search-grid { grid-template-columns: 1fr; } }

//         .ciw-field { display: flex; flex-direction: column; gap: 4px; }
//         .ciw-field label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; }
//         .ciw-field input, .ciw-field select {
//           border: 1px solid #d1d5db; border-radius: 6px; padding: 7px 10px;
//           font-size: 13px; color: #1e293b; outline: none;
//         }
//         .ciw-field input:focus, .ciw-field select:focus { border-color: #6366f1; }

//         .ciw-search-actions {
//           display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;
//           padding-top: 12px; border-top: 1px solid #f1f5f9;
//         }
//         .ciw-reset-btn {
//           padding: 7px 18px; background: #f9fafb; border: 1px solid #d1d5db;
//           border-radius: 6px; font-size: 13px; cursor: pointer; color: #374151;
//         }
//         .ciw-search-btn {
//           padding: 7px 22px; background: #f59e0b; color: #fff; border: none;
//           border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer;
//         }
//         .ciw-search-btn:hover:not(:disabled) { background: #d97706; }

//         .ciw-results-card { padding: 14px 20px; }
//         .ciw-placeholder { text-align: center; padding: 30px; color: #9ca3af; font-size: 14px; }
//         .ciw-table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb; }
//         .ciw-table { width: 100%; border-collapse: collapse; font-size: 12px; white-space: nowrap; }
//         .ciw-table thead { background: #fffbeb; }
//         .ciw-table th {
//           padding: 9px 10px; text-align: left; font-size: 11px;
//           font-weight: 700; color: #374151; border-bottom: 1.5px solid #fde68a;
//         }
//         .ciw-table td {
//           padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #374151;
//         }
//         .ciw-table tbody tr:hover { background: #fffbeb; }

//         .ciw-gin-no-link {
//           background: none; border: none; color: #d97706; font-weight: 700;
//           font-size: 12px; cursor: pointer; padding: 0; text-decoration: underline;
//           text-underline-offset: 2px;
//         }
//         .ciw-gin-no-link:hover { color: #b45309; }
//         .ciw-gin-no-link:disabled { color: #9ca3af; cursor: default; }

//         .ciw-status-badge {
//           display: inline-block; padding: 2px 8px; border-radius: 12px;
//           font-size: 11px; font-weight: 600;
//         }
//         .ciw-status-badge.open   { background: #dcfce7; color: #166534; }
//         .ciw-status-badge.closed { background: #fee2e2; color: #991b1b; }

//         .ciw-wt-linked { color: #16a34a; font-size: 11px; font-weight: 600; }
//         .ciw-wt-none   { color: #9ca3af; font-size: 11px; }
//       `}</style>
//     </div>
//   );
// };

// export default CreateOutwardWeighment;