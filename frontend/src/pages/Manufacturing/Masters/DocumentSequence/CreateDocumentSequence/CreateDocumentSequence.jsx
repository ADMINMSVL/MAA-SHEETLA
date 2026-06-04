import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CreateDocumentSequence.css";
import ModuleNavbar from "../../../../../components/ModuleNavbar/ModuleNavbar";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../../../../config";
import { MODULE_BUSINESS_MAP, SOLUTION_MAP } from "../../../../../module/moduleBusinessMap";

/* ─── helper: build date segment (same logic as backend) ─── */
const buildDatePart = (format) => {
  const today = new Date();
  const dd    = String(today.getDate()).padStart(2, "0");
  const mm    = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy  = String(today.getFullYear());
  if (format === "mm/dd/yyyy") return `${mm}${dd}${yyyy}`;
  if (format === "yyyy/mm/dd") return `${yyyy}${mm}${dd}`;
  return `${dd}${mm}${yyyy}`;   // default: dd/mm/yyyy
};

/* ─── helper: build preview code ─── */
const buildPreviewCode = (module, businessEntity, sequenceFormat, incrementNo) => {
  if (!module || !businessEntity) return "";
  const datePart = buildDatePart(sequenceFormat);
  const padded   = String(Number(incrementNo) || 1).padStart(2, "0");
  return `${datePart}${padded}`;
};

const CreateDocumentSequence = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    module:         "",
    businessEntity: "",
    sequenceFormat: "dd/mm/yyyy",
    incrementNo:    1,
  });

  /* Live preview of next generated code */
  const [previewCode,   setPreviewCode]   = useState("");
  const [nextIncrement, setNextIncrement] = useState(1);
  const [loadingPreview, setLoadingPreview] = useState(false);

  /* Success popup */
  const [showPopup,     setShowPopup]     = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  /* Cascade helpers */
  const businessEntities = formData.module
    ? MODULE_BUSINESS_MAP[formData.module] || []
    : [];

  /* ── Whenever module / businessEntity changes, look up next increment ── */
  useEffect(() => {
    const { module, businessEntity, sequenceFormat } = formData;
    if (!module || !businessEntity) {
      setPreviewCode("");
      setNextIncrement(1);
      return;
    }

    const fetchNextIncrement = async () => {
      setLoadingPreview(true);
      try {
        /* Get existing sequences for this module + businessEntity */
        const res  = await axios.get(`${API_URL}/api/document-sequence`);
        const matching = res.data.filter(
          (r) => r.module === module && r.businessEntity === businessEntity
        );
        const next = matching.length > 0
          ? Math.max(...matching.map((r) => Number(r.incrementNo))) + 1
          : Number(formData.incrementNo) || 1;

        setNextIncrement(next);
        setPreviewCode(buildPreviewCode(module, businessEntity, sequenceFormat, next));
      } catch {
        /* Fall back to incrementNo from form */
        setNextIncrement(Number(formData.incrementNo) || 1);
        setPreviewCode(
          buildPreviewCode(module, businessEntity, sequenceFormat, formData.incrementNo)
        );
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchNextIncrement();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.module, formData.businessEntity]);

  /* ── Update preview whenever sequenceFormat changes ── */
  useEffect(() => {
    if (formData.module && formData.businessEntity) {
      setPreviewCode(
        buildPreviewCode(
          formData.module,
          formData.businessEntity,
          formData.sequenceFormat,
          nextIncrement
        )
      );
    }
  }, [formData.sequenceFormat, nextIncrement]);

  /* ── Field change handler ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "module") {
      setFormData({ ...formData, module: value, businessEntity: "" });
      setPreviewCode("");
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!formData.module || !formData.businessEntity) {
      return alert("Module and Business Entity are required.");
    }
    try {
      const res = await axios.post(`${API_URL}/api/create-document-sequence`, formData);
      setGeneratedCode(res.data.generatedCode);
      setShowPopup(true);
    } catch (err) {
      console.log(err);
      alert("Error Saving Document Sequence");
    }
  };

  /* Grouped module selector */
  const ModuleSelect = () => (
    <select name="module" value={formData.module} onChange={handleChange}>
      <option value="">- Select Module -</option>
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
    <div className="cds-page">
      <ModuleNavbar />

      {/* HEADER */}
      <div className="cds-header">
        <div className="cds-left">
          <button className="back-btn" onClick={() => navigate("/document-sequence")}>
            ←
          </button>
          <h2>Create Document Sequence</h2>
        </div>
      </div>

      {/* FORM */}
      <div className="cds-card">
        <div className="cds-grid">

          {/* MODULE */}
          <div className="cds-group">
            <label>* Module</label>
            <ModuleSelect />
          </div>

          {/* BUSINESS ENTITY — cascades from Module */}
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
              {businessEntities.map((be) => (
                <option key={be} value={be}>{be}</option>
              ))}
            </select>
          </div>

          {/* SEQUENCE FORMAT */}
          <div className="cds-group">
            <label>Sequence Format</label>
            <select
              name="sequenceFormat"
              value={formData.sequenceFormat}
              onChange={handleChange}
            >
              <option value="dd/mm/yyyy">dd/mm/yyyy</option>
              <option value="mm/dd/yyyy">mm/dd/yyyy</option>
              <option value="yyyy/mm/dd">yyyy/mm/dd</option>
            </select>
          </div>

          {/* INCREMENT NO */}
          <div className="cds-group">
            <label>Increment No</label>
            <input
              type="number"
              name="incrementNo"
              value={formData.incrementNo}
              onChange={handleChange}
              min={1}
            />
          </div>

          {/* ── LIVE PREVIEW: Generated GIN No ── */}
          {formData.module && formData.businessEntity && (
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
                Format: {formData.sequenceFormat === "dd/mm/yyyy" ? "DDMMYYYY" :
                         formData.sequenceFormat === "mm/dd/yyyy" ? "MMDDYYYY" :
                         "YYYYMMDD"} + increment
              </small>
            </div>
          )}

        </div>

        {/* ACTIONS */}
        <div className="cds-actions">
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!formData.module || !formData.businessEntity}
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