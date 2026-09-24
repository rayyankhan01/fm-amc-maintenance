import { getTemplateWithFields } from "@/features/forms/api";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import AddFieldForm from "./AddFieldForm";
import FieldsTable from "./FieldsTable";
import TemplateNameEditor from "./TemplateNameEditor";

//server component
export default async function TemplateBuilderPage({ params }) {
  const { id } = await params;

  const supabase = await createClient();

  const template = await getTemplateWithFields(supabase, id);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <TemplateNameEditor
        templateId={template.id}
        initialName={template.name}
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {template.equipment_type}
      </Typography>
      <FieldsTable fields={template.fields} />
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Add Field
      </Typography>
      <AddFieldForm templateId={template.id} fields={template.fields} />
      <Link href="/templates" style={{ textDecoration: "none" }}>
        <Button variant="contained" sx={{ mt: 3 }}>
          Complete Template
        </Button>
      </Link>
    </Container>
  );
}
