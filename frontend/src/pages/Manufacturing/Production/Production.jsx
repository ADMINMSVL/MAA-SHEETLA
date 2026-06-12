import React from "react";
import { useNavigate } from "react-router-dom";
import "./Production.css";
import ModuleNavbar from "../../../components/ModuleNavbar/ModuleNavbar";

const cards = [
  {
    icon: "🔥",
    title: "CCM Production",
    subtitle: "Continuous Casting Machine — liquid steel to billets",
    route: "/ccm-production",
    color: "#ff6b35",
  },
  {
    icon: "🏗️",
    title: "Rolling Production",
    subtitle: "Convert billets into finished TMT bars",
    route: "/rolling-production",
    color: "#2563eb",
  },
  {
    icon: "📦",
    title: "Bundling Production",
    subtitle: "Bundle loose bars into saleable packs",
    route: "/bundling-production",
    color: "#16a34a",
  },
  {
    icon: "📊",
    title: "Production Inventory",
    subtitle: "Stage-wise stock: CCM → Rolling → Bundling",
    route: "/production-inventory",
    color: "#7c3aed",
  },
  {
    icon: "📈",
    title: "Production Reports",
    subtitle: "Heat-wise, shift-wise, yield & scrap reports",
    route: "/production-reports",
    color: "#0891b2",
  },
  {
    icon: "🖥️",
    title: "Production Dashboard",
    subtitle: "Today's production KPIs at a glance",
    route: "/production-dashboard",
    color: "#d97706",
  },
];

const Production = () => {
  const navigate = useNavigate();

  return (
    <div className="prod-page">
      <ModuleNavbar />
      <div className="prod-hero">
        <div className="prod-hero-inner">
          <span className="prod-hero-icon">🏭</span>
          <div>
            <h1>Production Module</h1>
            <p>Manage the full steel production workflow — from casting to bundling</p>
          </div>
        </div>
      </div>

      <div className="prod-grid">
        {cards.map((c) => (
          <div
            key={c.route}
            className="prod-card"
            onClick={() => navigate(c.route)}
            style={{ "--accent": c.color }}
          >
            <span className="prod-card-icon">{c.icon}</span>
            <h3>{c.title}</h3>
            <p>{c.subtitle}</p>
            <span className="prod-card-arrow">→</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Production;