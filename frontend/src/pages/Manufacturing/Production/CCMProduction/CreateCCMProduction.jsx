import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CCMProduction.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const API = `${API_URL}/api/ccm-production`;
const today = new Date().toISOString().split("T")[0];

const blankBillet  = (sNo) => ({ sNo, billetSize: "", grade: "", qty: "", _checked: false });
const blankInput   = (sNo) => ({ sNo, material: "Liquid Steel", heatQty: "", uom: "MT", _checked: false });

const genCCMNo = () => `CCM/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${Math.floor(100000 + Math.random() * 900000)}`;

const CreateCCMProduction = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    ccmNo: genCCMNo(),
    ccmDate: today,
    shift: "A",
    heatNo: "",
    site: "Factory Office-GYPMART INDIA",
    furnaceNo: "",
    operator: "",
    remarks: "",
    status: "Open",
  });

  const [inputs,  setInputs]  = useState([blankInput(1)]);
  const [outputs, setOutputs] = useState([blankBillet(1)]);
  const [losses,  setLosses]  = useState({ scrap: "", rejection: "" });

  /* ── derived totals ── */
  const totalInput  = inputs.reduce((s, r) => s + (parseFloat(r.heatQty) || 0), 0);
  const totalOutput = outputs.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);
  const totalLoss   = (parseFloat(losses.scrap) || 0) + (parseFloat(losses.rejection) || 0);
  const yieldPct    = totalInput > 0 ? ((totalOutput / totalInput) * 100).toFixed(2) : "0.00";

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  /* Input rows */
  const handleInputChange = (idx, field, val) =>
    setInputs((p) => p.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  const addInputRow = () =>
    setInputs((p) => [...p, blankInput(p.length + 1)]);
  const removeInputRow = (idx) =>
    setInputs((p) => p.filter((_, i) => i !== idx).map((r, i) => ({ ...r, sNo: i + 1 })));

  /* Output rows */
  const handleOutputChange = (idx, field, val) =>
    setOutputs((p) => p.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  const addOutputRow = () =>
    setOutputs((p) => [...p, blankBillet(p.length + 1)]);
  const removeOutputRow = (idx) =>
    setOutputs((p) => p.filter((_, i) => i !== idx).map((r, i) => ({ ...r, sNo: i + 1 })));

  const handleSave = async () => {
    if (!form.heatNo.trim()) { alert("Heat No is required"); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        inputs: inputs.filter((r) => r.heatQty),
        outputs: outputs.filter((r) => r.qty),
        scrapQty:       parseFloat(losses.scrap) || 0,
        rejectionQty:   parseFloat(losses.rejection) || 0,
        totalLossQty:   totalLoss,
        inputQty:       totalInput,
        totalBilletQty: totalOutput,
        yieldPct:       parseFloat(yieldPct),
      };
      const res = await axios.post(API, payload);
      if (res.data?.success) {
        alert("CCM Production saved!");
        navigate("/ccm-production");
      } else {
        alert("Save failed: " + (res.data?.message || "Unknown"));
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  return (
    <div className="ccm-page">
      <ModuleNavbar />

      <div className="ccm-header">
        <div className="ccm-header-left">
          <button className="ccm-back-btn" onClick={() => navigate("/ccm-production")}>← CCM List</button>
          <div>
            <h2>Create CCM Entry</h2>
            <span className="ccm-subtitle">Record continuous casting machine production</span>
          </div>
        </div>
      </div>

      {/* HEADER FIELDS */}
      <div className="ccm-card">
        <div className="ccm-section-title">📋 Header Information</div>
        <div className="ccm-form-grid">

          <div className="ccm-field">
            <label>CCM No <span className="req">*</span></label>
            <input name="ccmNo" value={form.ccmNo} readOnly className="ccm-readonly-input" />
          </div>

          <div className="ccm-field">
            <label>CCM Date <span className="req">*</span></label>
            <input type="date" name="ccmDate" value={form.ccmDate} onChange={handleChange} />
          </div>

          <div className="ccm-field">
            <label>Shift <span className="req">*</span></label>
            <select name="shift" value={form.shift} onChange={handleChange}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>

          <div className="ccm-field">
            <label>Heat No <span className="req">*</span></label>
            <input name="heatNo" value={form.heatNo} onChange={handleChange} placeholder="e.g. H-2601" />
          </div>

          <div className="ccm-field">
            <label>Furnace No</label>
            <input name="furnaceNo" value={form.furnaceNo} onChange={handleChange} placeholder="e.g. F-01" />
          </div>

          <div className="ccm-field">
            <label>Operator</label>
            <input name="operator" value={form.operator} onChange={handleChange} placeholder="Operator name" />
          </div>

          <div className="ccm-field">
            <label>Site</label>
            <select name="site" value={form.site} onChange={handleChange}>
              <option>Factory Office-GYPMART INDIA</option>
            </select>
          </div>

          <div className="ccm-field">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option>Open</option><option>Draft</option><option>Closed</option>
            </select>
          </div>

        </div>

        <div className="ccm-field" style={{ marginTop: 12 }}>
          <label>Remarks</label>
          <textarea rows="2" name="remarks" value={form.remarks} onChange={handleChange} placeholder="Enter remarks…" />
        </div>
      </div>

      {/* INPUT MATERIALS */}
      <div className="ccm-card">
        <div className="ccm-items-header">
          <span className="ccm-section-title">🔥 Input Materials</span>
          <button className="ccm-add-row-btn" onClick={addInputRow}>+ Add Row</button>
        </div>
        <div className="ccm-table-wrap">
          <table className="ccm-table">
            <thead>
              <tr>
                <th style={{width:50}}>#</th>
                <th>Input Material</th>
                <th>Heat Qty (MT)</th>
                <th>UOM</th>
                <th style={{width:60}}>Del</th>
              </tr>
            </thead>
            <tbody>
              {inputs.map((row, idx) => (
                <tr key={idx}>
                  <td className="ccm-sno">{row.sNo}</td>
                  <td>
                    <input className="ccm-item-input ccm-item-wide"
                      value={row.material}
                      onChange={(e) => handleInputChange(idx, "material", e.target.value)}
                      placeholder="e.g. Liquid Steel" />
                  </td>
                  <td>
                    <input type="number" className="ccm-item-input ccm-item-num"
                      value={row.heatQty}
                      onChange={(e) => handleInputChange(idx, "heatQty", e.target.value)}
                      placeholder="0" min="0" step="0.001" />
                  </td>
                  <td>
                    <input className="ccm-item-input ccm-item-sm"
                      value={row.uom}
                      onChange={(e) => handleInputChange(idx, "uom", e.target.value)}
                      placeholder="MT" />
                  </td>
                  <td>
                    <button className="ccm-rm-row-btn" onClick={() => removeInputRow(idx)}>✕</button>
                  </td>
                </tr>
              ))}
              <tr className="ccm-total-row">
                <td colSpan={2}><strong>Total Input</strong></td>
                <td><strong>{totalInput.toFixed(3)} MT</strong></td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* OUTPUT — BILLETS */}
      <div className="ccm-card">
        <div className="ccm-items-header">
          <span className="ccm-section-title">🧱 Output — Billets</span>
          <button className="ccm-add-row-btn" onClick={addOutputRow}>+ Add Row</button>
        </div>
        <div className="ccm-table-wrap">
          <table className="ccm-table">
            <thead>
              <tr>
                <th style={{width:50}}>#</th>
                <th>Billet Size (mm)</th>
                <th>Grade</th>
                <th>Qty (MT)</th>
                <th style={{width:60}}>Del</th>
              </tr>
            </thead>
            <tbody>
              {outputs.map((row, idx) => (
                <tr key={idx}>
                  <td className="ccm-sno">{row.sNo}</td>
                  <td>
                    <select className="ccm-item-input"
                      value={row.billetSize}
                      onChange={(e) => handleOutputChange(idx, "billetSize", e.target.value)}>
                      <option value="">-- Select --</option>
                      <option>100×100</option>
                      <option>130×130</option>
                      <option>150×150</option>
                      <option>Other</option>
                    </select>
                  </td>
                  <td>
                    <select className="ccm-item-input"
                      value={row.grade}
                      onChange={(e) => handleOutputChange(idx, "grade", e.target.value)}>
                      <option value="">-- Select --</option>
                      <option>Fe500</option>
                      <option>Fe550</option>
                      <option>Fe600</option>
                    </select>
                  </td>
                  <td>
                    <input type="number" className="ccm-item-input ccm-item-num"
                      value={row.qty}
                      onChange={(e) => handleOutputChange(idx, "qty", e.target.value)}
                      placeholder="0" min="0" step="0.001" />
                  </td>
                  <td>
                    <button className="ccm-rm-row-btn" onClick={() => removeOutputRow(idx)}>✕</button>
                  </td>
                </tr>
              ))}
              <tr className="ccm-total-row">
                <td colSpan={3}><strong>Total Billet Output</strong></td>
                <td><strong>{totalOutput.toFixed(3)} MT</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* LOSSES + YIELD */}
      <div className="ccm-card">
        <div className="ccm-section-title">📉 Losses & Yield</div>
        <div className="ccm-loss-grid">
          <div className="ccm-field">
            <label>Scrap (MT)</label>
            <input type="number" value={losses.scrap}
              onChange={(e) => setLosses((p) => ({ ...p, scrap: e.target.value }))}
              placeholder="0" min="0" step="0.001" />
          </div>
          <div className="ccm-field">
            <label>Rejection (MT)</label>
            <input type="number" value={losses.rejection}
              onChange={(e) => setLosses((p) => ({ ...p, rejection: e.target.value }))}
              placeholder="0" min="0" step="0.001" />
          </div>
          <div className="ccm-field">
            <label>Total Loss (MT)</label>
            <input value={totalLoss.toFixed(3)} readOnly className="ccm-readonly-input" />
          </div>
          <div className="ccm-field">
            <label>Yield %</label>
            <input value={yieldPct + "%"} readOnly
              className={`ccm-readonly-input ${parseFloat(yieldPct) >= 90 ? "ccm-yield-good" : "ccm-yield-warn"}`} />
          </div>
        </div>
        <div className="ccm-inventory-note">
          <strong>Inventory Effect:</strong>
          <span className="inv-down">↓ Liquid Steel reduced</span>
          <span className="inv-up">↑ Billets added</span>
          <span className="inv-up">↑ Scrap added</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="ccm-actions">
        <button className="ccm-cancel-btn" onClick={() => navigate("/ccm-production")} disabled={loading}>Cancel</button>
        <button className="ccm-save-btn" onClick={handleSave} disabled={loading}>
          {loading ? "Saving…" : "Save CCM Entry"}
        </button>
      </div>
    </div>
  );
};

export default CreateCCMProduction;