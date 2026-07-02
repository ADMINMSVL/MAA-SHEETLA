import React from "react";
import { Routes, Route } from "react-router-dom";

import RequireAuth   from "./RequireAuth";
import Home          from "../pages/Home/Home";
import Signin        from "../pages/auth/Signin";
import Signup        from "../pages/auth/Signup";
import Manufacturing from "../pages/Manufacturing/Manufacturing";
import Procurement   from "../pages/Manufacturing/Procurement/Procurement";
import Inventory     from "../pages/Manufacturing/Inventory/Inventory";
import Production    from "../pages/Manufacturing/Production/Production";
import Masters       from "../pages/Manufacturing/Masters/Masters";
import SystemAdmin   from "../pages/SystemAdmin/SystemAdmin";

import InwardOutwardNote     from "../pages/Manufacturing/Inventory/InwardOutwardNote/InwardOutwardNote";
import GINDetail             from "../pages/Manufacturing/Inventory/InwardOutwardNote/GINDetail";
import GoodsReceiptNote      from "../pages/Manufacturing/Inventory/GoodsReceiptNote/GoodsReceiptNote";
import DirectGRN             from "../pages/Manufacturing/Inventory/DirectGRN/DirectGRN";
import CreateDirectGRN       from "../pages/Manufacturing/Inventory/DirectGRN/CreateDirectGRN";
import ItemInventory         from "../pages/Manufacturing/Inventory/ItemInventory/ItemInventory";
import CreateGoodsInwardNote from "../pages/Manufacturing/Inventory/CreateInventory/CreateGIN";
import Transaction           from "../pages/Manufacturing/Masters/Transaction/Transaction";
import CreateTransaction     from "../pages/Manufacturing/Masters/Transaction/CreateTransaction";
import DocumentSequence      from "../pages/Manufacturing/Masters/DocumentSequence/DocumentSequence";
import CreateDocumentSequence from "../pages/Manufacturing/Masters/DocumentSequence/CreateDocumentSequence/CreateDocumentSequence";
import WeighmentSearch       from "../pages/Manufacturing/Inventory/Weighment/WeighmentSearch";

import {
  CreateInwardWeighment,
  CreateOutwardWeighment,
  CreateGeneralWeighment,
  CreateInwardWeighmentForm,
  CreateOutwardWeighmentForm,
  // WeighmentDetail
} from "../pages/Manufacturing/Inventory/Weighment/CreateWeighment/WeighmentPages";
import WeighmentDetail        from"../pages/Manufacturing/Inventory/Weighment/WeighmentDetail/WeighmentDetail";
import ItemConversion         from "../pages/Manufacturing/Inventory/ItemConversion/ItemConversion";
import CreateItemConversion   from "../pages/Manufacturing/Inventory/ItemConversion/CreateItemConversion";
import ItemConversionDetail   from "../pages/Manufacturing/Inventory/ItemConversion/ItemConversionDetail";

// SALES
import SalesSearch       from "../pages/Manufacturing/Sales/SalesSearch/Salessearch";
import SalesContractForm from "../pages/Manufacturing/Sales/SalesContractForm/SalesContractForm";

// PRODUCTION
import CCMProduction           from "../pages/Manufacturing/Production/CCMProduction/CCMProduction";
import CreateCCMProduction     from "../pages/Manufacturing/Production/CCMProduction/CreateCCMProduction";
import CCMDetail               from "../pages/Manufacturing/Production/CCMProduction/CCMDetail";
import RollingProduction       from "../pages/Manufacturing/Production/RollingProduction/RollingProduction";
import CreateRollingProduction from "../pages/Manufacturing/Production/RollingProduction/CreateRollingProduction";
import RollingDetail           from "../pages/Manufacturing/Production/RollingProduction/RollingDetail";
import BundlingProduction      from "../pages/Manufacturing/Production/BundlingProduction/BundlingProduction";
import CreateBundlingProduction from "../pages/Manufacturing/Production/BundlingProduction/CreateBundlingProduction";
import BundlingDetail          from "../pages/Manufacturing/Production/BundlingProduction/BundlingDetail";
import ProductionDashboard     from "../pages/Manufacturing/Production/ProductionDashboard/ProductionDashboard";
import ProductionInventory     from "../pages/Manufacturing/Production/ProductionInventory/ProductionInventory";
import ProductionReports       from "../pages/Manufacturing/Production/ProductionReports/ProductionReports";

