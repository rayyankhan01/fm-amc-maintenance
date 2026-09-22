'use client';

import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { Button } from '@mui/material';

export default function PrintReportButton() {
  return (
    <Button
      className="report-print-control"
      variant="contained"
      startIcon={<PrintOutlinedIcon />}
      onClick={() => window.print()}
    >
      Download PDF
    </Button>
  );
}
