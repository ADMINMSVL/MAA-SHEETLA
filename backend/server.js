const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const dotenv   = require("dotenv");

dotenv.config();
const app = express();

/* MIDDLEWARE */
app.use(
  cors({
    origin: [
      "https://maasheetla.netlify.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
console.log(process.env.FRONTEND_URL);

/* ── ROUTES ── */
const authRoutes                = require("./routes/authRoutes");
const transactionRoutes         = require("./routes/Master/transactionRoutes");
const documentSequenceRoutes    = require("./routes/Master/documentSequenceRoutes");
const goodsInwardNoteRoutes     = require("./routes/Inventory/goodsInwardNoteRoutes");
const weighmentRoutes           = require("./routes/Inventory/weighmentRoutes");
const Directgrnroutes           = require("./routes/Inventory/Directgrnroutes");
const Salesroutes               = require("./routes/Sales/Salesroutes");
const PartyRoutes               = require("./routes/Master/PartyRoutes");
const ItemRoutes                = require("./routes/Master/ItemRoutes");
const UomRoutes                 = require("./routes/Master/UomRoutes");
const PartyTypeRoutes           = require("./routes/Master/PartyTypeRoutes");
const ItemCategoryRoutes        = require("./routes/Master/ItemCategoryRoutes");
const ItemClassRoutes           = require("./routes/Master/ItemClassRoutes");
const ItemGroupRoutes            = require("./routes/Master/ItemGroupRoutes");
const TaxDetailsRoutes          = require("./routes/Master/TaxDetailsRoutes");
const ItemTaxClassRoutes          = require("./routes/Master/ItemTaxClassRoutes");
const ProductionDetailsRoutes   = require("./routes/Master/ProductiondetailsRoutes");
const SchemeMasterRoutes        = require("./routes/Master/SchememasterRoutes");
const SiteMasterRoutes          = require("./routes/Master/SiteMasterRoutes");
const PurchaseOrderRoutes       = require("./routes/Procurement/PurchaseOrderRoutes");
const itemConversionRoutes      = require("./routes/Inventory/itemConversionRoutes");
const CCMProductionRoutes       = require("./routes/Production/CCMProductionRoutes");
const RollingProductionRoutes   = require("./routes/Production/RollingProductionRoutes");
const BundlingProductionRoutes  = require("./routes/Production/BundlingProductionRoutes");
const ProductionAnalyticsRoutes = require("./routes/Production/ProductionAnalyticsRoutes");
const PurchaseRequisitionRoutes = require("./routes/Procurement/PurchaseRequisitionRoutes");

// ── NEW masters ──────────────────────────────────────────────────
const ServiceMasterRoutes       = require("./routes/Master/ServiceMasterRoutes");
const ChargesMasterRoutes       = require("./routes/Master/ChargesMasterRoutes");
// ─────────────────────────────────────────────────────────────────

/* SPECIFIC prefixes BEFORE generic /api to avoid route conflicts */
app.use("/api/auth",       authRoutes);
app.use("/api/weighment",  weighmentRoutes);
app.use("/api/direct-grn", Directgrnroutes);
app.use("/api/sales",      Salesroutes);
app.use("/api",            CCMProductionRoutes);
app.use("/api",            RollingProductionRoutes);
app.use("/api",            BundlingProductionRoutes);
app.use("/api",            ProductionAnalyticsRoutes);

/* GENERIC /api routes */
app.use("/api", transactionRoutes);
app.use("/api", documentSequenceRoutes);
app.use("/api", goodsInwardNoteRoutes);
app.use("/api", itemConversionRoutes);
app.use("/api", PartyRoutes);
app.use("/api", ItemRoutes);
app.use("/api", UomRoutes);
app.use("/api", PartyTypeRoutes);
app.use("/api", ItemCategoryRoutes);
app.use("/api", ItemClassRoutes);
app.use("/api", ItemGroupRoutes);
app.use("/api", TaxDetailsRoutes);
app.use("/api", ItemTaxClassRoutes);
app.use("/api", ProductionDetailsRoutes);
app.use("/api", SchemeMasterRoutes);
app.use("/api", SiteMasterRoutes);
app.use("/api", PurchaseOrderRoutes);
app.use("/api", PurchaseRequisitionRoutes);
// ── NEW ──
app.use("/api", ServiceMasterRoutes);
app.use("/api", ChargesMasterRoutes);

/* TEST */
app.get("/", (req, res) => res.json({ message: "Server Running Successfully" }));

/* DB CONNECTION */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server Running On Port ${PORT}`));
  })
  .catch((err) => console.log("MongoDB Error:", err.message));