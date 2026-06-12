import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./CCMProduction.css";
import ModuleNavbar from "../../../../components/ModuleNavbar/ModuleNavbar";
import { API_URL } from "../../../../config";

const API = `${API_URL}/api/ccm-production`;

const CCMDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    axios.get(`${API}/${id}`)
      .then((r) => {
        const d = r.data?.data || r.data;
        setData(d);
        setForm({ ...d });
      })
      .catch(() => { alert("Failed to load record"); navigate(-1); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/${id}`, form);
      if (res.data?.success) {
        setData(res.data.data);
        setForm({ ...res.data.data });
        setEditing(false);
        alert("Saved successfully!");
      }
    } catch (err) { alert("Save failed: " + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this CCM record?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      navigate("/ccm-production");
    } catch { alert("Delete failed"); }
  };

  if (loading) return <div className="ccm-loading">Loading…</div>;
  if (!data)   return <div className="ccm-error">Record not found</div>;

  const F = ({ label, field, type, opts }) => (
    <div className="ccm-field">
      <label>{label}</label>
      {editing && !["ccmNo"].includes(field) ? (
        opts ? (
          <select name={field} value={form[field] || ""} onChange={handleChange} className="ccm-input">
            {opts.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type || "text"} name={field} value={form[field] || ""} onChange={handleChange} className="ccm-input" />
        )
      ) : (
        <div className="ccm-value">{data[field] || "-"}</div>
      )}
    </div>
  );

  return (
    <div className="ccm-page">
      <ModuleNavbar />

      <div className="ccm-header">
        <div className="ccm-header-left">
          <button className="ccm-back-btn" onClick={() => navigate("/ccm-production")}>← CCM List</button>
          <div>
            <h2>CCM Detail</h2>
            <span className="ccm-no-badge">{data.ccmNo}</span>
            <span className={`ccm-status-badge ${(data.status || "").toLowerCase()}`}>{data.status}</span>
          </div>
        </div>
        <div className="ccm-header-actions">
          {!editing ? (
            <>
              <button className="ccm-edit-btn-lg" onClick={() => setEditing(true)}>Edit</button>
              <button className="ccm-del-btn-lg" onClick={handleDelete}>Delete</button>
            </>
          ) : (
            <>
              <button className="ccm-save-btn" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
              <button className="ccm-cancel-btn" onClick={() => { setEditing(false); setForm({ ...data }); }}>Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="ccm-card">
        <div className="ccm-section-title">📋 Header</div>
        <div className="ccm-form-grid">
          <F label="CCM No"     field="ccmNo" />
          <F label="Date"       field="ccmDate"   type="date" />
          <F label="Shift"      field="shift"     opts={["A","B","C"]} />
          <F label="Heat No"    field="heatNo" />
          <F label="Furnace No" field="furnaceNo" />
          <F label="Operator"   field="operator" />
          <F label="Site"       field="site" />
          <F label="Status"     field="status"    opts={["Open","Draft","Closed"]} />
        </div>
        <div className="ccm-field" style={{ marginTop: 12 }}>
          <label>Remarks</label>
          {editing
            ? <textarea rows="2" name="remarks" value={form.remarks || ""} onChange={handleChange} />
            : <div className="ccm-value">{data.remarks || "-"}</div>}
        </div>
      </div>

      {/* INPUTS */}
      <div className="ccm-card">
        <div className="ccm-section-title">🔥 Input Materials</div>
        <div className="ccm-table-wrap">
          <table className="ccm-table">
            <thead>
              <tr><th>#</th><th>Material</th><th>Heat Qty (MT)</th><th>UOM</th></tr>
            </thead>
            <tbody>
              {(data.inputs || []).map((r, i) => (
                <tr key={i}>
                  <td>{r.sNo || i + 1}</td>
                  <td>{r.material || "-"}</td>
                  <td>{r.heatQty || "-"}</td>
                  <td>{r.uom || "MT"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OUTPUTS */}
      <div className="ccm-card">
        <div className="ccm-section-title">🧱 Output — Billets</div>
        <div className="ccm-table-wrap">
          <table className="ccm-table">
            <thead>
              <tr><th>#</th><th>Billet Size</th><th>Grade</th><th>Qty (MT)</th></tr>
            </thead>
            <tbody>
              {(data.outputs || []).map((r, i) => (
                <tr key={i}>
                  <td>{r.sNo || i + 1}</td>
                  <td>{r.billetSize || "-"}</td>
                  <td>{r.grade || "-"}</td>
                  <td>{r.qty || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOSSES & YIELD */}
      <div className="ccm-card">
        <div className="ccm-section-title">📉 Losses & Yield</div>
        <div className="ccm-loss-grid">
          {[
            { label: "Total Input (MT)",   val: data.inputQty },
            { label: "Total Billet (MT)",  val: data.totalBilletQty },
            { label: "Scrap (MT)",         val: data.scrapQty },
            { label: "Rejection (MT)",     val: data.rejectionQty },
            { label: "Total Loss (MT)",    val: data.totalLossQty },
            { label: "Yield %",            val: data.yieldPct != null ? data.yieldPct + "%" : "-", highlight: true },
          ].map((f) => (
            <div className="ccm-field" key={f.label}>
              <label>{f.label}</label>
              <div className={`ccm-value ${f.highlight ? (parseFloat(f.val) >= 90 ? "ccm-yield-good" : "ccm-yield-warn") : ""}`}>
                {f.val != null ? f.val : "-"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CCMDetail;