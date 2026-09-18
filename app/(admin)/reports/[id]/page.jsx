import { notFound } from 'next/navigation';
import { Button, Container } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { getSubmissionWithResponses } from '@/features/forms/api';
import SubmissionViewer from '@/features/forms/components/SubmissionViewer';

export default async function InspectionReportPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const submission = await getSubmissionWithResponses(supabase, id);
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button href="/reports" sx={{ mb: 3 }}>Back to reports</Button>
        <SubmissionViewer submission={submission} />
      </Container>
    );
  } catch (error) {
    if (error?.code === 'PGRST116') notFound();
    throw error;
  }
}
