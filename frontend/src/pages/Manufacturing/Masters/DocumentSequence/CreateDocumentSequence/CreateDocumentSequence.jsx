import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CreateDocumentSequence.css";
import ModuleNavbar from "../../../../../components/ModuleNavbar/ModuleNavbar";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../../../../config";
import { MODULE_BUSINESS_MAP, SOLUTION_MAP } from "../../../../../module/moduleBusinessMap";

/* ── helpers ──────────────────────────────────────────────────────────── */
const buildDatePart = (format) => {
  const today = new Date();
  const dd   = String(today.getDate()).padStart(2, "0");
  const mm   = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = String(today.getFullYear());

  if (format === "mm/dd/yyyy") return `${mm}${dd}${yyyy}`;
  if (format === "yyyy/mm/dd") return `${yyyy}${mm}${dd}`;
  return `${dd}${mm}${yyyy}`;
};

const buildPreviewCode = ({ entityPrefix, sequenceFormat, useDateFragment, sequenceDigits }, incrementNo) => {
  const prefix = entityPrefix.trim().toUpperCase();
  if (!prefix) return "";

  const digits   = Math.max(1, Number(sequenceDigits) || 2);
  const datePart = useDateFragment ? buildDatePart(sequenceFormat) : "";
  const padded   = String(Number(incrementNo) || 1).padStart(digits, "0");
  return `${prefix}${datePart}${padded}`;
};