// MASTERS — batch 1
import PartyMaster    from "../pages/Manufacturing/Masters/PartyMaster/PartyMaster";
import CreateParty    from "../pages/Manufacturing/Masters/PartyMaster/CreateParty";
import PartyDetail    from "../pages/Manufacturing/Masters/PartyMaster/PartyDetail";
import ItemMaster     from "../pages/Manufacturing/Masters/ItemMaster/ItemMaster";
import CreateItem     from "../pages/Manufacturing/Masters/ItemMaster/CreateItem";
import UOMMaster      from "../pages/Manufacturing/Masters/UOMMaster/UOMMaster";
import CreateUOM      from "../pages/Manufacturing/Masters/UOMMaster/CreateUOM";
import PartyType      from "../pages/Manufacturing/Masters/PartyType/PartyType";
import CreatePartyType from "../pages/Manufacturing/Masters/PartyType/CreatePartyType";
import SiteMaster     from "../pages/Manufacturing/Masters/SiteMaster/SiteMaster";
import CreateSite     from "../pages/Manufacturing/Masters/SiteMaster/CreateSite";

// MASTERS — batch 2
import ItemCategory        from "../pages/Manufacturing/Masters/ItemCategory/Itemcategory";
import CreateItemCategory  from "../pages/Manufacturing/Masters/ItemCategory/CreateItemCategory";
import ItemGroup           from "../pages/Manufacturing/Masters/ItemGroup/ItemGroup";
import CreateItemGroup     from "../pages/Manufacturing/Masters/ItemGroup/CreateItemGroup";
import TaxDetails          from "../pages/Manufacturing/Masters/TaxDetails/TaxDetails";
import CreateTaxDetails    from "../pages/Manufacturing/Masters/TaxDetails/CreateTaxDetails";
import ProductionDetails   from "../pages/Manufacturing/Masters/ProductionDetails/ProductionDetails";
import CreateProductionDetails from "../pages/Manufacturing/Masters/ProductionDetails/CreateProductionDetails";
import SchemeMaster        from "../pages/Manufacturing/Masters/SchemeMaster/SchemeMaster";
import CreateSchemeMaster  from "../pages/Manufacturing/Masters/SchemeMaster/CreateSchemeMaster";
import ItemDetail          from "../pages/Manufacturing/Masters/ItemMaster/ItemDetail";
import CreateItemConversionMaster from "../pages/Manufacturing/Masters/ItemConversion/CreateItemConversionMaster";
import ItemConversionMasterPage   from "../pages/Manufacturing/Masters/ItemConversion/ItemConversionMasterPage";

// MASTERS — ItemClass (new)
import ItemClass       from "../pages/Manufacturing/Masters/ItemClass/ItemClass";
import CreateItemClass from "../pages/Manufacturing/Masters/ItemClass/CreateItemClass";

// MASTERS — ItemTaxClass (new)
import ItemTaxClass       from "../pages/Manufacturing/Masters/ItemTaxClass/ItemTaxClass";
import CreateItemTaxClass from "../pages/Manufacturing/Masters/ItemTaxClass/CreateItemTaxClass";

// MASTERS — batch 3
import ServiceMaster       from "../pages/Manufacturing/Masters/ServiceMaster/ServiceMaster";
import CreateServiceMaster from "../pages/Manufacturing/Masters/ServiceMaster/CreateServiceMaster";
import ChargesMaster       from "../pages/Manufacturing/Masters/ChargesMaster/ChargesMaster";
import CreateChargesMaster from "../pages/Manufacturing/Masters/ChargesMaster/CreateChargesMaster";

