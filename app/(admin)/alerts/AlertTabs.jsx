"use client";

import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import DueOverdueAlerts from "./DueOverdueList";
import CancelledList from "./CancelledList";
import NewAssetsList from "./NewAssetsList";
export default function AlertTabs({ dueOverdue, newAssets, cancelled }) {
  const [tab, setTab] = useState("due");
  return (
    <>
      <Tabs value={tab} onChange={(_, value) => setTab(value)}>
        <Tab value="due" label={`Due/Overdue (${dueOverdue.length})`} />
        <Tab value="cancelled" label={`Cancelled (${cancelled.length})`} />
        <Tab value="new" label={`New Assets (${newAssets.length})`} />
      </Tabs>
      <Box sx={{ pt: 2 }}>
        {tab === "due" && <DueOverdueAlerts items={dueOverdue} />}
        {tab === "cancelled" && <CancelledList items={cancelled} />}
        {tab === "new" && <NewAssetsList items={newAssets} />}
      </Box>
    </>
  );
}
