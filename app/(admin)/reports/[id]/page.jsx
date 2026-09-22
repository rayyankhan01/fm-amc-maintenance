import { notFound } from 'next/navigation';
import { Button, Container, Stack } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { getSubmissionWithResponses } from '@/features/forms/api';
import SubmissionViewer from '@/features/forms/components/SubmissionViewer';
import PrintReportButton from '../PrintReportButton';

export default async function InspectionReportPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const submission = await getSubmissionWithResponses(supabase, id);
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack className="report-print-control" direction="row" sx={{ mb: 3, justifyContent: 'space-between' }}>
          <Button href="/reports">Back to reports</Button>
          <PrintReportButton />
        </Stack>
        <SubmissionViewer submission={submission} />
      </Container>
    );
  } catch (error) {
    if (error?.code === 'PGRST116') notFound();
    throw error;
  }
}
