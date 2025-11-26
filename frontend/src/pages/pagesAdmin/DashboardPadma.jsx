import React from "react";
import DashboardAdmin from "./DashboardAdmin";

// Dashboard khusus Padma tanpa tab selector
export default function DashboardPadma() {
  return <DashboardAdmin unit="Padma" hideUnitTabs={true} />;
}
