import React from "react";
import DashboardAdmin from "./DashboardAdmin";

// Dashboard khusus Kamala tanpa tab selector
export default function DashboardKamala() {
  return <DashboardAdmin unit="Kamala" hideUnitTabs={true} />;
}
