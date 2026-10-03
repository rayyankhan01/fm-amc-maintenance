'use client';

import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import ReportsTable from './ReportsTable';
import InspectionReports from './InspectionReports';
import ReportHeader from './ReportHeader';

function reportPeriod(dates) {
  const validDates = dates.filter(Boolean).sort();
  if (validDates.length === 0) return 'No inspection dates available';
  if (validDates[0] === validDates[validDates.length - 1]) return validDates[0];
  return `${validDates[validDates.length - 1]} to ${validDates[0]}`;
}

export default function ReportsTabs({ submissions, reportData }) {
  const [tab, setTab] = useState('latest');
  const latestPeriod = reportPeriod(submissions.map((submission) => submission.inspection_date));
  const consolidatedPeriod = reportPeriod(
    reportData.completed.map((submission) => submission.inspection_date),
  );
  const isLatest = tab === 'latest';

  return (
    <>
      <ReportHeader
        title={isLatest ? 'Latest Inspection Report' : 'Consolidated Inspection Report'}
        description={isLatest
          ? 'The most recently submitted inspection records.'
          : 'Inspection completion, schedule, status, and checklist results across equipment.'}
        period={isLatest ? latestPeriod : consolidatedPeriod}
      />
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
