const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
// console.log(process.env.FRONTEND_URL);
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

/* ROUTES */
const authRoutes             = require("./routes/authRoutes");
const transactionRoutes      = require("./routes/Master/transactionRoutes");
const documentSequenceRoutes = require("./routes/Master/documentSequenceRoutes");
const goodsInwardNoteRoutes  = require("./routes/Inventory/goodsInwardNoteRoutes");
const weighmentRoutes        = require("./routes/Inventory/weighmentRoutes");
const Directgrnroutes        = require("./routes/Inventory/Directgrnroutes");
const Salesroutes            = require("./routes/Sales/Salesroutes");   // ← NEW
const PartyRoutes      = require("./routes/Master/PartyRoutes");
const ItemRoutes      = require("./routes/Master/ItemRoutes");
const UomRoutes      = require("./routes/Master/UomRoutes");
const PartyTypeRoutes      = require("./routes/Master/PartyTypeRoutes");
const ItemCategoryRoutes      = require("./routes/Master/ItemCategoryRoutes");
const ItemTypeRoutes      = require("./routes/Master/ItemtypeRoutes");
const TaxDetailsRoutes      = require("./routes/Master/TaxDetailsRoutes");
const ProductionDetailsRoutes      = require("./routes/Master/ProductiondetailsRoutes");
const SchemeMasterRoutes      = require("./routes/Master/SchememasterRoutes");
const SiteMasterRoutes       = require("./routes/Master/SiteMasterRoutes");
const PurchaseOrderRoutes    =require("./routes/Procurement/PurchaseOrderRoutes")
// Specific prefixes BEFORE generic /api to avoid route conflicts
app.use("/api/auth",        authRoutes);
app.use("/api/weighment",   weighmentRoutes);
app.use("/api/direct-grn",  Directgrnroutes);
app.use("/api/sales",       Salesroutes);   // ← NEW

// Generic /api routes last
app.use("/api", transactionRoutes);
app.use("/api", documentSequenceRoutes);
app.use("/api", goodsInwardNoteRoutes);
app.use("/api", PartyRoutes);
app.use("/api", ItemRoutes);
app.use("/api", UomRoutes);
app.use("/api", PartyTypeRoutes);
app.use("/api", ItemCategoryRoutes);
app.use("/api", ItemTypeRoutes);
app.use("/api", TaxDetailsRoutes);
app.use("/api", ProductionDetailsRoutes);
app.use("/api", SchemeMasterRoutes);
app.use("/api", SiteMasterRoutes);
app.use("/api", PurchaseOrderRoutes);

/* TEST */
app.get("/", (req, res) => {
  res.json({ message: "Server Running Successfully" });
});

/* DB CONNECTION */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server Running On Port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB Error:", error.message);
  });