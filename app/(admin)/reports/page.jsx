import { createClient } from '@/lib/supabase/server';
import { Container, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: submissions, error } = await supabase
    .from('form_submissions')
    .select('id, inspection_date, submitted_at, equipment ( equipment_type_code, unit_number ), profiles ( name ), form_templates ( name )')
    .order('inspection_date', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Inspection report</Typography>
      <Paper variant="outlined">
        <Table>
          <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Template</TableCell><TableCell>Equipment</TableCell><TableCell>Technician</TableCell></TableRow></TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>{submission.inspection_date}</TableCell>
                <TableCell>{submission.form_templates?.name ?? '-'}</TableCell>
                <TableCell>{submission.equipment ? `${submission.equipment.equipment_type_code}/${submission.equipment.unit_number}` : '-'}</TableCell>
                <TableCell>{submission.profiles?.name ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