// PROCUREMENT
import CreatePurchaseOrder      from "../pages/Manufacturing/Procurement/PurchaseOrder/CreatePurchaseOrder";
import PurchaseOrder            from "../pages/Manufacturing/Procurement/PurchaseOrder/PurchaseOrder";
import PODetail                 from "../pages/Manufacturing/Procurement/PurchaseOrder/PODetails";
import PurchaseRequisition      from "../pages/Manufacturing/Procurement/PurchaseRequisition/PurchaseRequisition";
import CreatePurchaseRequisition from "../pages/Manufacturing/Procurement/PurchaseRequisition/CreatePurchaseRequisition";
import PRDetail                 from "../pages/Manufacturing/Procurement/PurchaseRequisition/PRDetail";

const AppRoutes = () => {
  return (
    <Routes>

      {/* ── PUBLIC ROUTES — reachable without signing in ──────────────
          /signin and /signup obviously need to be public.
          /sys_admin also stays public at the ROUTING level because it
          must be reachable on a brand-new install (no admin exists yet,
          no token exists yet) to create the first admin account. The
          page itself (SystemAdmin.jsx) already handles the rest of the
          gating internally: once an admin exists, it shows "Access
          Denied" to anyone who isn't a signed-in admin. */}
      <Route path="/signin"    element={<Signin />} />
      <Route path="/signup"    element={<Signup />} />
      <Route path="/sys_admin" element={<SystemAdmin />} />

      {/* ── PROTECTED ROUTES — require a valid token, or bounce to /signin ── */}
      <Route element={<RequireAuth />}>

        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* MODULE ROUTES */}
        <Route path="/manufacturing" element={<Manufacturing />} />
        <Route path="/procurement"   element={<Procurement />} />
        <Route path="/inventory"     element={<Inventory />} />
        <Route path="/production"    element={<Production />} />
        <Route path="/masters"       element={<Masters />} />

        {/* SALES */}
        <Route path="/sales-search"            element={<SalesSearch />} />
        <Route path="/sales-contract/create"   element={<SalesContractForm />} />
        <Route path="/sales-contract/edit/:id" element={<SalesContractForm />} />

        {/* INVENTORY */}
        <Route path="/inward-outward-note"        element={<InwardOutwardNote />} />
        <Route path="/gin-detail/:id"             element={<GINDetail />} />
        <Route path="/create-goods-inward-note"   element={<CreateGoodsInwardNote />} />
        <Route path="/goods-receipt-note"         element={<GoodsReceiptNote />} />
        <Route path="/direct-grn"                 element={<DirectGRN />} />
        <Route path="/create-direct-grn"          element={<CreateDirectGRN />} />
        <Route path="/direct-grn-details/:id"     element={<CreateDirectGRN />} />
        <Route path="/item-inventory"             element={<ItemInventory />} />
        <Route path="/item-Conversion"            element={<ItemConversion />} />
        <Route path="/create-item-conversion"     element={<CreateItemConversion />} />
        <Route path="/item-conversion-detail/:id" element={<ItemConversionDetail />} />

        {/* PROCUREMENT */}
        <Route path="/create-purchase-order"           element={<CreatePurchaseOrder />} />
        <Route path="/purchase-order"                  element={<PurchaseOrder />} />
        <Route path="/purchase-order-detail/:id"       element={<PODetail />} />
        <Route path="/purchase-requisition"            element={<PurchaseRequisition />} />
        <Route path="/create-purchase-requisition"     element={<CreatePurchaseRequisition />} />
        <Route path="/purchase-requisition-detail/:id" element={<PRDetail />} />

        {/* PRODUCTION */}
        <Route path="/ccm-production"             element={<CCMProduction />} />
        <Route path="/create-ccm-production"      element={<CreateCCMProduction />} />
        <Route path="/ccm-detail/:id"             element={<CCMDetail />} />
        <Route path="/rolling-production"         element={<RollingProduction />} />
        <Route path="/create-rolling-production"  element={<CreateRollingProduction />} />
        <Route path="/rolling-detail/:id"         element={<RollingDetail />} />
        <Route path="/bundling-production"        element={<BundlingProduction />} />
        <Route path="/create-bundling-production" element={<CreateBundlingProduction />} />
        <Route path="/bundling-detail/:id"        element={<BundlingDetail />} />
        <Route path="/production-inventory"       element={<ProductionDashboard />} />
        <Route path="/production-reports"         element={<ProductionInventory />} />
        <Route path="/production-dashboard"       element={<ProductionReports />} />

        {/* WEIGHMENT */}
        <Route path="/weighment-search"         element={<WeighmentSearch />} />
        <Route path="/weighment/create/inward"  element={<CreateInwardWeighment />} />
        <Route path="/weighment/create/outward" element={<CreateOutwardWeighment />} />
        <Route path="/weighment/create/general" element={<CreateGeneralWeighment />} />
        <Route path="/weighment-detail/:id"     element={<WeighmentDetail />} />
        <Route path="/weighment/create/inward/form"  element={<CreateInwardWeighmentForm />} />
        <Route path="/weighment/create/outward/form" element={<CreateOutwardWeighmentForm />} />

        {/* MASTERS — existing */}
        <Route path="/document-sequence"        element={<DocumentSequence />} />
        <Route path="/create-document-sequence" element={<CreateDocumentSequence />} />
        <Route path="/transaction-module"       element={<Transaction />} />
        <Route path="/create-transaction"       element={<CreateTransaction />} />

        {/* MASTERS — batch 1 */}
        <Route path="/party-master"                  element={<PartyMaster />} />
        <Route path="/create-party"                  element={<CreateParty />} />
        <Route path="/party-detail/:id"              element={<PartyDetail />} />
        <Route path="/item-master"                   element={<ItemMaster />} />
        <Route path="/create-item"                   element={<CreateItem />} />
        <Route path="/uom-master"                    element={<UOMMaster />} />
        <Route path="/create-uom"                    element={<CreateUOM />} />
        <Route path="/party-type"                    element={<PartyType />} />
        <Route path="/create-party-type"             element={<CreatePartyType />} />
        <Route path="/item-conversion-master"        element={<ItemConversionMasterPage />} />
        <Route path="/create-item-conversion-master" element={<CreateItemConversionMaster />} />

        {/* MASTERS — batch 2 */}
        <Route path="/item-category"             element={<ItemCategory />} />
        <Route path="/create-item-category"      element={<CreateItemCategory />} />
        <Route path="/item-group"                 element={<ItemGroup />} />
        <Route path="/create-item-group"          element={<CreateItemGroup />} />
        <Route path="/item-class"                element={<ItemClass />} />
        <Route path="/create-item-class"         element={<CreateItemClass />} />
        <Route path="/item-tax-class"            element={<ItemTaxClass />} />
        <Route path="/create-item-tax-class"     element={<CreateItemTaxClass />} />
        <Route path="/tax-details"               element={<TaxDetails />} />
        <Route path="/create-tax-details"        element={<CreateTaxDetails />} />
        <Route path="/production-details"        element={<ProductionDetails />} />
        <Route path="/create-production-details" element={<CreateProductionDetails />} />
        <Route path="/scheme-master"             element={<SchemeMaster />} />
        <Route path="/create-scheme"             element={<CreateSchemeMaster />} />
        <Route path="/site-master"               element={<SiteMaster />} />
        <Route path="/create-site"               element={<CreateSite />} />
        <Route path="/item-detail/:id"           element={<ItemDetail />} />

        {/* MASTERS — batch 3 */}
        <Route path="/service-master"        element={<ServiceMaster />} />
        <Route path="/create-service-master" element={<CreateServiceMaster />} />
        <Route path="/charges-master"        element={<ChargesMaster />} />
        <Route path="/create-charges-master" element={<CreateChargesMaster />} />

      </Route>

    </Routes>
  );
};

export default AppRoutes;