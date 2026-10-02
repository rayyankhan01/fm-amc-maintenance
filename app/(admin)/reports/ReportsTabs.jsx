'use client';

import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import ReportsTable from './ReportsTable';
import InspectionReports from './InspectionReports';

export default function ReportsTabs({ submissions, reportData }) {
  const [tab, setTab] = useState('latest');

  return (
    <>
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        className="report-print-control"
      >
        <Tab value="latest" label="Latest Inspection" />
        <Tab value="consolidated" label="Consolidated Inspection Reports" />
      </Tabs>
      <Box sx={{ pt: 3 }}>
        {tab === 'latest' && <ReportsTable submissions={submissions} />}
        {tab === 'consolidated' && <InspectionReports reportData={reportData} />}
      </Box>
    </>
  );
}
