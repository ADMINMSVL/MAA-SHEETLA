import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Signin from "../pages/auth/Signin";
import Signup from "../pages/auth/Signup";
import Manufacturing from "../pages/Manufacturing/Manufacturing";
import Procurement from "../pages/Manufacturing/Procurement/Procurement";
import Inventory from "../pages/Manufacturing/Inventory/Inventory";
import Production from "../pages/Manufacturing/Production/Production";
import Masters from "../pages/Manufacturing/Masters/Masters";

import InwardOutwardNote     from "../pages/Manufacturing/Inventory/InwardOutwardNote/InwardOutwardNote";
import GINDetail             from "../pages/Manufacturing/Inventory/InwardOutwardNote/GINDetail";
import GoodsReceiptNote      from "../pages/Manufacturing/Inventory/GoodsReceiptNote/GoodsReceiptNote";
import DirectGRN             from "../pages/Manufacturing/Inventory/DirectGRN/DirectGRN";
import ItemInventory         from "../pages/Manufacturing/Inventory/ItemInventory/ItemInventory";
import CreateGoodsInwardNote from "../pages/Manufacturing/Inventory/CreateInventory/CreateGIN";
import Transaction           from "../pages/Manufacturing/Masters/Transaction/Transaction";
import CreateTransaction     from "../pages/Manufacturing/Masters/Transaction/CreateTransaction";
import DocumentSequence      from "../pages/Manufacturing/Masters/DocumentSequence/DocumentSequence";
import CreateDocumentSequence from "../pages/Manufacturing/Masters/DocumentSequence/CreateDocumentSequence/CreateDocumentSequence";
import WeighmentSearch       from "../pages/Manufacturing/Inventory/Weighment/WeighmentSearch";
import WeighmentDetail       from "../pages/Manufacturing/Inventory/Weighment/WeighmentDetail/WeighmentDetail";
import CreateWeighment       from "../pages/Manufacturing/Inventory/Weighment/CreateWeighment/CreateWeighment";
import CreateInwardWeighment  from "../pages/Manufacturing/Inventory/Weighment/CreateWeighment/Createinwardweighment";
import CreateOutwardWeighment from "../pages/Manufacturing/Inventory/Weighment/CreateWeighment/Createoutwardweighment";

// SALES MODULE
import SalesSearch       from "../pages/Manufacturing/Sales/SalesSearch/Salessearch";
import SalesContractForm from "../pages/Manufacturing/Sales/SalesContractForm/SalesContractForm";

// MASTERS — batch 1
import PartyMaster   from "../pages/Manufacturing/Masters/PartyMaster/PartyMaster";
import CreateParty   from "../pages/Manufacturing/Masters/PartyMaster/CreateParty";
import ItemMaster    from "../pages/Manufacturing/Masters/ItemMaster/ItemMaster";
import CreateItem    from "../pages/Manufacturing/Masters/ItemMaster/CreateItem";
import UOMMaster     from "../pages/Manufacturing/Masters/UOMMaster/UOMMaster";
import CreateUOM     from "../pages/Manufacturing/Masters/UOMMaster/CreateUOM";
import PartyType     from "../pages/Manufacturing/Masters/PartyType/PartyType";
import CreatePartyType from "../pages/Manufacturing/Masters/PartyType/CreatePartyType";
import SiteMaster from "../pages/Manufacturing/Masters/SiteMaster/SiteMaster";
import CreateSite from "../pages/Manufacturing/Masters/SiteMaster/CreateSite";

// MASTERS — batch 2
import ItemCategory        from "../pages/Manufacturing/Masters/ItemCategory/Itemcategory";
import CreateItemCategory  from "../pages/Manufacturing/Masters/ItemCategory/CreateItemCategory";
import ItemType            from "../pages/Manufacturing/Masters/ItemType/ItemType";
import CreateItemType      from "../pages/Manufacturing/Masters/ItemType/CreateItemType";
import TaxDetails          from "../pages/Manufacturing/Masters/TaxDetails/TaxDetails";
import CreateTaxDetails    from "../pages/Manufacturing/Masters/TaxDetails/CreateTaxDetails";
import ProductionDetails   from "../pages/Manufacturing/Masters/ProductionDetails/ProductionDetails";
import CreateProductionDetails from "../pages/Manufacturing/Masters/ProductionDetails/CreateProductionDetails";
import SchemeMaster        from "../pages/Manufacturing/Masters/SchemeMaster/SchemeMaster";
import CreateSchemeMaster  from "../pages/Manufacturing/Masters/SchemeMaster/CreateSchemeMaster";

const AppRoutes = () => {
  return (
    <Routes>

      {/* AUTH */}
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />

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
      <Route path="/inward-outward-note"      element={<InwardOutwardNote />} />
      <Route path="/gin-detail/:id"           element={<GINDetail />} />
      <Route path="/create-goods-inward-note" element={<CreateGoodsInwardNote />} />
      <Route path="/goods-receipt-note"       element={<GoodsReceiptNote />} />
      <Route path="/direct-grn"               element={<DirectGRN />} />
      <Route path="/item-inventory"           element={<ItemInventory />} />

      {/* WEIGHMENT */}
      <Route path="/weighment-search"         element={<WeighmentSearch />} />
      <Route path="/weighment-detail/:id"     element={<WeighmentDetail />} />
      <Route path="/create-weighment"         element={<CreateWeighment />} />
      <Route path="/create-inward-weighment"  element={<CreateInwardWeighment />} />
      <Route path="/create-outward-weighment" element={<CreateOutwardWeighment />} />

      {/* MASTERS — existing */}
      <Route path="/document-sequence"        element={<DocumentSequence />} />
      <Route path="/create-document-sequence" element={<CreateDocumentSequence />} />
      <Route path="/transaction-module"       element={<Transaction />} />
      <Route path="/create-transaction"       element={<CreateTransaction />} />

      {/* MASTERS — batch 1 */}
      <Route path="/party-master"      element={<PartyMaster />} />
      <Route path="/create-party"      element={<CreateParty />} />
      <Route path="/item-master"       element={<ItemMaster />} />
      <Route path="/create-item"       element={<CreateItem />} />
      <Route path="/uom-master"        element={<UOMMaster />} />
      <Route path="/create-uom"        element={<CreateUOM />} />
      <Route path="/party-type"        element={<PartyType />} />
      <Route path="/create-party-type" element={<CreatePartyType />} />

      {/* MASTERS — batch 2 */}
      <Route path="/item-category"            element={<ItemCategory />} />
      <Route path="/create-item-category"     element={<CreateItemCategory />} />
      <Route path="/item-type"                element={<ItemType />} />
      <Route path="/create-item-type"         element={<CreateItemType />} />
      <Route path="/tax-details"              element={<TaxDetails />} />
      <Route path="/create-tax-details"       element={<CreateTaxDetails />} />
      <Route path="/production-details"       element={<ProductionDetails />} />
      <Route path="/create-production-details" element={<CreateProductionDetails />} />
      <Route path="/scheme-master"            element={<SchemeMaster />} />
      <Route path="/create-scheme"            element={<CreateSchemeMaster />} />
      <Route path="/site-master"               element={<SiteMaster />} />
      <Route path="/create-site"               element={<CreateSite />} />

    </Routes>
  );
};

export default AppRoutes;