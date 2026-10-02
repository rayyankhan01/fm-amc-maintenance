import { createClient } from '@/lib/supabase/server';
import { Container, Typography } from '@mui/material';
import { getInspectionReportData } from '@/features/reports/api';
import ReportsTabs from './ReportsTabs';

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const [{ data: submissions, error }, reportData] = await Promise.all([
    supabase
    .from('form_submissions')
    .select('id, inspection_date, submitted_at, equipment ( asset_id, equipment_type_code, unit_number, locations ( site_code, site_name, room_area ) ), profiles ( name ), form_templates ( name )')
    .order('inspection_date', { ascending: false })
    .limit(100),
    getInspectionReportData(supabase),
  ]);

  if (error) throw error;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Inspection Reports</Typography>
      <ReportsTabs submissions={submissions ?? []} reportData={reportData} />
    </Container>
  );
}