/* ── component ────────────────────────────────────────────────────────── */
const CreateDocumentSequence = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    module:          "",
    businessEntity:  "",
    entityPrefix:    "",
    sequenceFormat:  "dd/mm/yyyy",
    useDateFragment: true,
    incrementNo:     1,
    sequenceDigits:  2,           // NEW — default 2 digits ("01")
  });

  const [previewCode,    setPreviewCode]    = useState("");
  const [nextIncrement,  setNextIncrement]  = useState(1);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showPopup,      setShowPopup]      = useState(false);
  const [generatedCode,  setGeneratedCode]  = useState("");

  const businessEntities = formData.module
    ? MODULE_BUSINESS_MAP[formData.module] || []
    : [];

  /* fetch next increment whenever module / entity / prefix changes */
  useEffect(() => {
    const { module, businessEntity, entityPrefix } = formData;
    const prefix = entityPrefix.trim().toUpperCase();

    if (!module || !businessEntity || !prefix) {
      setPreviewCode("");
      setNextIncrement(1);
      return;
    }

    const fetchNextIncrement = async () => {
      setLoadingPreview(true);
      try {
        const res      = await axios.get(`${API_URL}/api/document-sequence`);
        const matching = res.data.filter(
          (r) =>
            r.module         === module &&
            r.businessEntity === businessEntity &&
            r.entityPrefix   === prefix
        );
        const next = matching.length > 0
          ? Math.max(...matching.map((r) => Number(r.incrementNo))) + 1
          : Number(formData.incrementNo) || 1;

        setNextIncrement(next);
        setPreviewCode(buildPreviewCode(formData, next));
      } catch {
        const fallback = Number(formData.incrementNo) || 1;
        setNextIncrement(fallback);
        setPreviewCode(buildPreviewCode(formData, fallback));
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchNextIncrement();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.module, formData.businessEntity, formData.entityPrefix]);

  /* rebuild preview whenever format / digits / toggle change */
  useEffect(() => {
    setPreviewCode(buildPreviewCode(formData, nextIncrement));
  }, [formData.sequenceFormat, formData.useDateFragment, formData.sequenceDigits, nextIncrement]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "module") {
      setFormData({ ...formData, module: value, businessEntity: "" });
      setPreviewCode("");
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async () => {
    if (!formData.module || !formData.businessEntity || !formData.entityPrefix.trim()) {
      return alert("Module, Business Entity and Entity Prefix are required.");
    }

    try {
      const payload = {
        ...formData,
        entityPrefix:   formData.entityPrefix.trim().toUpperCase(),
        sequenceDigits: Number(formData.sequenceDigits) || 2,
      };
      const res = await axios.post(`${API_URL}/api/create-document-sequence`, payload);
      setGeneratedCode(res.data.generatedCode);
      setShowPopup(true);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Error Saving Document Sequence");
    }
  };

  /* digit preview string shown next to the input */
  const digitPreviewStr = String(nextIncrement)
    .padStart(Math.max(1, Number(formData.sequenceDigits) || 2), "0");

  return (
    <div className="cds-page">
      <ModuleNavbar />

      <div className="cds-header">
        <div className="cds-left">
          <button className="back-btn" onClick={() => navigate("/document-sequence")}>
            ← Back
          </button>
          <h2>Create Document Sequence</h2>
        </div>
      </div>

      <div className="cds-card">
        <div className="cds-grid">

          {/* MODULE */}
          <div className="cds-group">
            <label>* Module</label>
            <select name="module" value={formData.module} onChange={handleChange}>
              <option value="">- Select Module -</option>
              {Object.entries(SOLUTION_MAP).map(([solution, mods]) => (
                <optgroup key={solution} label={solution}>
                  {mods.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* BUSINESS ENTITY */}
          <div className="cds-group">
            <label>* Business Entity</label>
            <select
              name="businessEntity"
              value={formData.businessEntity}
              onChange={handleChange}
              disabled={!formData.module}
            >
              <option value="">
                {formData.module ? "- Select -" : "- Select Module first -"}
              </option>
              {businessEntities.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* ENTITY PREFIX */}
          <div className="cds-group">
            <label>* Entity Prefix</label>
            <input
              type="text"
              name="entityPrefix"
              value={formData.entityPrefix}
              onChange={handleChange}
              placeholder="e.g. IN, GIN, PO"
            />
          </div>

          {/* SEQUENCE DIGITS — NEW */}
          <div className="cds-group">
            <label>Sequence Digits</label>
            <input
              type="number"
              name="sequenceDigits"
              value={formData.sequenceDigits}
              onChange={handleChange}
              min={1}
              max={10}
              placeholder="e.g. 2 → 01, 4 → 0001"
            />
            {formData.sequenceDigits >= 1 && (
              <small className="cds-preview-hint">
                Running number will look like: <strong>{digitPreviewStr}</strong>
              </small>
            )}
          </div>

          {/* INCREMENT NO (starting number) */}
          <div className="cds-group">
            <label>Starting Sequence No</label>
            <input
              type="number"
              name="incrementNo"
              value={formData.incrementNo}
              onChange={handleChange}
              min={1}
            />
          </div>

          {/* DATE FRAGMENT */}
          <div className="cds-group">
            <label>
              <input
                type="checkbox"
                name="useDateFragment"
                checked={formData.useDateFragment}
                onChange={handleChange}
                style={{ marginRight: 8 }}
              />
              Use Date Fragment
            </label>
            <select
              name="sequenceFormat"
              value={formData.sequenceFormat}
              onChange={handleChange}
              disabled={!formData.useDateFragment}
            >
              <option value="dd/mm/yyyy">dd/mm/yyyy</option>
              <option value="mm/dd/yyyy">mm/dd/yyyy</option>
              <option value="yyyy/mm/dd">yyyy/mm/dd</option>
            </select>
          </div>

          {/* PREVIEW */}
          {formData.entityPrefix.trim() && (
            <div className="cds-group cds-preview-group">
              <label>Generated No (Preview)</label>
              <div className="cds-preview-box">
                {loadingPreview ? (
                  <span className="cds-preview-loading">Calculating…</span>
                ) : (
                  <span className="cds-preview-code">{previewCode}</span>
                )}
              </div>
              <small className="cds-preview-hint">
                Format: Prefix
                {formData.useDateFragment ? " + date" : ""}
                {" + "}
                {Math.max(1, Number(formData.sequenceDigits) || 2)}-digit sequence no
              </small>
            </div>
          )}

        </div>

        <div className="cds-actions">
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={
              !formData.module ||
              !formData.businessEntity ||
              !formData.entityPrefix.trim()
            }
          >
            Save
          </button>
        </div>
      </div>

      {/* SUCCESS POPUP */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div className="popup-header">Document Sequence Created</div>
            <div className="popup-content">
              <p>Transaction Code Generated</p>
              <h2 style={{ color: "#16a34a", letterSpacing: 2 }}>{generatedCode}</h2>
            </div>
            <button
              className="popup-btn"
              onClick={() => {
                setShowPopup(false);
                navigate("/document-sequence");
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDocumentSequence;
