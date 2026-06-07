import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CreateDocumentSequence.css";
import ModuleNavbar from "../../../../../components/ModuleNavbar/ModuleNavbar";
import { useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../../../../../config";
import { MODULE_BUSINESS_MAP, SOLUTION_MAP } from "../../../../../module/moduleBusinessMap";

/* ── helpers ──────────────────────────────────────────────────────────── */
const buildDatePart = (format) => {
  const today = new Date();
  const dd  = String(today.getDate()).padStart(2, "0");
  const mm  = String(today.getMonth() + 1).padStart(2, "0");
  const yy  = String(today.getFullYear()).slice(-2);

  if (format === "mm/dd/yy") return `${mm}${dd}${yy}`;
  if (format === "yy/mm/dd") return `${yy}${mm}${dd}`;
  return `${dd}${mm}${yy}`;
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
  const location = useLocation();

  const prefillModule = location.state?.module || "";

  const [formData, setFormData] = useState({
    module:              prefillModule,
    businessEntity:      "",
    transactionCategory: "",   // NEW
    entityPrefix:        "",
    sequenceFormat:      "dd/mm/yy",
    useDateFragment:     true,
    incrementNo:         1,
    sequenceDigits:      2,
  });

  const [previewCode,    setPreviewCode]    = useState("");
  const [nextIncrement,  setNextIncrement]  = useState(1);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showPopup,      setShowPopup]      = useState(false);
  const [generatedCode,  setGeneratedCode]  = useState("");

  /* Transaction categories fetched from Transaction master */
  const [transactionCategories, setTransactionCategories] = useState([]);

  const businessEntities = formData.module
    ? MODULE_BUSINESS_MAP[formData.module] || []
    : [];

  /* ── Fetch transaction categories when module + businessEntity are set ── */
  useEffect(() => {
    if (!formData.module || !formData.businessEntity) {
      setTransactionCategories([]);
      setFormData((prev) => ({ ...prev, transactionCategory: "" }));
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/transactions`);
        const filtered = res.data.filter(
          (t) =>
            t.module         === formData.module &&
            t.businessEntity === formData.businessEntity &&
            t.status         === "Open"
        );
        setTransactionCategories(filtered);
      } catch (err) {
        console.error("Failed to fetch transaction categories:", err);
        setTransactionCategories([]);
      }
    };

    fetchCategories();
  }, [formData.module, formData.businessEntity]);

  /* ── When a transaction category is selected, auto-fill entityPrefix with its code ── */
  useEffect(() => {
    if (!formData.transactionCategory) return;

    const matched = transactionCategories.find(
      (t) => t._id === formData.transactionCategory || t.transactionCategoryCode === formData.transactionCategory
    );
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        entityPrefix: matched.transactionCategoryCode,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.transactionCategory]);

  /* ── Fetch next increment whenever module / entity / prefix changes ── */
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

  /* ── Rebuild preview on format / digits / toggle change ── */
  useEffect(() => {
    setPreviewCode(buildPreviewCode(formData, nextIncrement));
  }, [formData.sequenceFormat, formData.useDateFragment, formData.sequenceDigits, nextIncrement]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "module") {
      setFormData({
        ...formData,
        module:              value,
        businessEntity:      "",
        transactionCategory: "",
        entityPrefix:        "",
      });
      setPreviewCode("");
      return;
    }

    if (name === "businessEntity") {
      setFormData({
        ...formData,
        businessEntity:      value,
        transactionCategory: "",
        entityPrefix:        "",
      });
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
      /* Find the selected transaction category description for storage */
      const selectedCat = transactionCategories.find(
        (t) => t._id === formData.transactionCategory ||
               t.transactionCategoryCode === formData.transactionCategory
      );

      const payload = {
        ...formData,
        entityPrefix:        formData.entityPrefix.trim().toUpperCase(),
        sequenceDigits:      Number(formData.sequenceDigits) || 2,
        transactionCategory: selectedCat?.categoryDescription || formData.transactionCategory || "",
      };
      const res = await axios.post(`${API_URL}/api/create-document-sequence`, payload);
      setGeneratedCode(res.data.generatedCode);
      setShowPopup(true);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Error Saving Document Sequence");
    }
  };

  const digitPreviewStr = String(nextIncrement)
    .padStart(Math.max(1, Number(formData.sequenceDigits) || 2), "0");

  const handleBack = () => {
    if (prefillModule === "Purchase Order") {
      navigate("/purchase-order");
    } else if (prefillModule === "Goods Inward Note" || prefillModule === "Inward Outward Note") {
      navigate("/inward-outward-note");
    } else {
      navigate("/document-sequence");
    }
  };

  return (
    <div className="cds-page">
      <ModuleNavbar />

      <div className="cds-header">
        <div className="cds-left">
          <button className="back-btn" onClick={handleBack}>
            ← Back
          </button>
          <h2>Create Document Sequence</h2>
          {prefillModule && (
            <span className="cds-module-badge">{prefillModule}</span>
          )}
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

          {/* TRANSACTION CATEGORY — fetched from Transaction master */}
          <div className="cds-group">
            <label>Transaction Category</label>
            <select
              name="transactionCategory"
              value={formData.transactionCategory}
              onChange={handleChange}
              disabled={!formData.businessEntity}
            >
              <option value="">
                {formData.businessEntity
                  ? transactionCategories.length === 0
                    ? "- No categories found -"
                    : "- Select -"
                  : "- Select Business Entity first -"}
              </option>
              {transactionCategories.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.transactionCategoryCode} — {t.categoryDescription}
                </option>
              ))}
            </select>
            {formData.businessEntity && transactionCategories.length === 0 && (
              <small className="cds-preview-hint" style={{ color: "#dc2626" }}>
                No open transaction categories for this module / entity.
              </small>
            )}
          </div>

          {/* ENTITY PREFIX — auto-filled from transaction category code, still editable */}
          <div className="cds-group">
            <label>Entity Prefix <small style={{ fontWeight: 400 }}>(auto-filled from category code)</small></label>
            <input
              type="text"
              name="entityPrefix"
              value={formData.entityPrefix}
              onChange={handleChange}
              placeholder="e.g. IN, OT, PO"
            />
          </div>

          {/* SEQUENCE DIGITS */}
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
              <option value="dd/mm/yy">dd/mm/yy</option>
              <option value="mm/dd/yy">mm/dd/yy</option>
              <option value="yy/mm/dd">yy/mm/dd</option>
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
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="popup-btn"
                onClick={() => {
                  setShowPopup(false);
                  handleBack();
                }}
              >
                OK
              </button>
              <button
                className="popup-btn"
                style={{ background: "#2563eb" }}
                onClick={() => {
                  setShowPopup(false);
                  navigate("/document-sequence");
                }}
              >
                View All Sequences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDocumentSequence;