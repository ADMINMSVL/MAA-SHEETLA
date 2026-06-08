import React from "react";
import { useNavigate } from "react-router-dom";
import "./Masters.css";
import ModuleNavbar from "../../../components/ModuleNavbar/ModuleNavbar";

const Masters = () => {
  const navigate = useNavigate();

  const masterModules = [
    { icon: "🔄", title: "Transaction Module",  subtitle: "Manage Transactions",      code: "TR001", path: "/transaction-module"    },
    { icon: "📄", title: "Document Sequence",   subtitle: "Manage Document Numbers",  code: "DS002", path: "/document-sequence"     },
    { icon: "🏢", title: "Party Master",        subtitle: "Manage Parties",           code: "PM001", path: "/party-master"          },
    { icon: "🏷️", title: "Party Type",          subtitle: "Manage Party Types",       code: "PT001", path: "/party-type"            },
    { icon: "📦", title: "Item Master",         subtitle: "Manage Items",             code: "IM001", path: "/item-master"           },
    { icon: "🗂️", title: "Item Category",       subtitle: "Manage Item Categories",   code: "IC001", path: "/item-category"         },
    { icon: "🔩", title: "Item Group",           subtitle: "Manage Item Types",        code: "IT001", path: "/item-type"             },
    { icon: "⚖️", title: "UOM Master",          subtitle: "Units of Measure",         code: "UM001", path: "/uom-master"            },
    { icon: "🧾", title: "Tax Details",         subtitle: "HSN Code & GST",           code: "TD001", path: "/tax-details"           },
    { icon: "⚙️", title: "Production Details",  subtitle: "Grade, Size, Dimensions",  code: "PD001", path: "/production-details"    },
    { icon: "📊", title: "Scheme Master",       subtitle: "Pricing Schemes",          code: "SM001", path: "/scheme-master"         },
    { icon: "📍", title: "Site Master",         subtitle: "Manage Sites / Locations", code: "ST001", path: "/site-master"           },
    { icon: "📍", title: "Item Conversion",      subtitle: "Manage Item conversion", code: "IC001", path: "/item-conversion-master" },
  ];

  return (
    <div className="module-page">
      <ModuleNavbar />
      <div className="inventory-header">
        <h1>Masters</h1>
      </div>
      <div className="inventory-grid">
        {masterModules.map((item, index) => (
          <div key={index} className="inventory-card" onClick={() => navigate(item.path)}>
            <div className="card-left">
              <div className="inventory-icon">{item.icon}</div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
              </div>
            </div>
            <div className="card-right">
              <span>{item.code}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Masters;