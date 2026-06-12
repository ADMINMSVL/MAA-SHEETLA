import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ItemInventory.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const GIN_API = `${API_URL}/api/goods-inward-note`;
const IC_API  = `${API_URL}/api/item-conversion`;
const ITEM_API = `${API_URL}/api/items`;

/* ── helpers ── */
const fmt = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtQty = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const today = new Date().toISOString().split("T")[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

const blankFilters = {
  itemCode: "",
  itemName: "",
  itemGroup: "",
  fromDate: thirtyDaysAgo,
  toDate: today,
  transactionCategory: "",
  vehicleEntry: "",
};

/* ── stock aggregator ──
   Builds per-item stock from GIN items arrays.
   Inward GINs ADD stock, Outward GINs SUBTRACT.
*/
const buildStockMap = (ginRecords) => {
  const map = {};

  const ensure = (code, name, uom) => {
    if (!map[code]) {
      map[code] = {
        itemCode: code,
        itemName: name || code,
        uom: uom || "",
        inwardQty: 0,
        outwardQty: 0,
        inwardValue: 0,
        outwardValue: 0,
        transactions: [],
      };
    }
  };

  ginRecords.forEach((gin) => {
    const isInward = (gin.vehicleEntry || gin.inOutType || "").toLowerCase() === "inward";
    const items = gin.items || [];
    items.forEach((item) => {
      const code = item.itemCode || item.itemName || "UNKNOWN";
      const name = item.itemName || code;
      const uom  = item.uom || "";
      const qty  = Number(item.qty  || 0);
      const rate = Number(item.rate || 0);
      const val  = qty * rate;

      ensure(code, name, uom);

      if (isInward) {
        map[code].inwardQty   += qty;
        map[code].inwardValue += val;
      } else {
        map[code].outwardQty   += qty;
        map[code].outwardValue += val;
      }

      map[code].transactions.push({
        date:     gin.ginDate || "-",
        ginNo:    gin.ginNo   || "-",
        type:     isInward ? "Inward" : "Outward",
        qty,
        rate,
        value: val,
        vendor: gin.vendorName || gin.partyName || "-",
        status: gin.status || "-",
      });
    });
  });

  return Object.values(map).map((s) => ({
    ...s,
    closingQty:   s.inwardQty - s.outwardQty,
    closingValue: s.inwardValue - s.outwardValue,
  }));
};

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
const ItemInventory = () => {
  const navigate = useNavigate();

  const [filters,   setFilters]   = useState(blankFilters);
  const [searched,  setSearched]  = useState(false);
  const [loading,   setLoading]   = useState(false);

  const [stockRows,    setStockRows]    = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemMasters,  setItemMasters]  = useState([]);

  /* summary KPIs */
  const [kpis, setKpis] = useState({
    totalItems: 0, totalInward: 0, totalOutward: 0,
    totalClosingQty: 0, totalClosingValue: 0,
  });

  /* fetch item master for group filter */
  useEffect(() => {
    axios.get(ITEM_API)
      .then((r) => setItemMasters(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const itemGroups = [...new Set(itemMasters.map((i) => i.itemGroup).filter(Boolean))];

  const handleChange = (e) =>
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleReset = () => {
    setFilters(blankFilters);
    setStockRows([]);
    setSelectedItem(null);
    setSearched(false);
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    setSelectedItem(null);

    try {
      const params = new URLSearchParams();
      if (filters.fromDate)           params.append("fromDate",           filters.fromDate);
      if (filters.toDate)             params.append("toDate",             filters.toDate);
      if (filters.vehicleEntry)       params.append("vehicleEntry",       filters.vehicleEntry);
      if (filters.transactionCategory) params.append("transactionCategory", filters.transactionCategory);

      const res = await axios.get(`${GIN_API}?${params.toString()}`);
      let gins = Array.isArray(res.data) ? res.data : [];

      /* client-side item code / name filter */
      if (filters.itemCode || filters.itemName || filters.itemGroup) {
        const code  = filters.itemCode.toLowerCase();
        const name  = filters.itemName.toLowerCase();
        const group = filters.itemGroup.toLowerCase();

        gins = gins.filter((gin) =>
          (gin.items || []).some((it) => {
            const master = itemMasters.find(
              (m) => m.itemCode === it.itemCode || m.itemName === it.itemName
            );
            return (
              (!code  || (it.itemCode  || "").toLowerCase().includes(code)) &&
              (!name  || (it.itemName  || "").toLowerCase().includes(name)) &&
              (!group || (master?.itemGroup || "").toLowerCase().includes(group))
            );
          })
        );
      }

      const rows = buildStockMap(gins);

      /* apply item-level filter after aggregation */
      const filtered = rows.filter((r) => {
        const code  = filters.itemCode.toLowerCase();
        const name  = filters.itemName.toLowerCase();
        return (
          (!code || r.itemCode.toLowerCase().includes(code)) &&
          (!name || r.itemName.toLowerCase().includes(name))
        );
      });

      setStockRows(filtered);

      setKpis({
        totalItems:       filtered.length,
        totalInward:      filtered.reduce((s, r) => s + r.inwardQty, 0),
        totalOutward:     filtered.reduce((s, r) => s + r.outwardQty, 0),
        totalClosingQty:  filtered.reduce((s, r) => s + r.closingQty, 0),
        totalClosingValue: filtered.reduce((s, r) => s + r.closingValue, 0),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch inventory data");
    } finally {
      setLoading(false);
    }
  }, [filters, itemMasters]);

  /* ── colour class for closing stock ── */
  const stockClass = (qty) =>
    qty <= 0 ? "ii-stock-nil" : qty < 10 ? "ii-stock-low" : "ii-stock-ok";

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="ii-page">
      <ModuleNavbar />

      {/* PAGE HEADER */}
      <div className="ii-page-header">
        <button className="ii-back-btn" onClick={() => navigate("/inventory")}>←</button>
        <div className="ii-header-title">
          <h2>Item Inventory</h2>
          <span className="ii-header-sub">Stock ledger by item · GIN-based</span>
        </div>
        <span className="ii-badge">M03II</span>
      </div>

      {/* BODY — 2-column split */}
      <div className="ii-body">

        {/* ══════════ LEFT — SEARCH PANEL ══════════ */}
        <aside className="ii-sidebar">
          <div className="ii-card">
            <div className="ii-section-title">
              <span className="ii-section-icon">🔍</span> Search Filters
            </div>

            <div className="ii-field">
              <label>Item Code</label>
              <input
                type="text"
                name="itemCode"
                value={filters.itemCode}
                onChange={handleChange}
                placeholder="e.g. RM001"
              />
            </div>

            <div className="ii-field">
              <label>Item Name</label>
              <input
                type="text"
                name="itemName"
                value={filters.itemName}
                onChange={handleChange}
                placeholder="Search by item name"
              />
            </div>

            <div className="ii-field">
              <label>Item Group</label>
              <select name="itemGroup" value={filters.itemGroup} onChange={handleChange}>
                <option value="">-- All Groups --</option>
                {itemGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="ii-field">
              <label>Transaction Category</label>
              <select name="transactionCategory" value={filters.transactionCategory} onChange={handleChange}>
                <option value="">-- All --</option>
                <option>Purchase</option>
                <option>Sales</option>
                <option>Transfer</option>
              </select>
            </div>

            <div className="ii-field">
              <label>Vehicle Entry</label>
              <select name="vehicleEntry" value={filters.vehicleEntry} onChange={handleChange}>
                <option value="">-- All --</option>
                <option value="Inward">Inward</option>
                <option value="Outward">Outward</option>
              </select>
            </div>

            <div className="ii-field">
              <label>From Date</label>
              <input type="date" name="fromDate" value={filters.fromDate} onChange={handleChange} />
            </div>

            <div className="ii-field">
              <label>To Date</label>
              <input type="date" name="toDate" value={filters.toDate} onChange={handleChange} />
            </div>

            <div className="ii-sidebar-actions">
              <button className="ii-reset-btn" onClick={handleReset}>Reset</button>
              <button className="ii-search-btn" onClick={handleSearch} disabled={loading}>
                {loading ? "Searching…" : "Search"}
              </button>
            </div>
          </div>

          {/* QUICK STATS (visible after search) */}
          {searched && !loading && (
            <div className="ii-card ii-quick-stats">
              <div className="ii-section-title">
                <span className="ii-section-icon">📊</span> Summary
              </div>
              <div className="ii-stat-row">
                <span className="ii-stat-label">Total Items</span>
                <span className="ii-stat-value">{kpis.totalItems}</span>
              </div>
              <div className="ii-stat-row">
                <span className="ii-stat-label">Total Inward Qty</span>
                <span className="ii-stat-value ii-val-in">{fmtQty(kpis.totalInward)}</span>
              </div>
              <div className="ii-stat-row">
                <span className="ii-stat-label">Total Outward Qty</span>
                <span className="ii-stat-value ii-val-out">{fmtQty(kpis.totalOutward)}</span>
              </div>
              <div className="ii-stat-row">
                <span className="ii-stat-label">Net Closing Qty</span>
                <span className={`ii-stat-value ${kpis.totalClosingQty >= 0 ? "ii-val-in" : "ii-val-out"}`}>
                  {fmtQty(kpis.totalClosingQty)}
                </span>
              </div>
              <div className="ii-stat-row ii-stat-row--total">
                <span className="ii-stat-label">Closing Stock Value</span>
                <span className="ii-stat-value">₹ {fmt(kpis.totalClosingValue)}</span>
              </div>
            </div>
          )}
        </aside>

        {/* ══════════ RIGHT — DASHBOARD ══════════ */}
        <main className="ii-main">

          {/* NOT YET SEARCHED */}
          {!searched && (
            <div className="ii-empty-state">
              <div className="ii-empty-icon">📦</div>
              <div className="ii-empty-title">Item Inventory Dashboard</div>
              <div className="ii-empty-sub">
                Use the filters on the left and click <strong>Search</strong> to load stock data.
              </div>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="ii-empty-state">
              <div className="ii-spinner"></div>
              <div className="ii-empty-sub">Fetching stock data…</div>
            </div>
          )}

          {/* RESULTS */}
          {searched && !loading && (

            <>
              {/* KPI BAR */}
              <div className="ii-kpi-bar">
                <div className="ii-kpi-card">
                  <div className="ii-kpi-label">Total Items</div>
                  <div className="ii-kpi-value">{kpis.totalItems}</div>
                </div>
                <div className="ii-kpi-card ii-kpi-inward">
                  <div className="ii-kpi-label">Total Inward</div>
                  <div className="ii-kpi-value">{fmtQty(kpis.totalInward)}</div>
                </div>
                <div className="ii-kpi-card ii-kpi-outward">
                  <div className="ii-kpi-label">Total Outward</div>
                  <div className="ii-kpi-value">{fmtQty(kpis.totalOutward)}</div>
                </div>
                <div className="ii-kpi-card ii-kpi-closing">
                  <div className="ii-kpi-label">Net Closing Qty</div>
                  <div className="ii-kpi-value">{fmtQty(kpis.totalClosingQty)}</div>
                </div>
                <div className="ii-kpi-card ii-kpi-value-card">
                  <div className="ii-kpi-label">Closing Value (₹)</div>
                  <div className="ii-kpi-value">₹ {fmt(kpis.totalClosingValue)}</div>
                </div>
              </div>

              {stockRows.length === 0 ? (
                <div className="ii-no-data">No inventory records found for the selected filters.</div>
              ) : (
                <div className="ii-results-area">

                  {/* STOCK TABLE */}
                  <div className="ii-card ii-table-card">
                    <div className="ii-section-title">
                      <span className="ii-section-icon">📋</span>
                      Stock Summary
                      <span className="ii-count">{stockRows.length} item(s) — click a row to see transactions</span>
                    </div>

                    <div className="ii-table-wrap">
                      <table className="ii-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Item Code</th>
                            <th>Item Name</th>
                            <th>UOM</th>
                            <th>Inward Qty</th>
                            <th>Outward Qty</th>
                            <th>Closing Qty</th>
                            <th>Inward Value (₹)</th>
                            <th>Outward Value (₹)</th>
                            <th>Closing Value (₹)</th>
                            <th>Stock Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockRows.map((row, idx) => (
                            <tr
                              key={row.itemCode}
                              className={`ii-tr ${selectedItem?.itemCode === row.itemCode ? "ii-tr--selected" : ""}`}
                              onClick={() => setSelectedItem(row)}
                            >
                              <td>{idx + 1}</td>
                              <td><span className="ii-code-chip">{row.itemCode}</span></td>
                              <td className="ii-item-name">{row.itemName}</td>
                              <td>{row.uom || "-"}</td>
                              <td className="ii-num ii-in">{fmtQty(row.inwardQty)}</td>
                              <td className="ii-num ii-out">{fmtQty(row.outwardQty)}</td>
                              <td className={`ii-num ii-closing ${stockClass(row.closingQty)}`}>
                                {fmtQty(row.closingQty)}
                              </td>
                              <td className="ii-num">{fmt(row.inwardValue)}</td>
                              <td className="ii-num">{fmt(row.outwardValue)}</td>
                              <td className="ii-num ii-closing-val">{fmt(row.closingValue)}</td>
                              <td>
                                <span className={`ii-stock-badge ${stockClass(row.closingQty)}`}>
                                  {row.closingQty <= 0
                                    ? "Out of Stock"
                                    : row.closingQty < 10
                                    ? "Low Stock"
                                    : "In Stock"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {/* TOTALS ROW */}
                        <tfoot>
                          <tr className="ii-totals-row">
                            <td colSpan={4}><strong>Grand Total</strong></td>
                            <td className="ii-num"><strong>{fmtQty(kpis.totalInward)}</strong></td>
                            <td className="ii-num"><strong>{fmtQty(kpis.totalOutward)}</strong></td>
                            <td className="ii-num"><strong>{fmtQty(kpis.totalClosingQty)}</strong></td>
                            <td className="ii-num"><strong>{fmt(stockRows.reduce((s, r) => s + r.inwardValue, 0))}</strong></td>
                            <td className="ii-num"><strong>{fmt(stockRows.reduce((s, r) => s + r.outwardValue, 0))}</strong></td>
                            <td className="ii-num"><strong>₹ {fmt(kpis.totalClosingValue)}</strong></td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* TRANSACTION DETAIL PANEL (appears when row is selected) */}
                  {selectedItem && (
                    <div className="ii-card ii-detail-card">
                      <div className="ii-detail-header">
                        <div className="ii-detail-title">
                          <span className="ii-section-icon">🧾</span>
                          Transaction History —&nbsp;
                          <strong>{selectedItem.itemName}</strong>
                          <span className="ii-detail-code">({selectedItem.itemCode})</span>
                        </div>
                        <button className="ii-close-detail-btn" onClick={() => setSelectedItem(null)}>✕</button>
                      </div>

                      {/* ITEM KPI STRIP */}
                      <div className="ii-item-kpi-strip">
                        <div className="ii-item-kpi">
                          <span className="ii-item-kpi-label">Inward Qty</span>
                          <span className="ii-item-kpi-val ii-val-in">{fmtQty(selectedItem.inwardQty)}</span>
                        </div>
                        <div className="ii-item-kpi">
                          <span className="ii-item-kpi-label">Outward Qty</span>
                          <span className="ii-item-kpi-val ii-val-out">{fmtQty(selectedItem.outwardQty)}</span>
                        </div>
                        <div className="ii-item-kpi">
                          <span className="ii-item-kpi-label">Closing Qty</span>
                          <span className={`ii-item-kpi-val ${stockClass(selectedItem.closingQty)}`}>
                            {fmtQty(selectedItem.closingQty)}
                          </span>
                        </div>
                        <div className="ii-item-kpi">
                          <span className="ii-item-kpi-label">Closing Value</span>
                          <span className="ii-item-kpi-val">₹ {fmt(selectedItem.closingValue)}</span>
                        </div>
                        <div className="ii-item-kpi">
                          <span className="ii-item-kpi-label">UOM</span>
                          <span className="ii-item-kpi-val">{selectedItem.uom || "-"}</span>
                        </div>
                        <div className="ii-item-kpi">
                          <span className="ii-item-kpi-label">Transactions</span>
                          <span className="ii-item-kpi-val">{selectedItem.transactions.length}</span>
                        </div>
                      </div>

                      {/* STOCK PROGRESS BAR */}
                      {(selectedItem.inwardQty + selectedItem.outwardQty) > 0 && (
                        <div className="ii-progress-wrap">
                          <div className="ii-progress-label">
                            <span>Inward</span>
                            <span>
                              {Math.round(
                                (selectedItem.inwardQty /
                                  (selectedItem.inwardQty + selectedItem.outwardQty)) *
                                  100
                              )}% received, {Math.round(
                                (selectedItem.outwardQty /
                                  (selectedItem.inwardQty + selectedItem.outwardQty)) *
                                  100
                              )}% issued
                            </span>
                            <span>Outward</span>
                          </div>
                          <div className="ii-progress-bar">
                            <div
                              className="ii-progress-in"
                              style={{
                                width: `${Math.round(
                                  (selectedItem.inwardQty /
                                    (selectedItem.inwardQty + selectedItem.outwardQty)) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* TRANSACTION TABLE */}
                      <div className="ii-table-wrap ii-txn-table-wrap">
                        <table className="ii-table ii-txn-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Date</th>
                              <th>GIN No</th>
                              <th>Type</th>
                              <th>Vendor / Party</th>
                              <th>Qty</th>
                              <th>Rate (₹)</th>
                              <th>Value (₹)</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...selectedItem.transactions]
                              .sort((a, b) => (a.date < b.date ? 1 : -1))
                              .map((txn, i) => (
                                <tr key={i} className={txn.type === "Inward" ? "ii-txn-in" : "ii-txn-out"}>
                                  <td>{i + 1}</td>
                                  <td>{txn.date}</td>
                                  <td><span className="ii-gin-chip">{txn.ginNo}</span></td>
                                  <td>
                                    <span className={`ii-type-badge ${txn.type.toLowerCase()}`}>
                                      {txn.type}
                                    </span>
                                  </td>
                                  <td>{txn.vendor}</td>
                                  <td className="ii-num">{fmtQty(txn.qty)}</td>
                                  <td className="ii-num">{fmt(txn.rate)}</td>
                                  <td className="ii-num">{fmt(txn.value)}</td>
                                  <td>
                                    <span className={`ii-status-badge ${(txn.status || "").toLowerCase()}`}>
                                      {txn.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ItemInventory;