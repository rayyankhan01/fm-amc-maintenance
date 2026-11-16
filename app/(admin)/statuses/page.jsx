import { createClient } from "@/lib/supabase/server";
import {
  Container,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { deactivateStatusValue } from "@/features/admin/commands";
import DeleteConfirmationButton from "../DeleteConfirmationButton";

export default async function StatusesPage() {
  const { data, error } = await (await createClient())
    .from("status_values")
    .select("id, code, label, sort_order, is_active, parent_id")
    .order("sort_order")
    .order("label");
  if (error) throw error;

  const byParent = new Map();
  for (const item of data) {
    const key = item.parent_id ?? "null";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(item);
  }

  const orderedRows = [];
  for (const topLevel of byParent.get("null") ?? []) {
    orderedRows.push({ ...topLevel, depth: 0 });
    for (const child of byParent.get(topLevel.id) ?? []) {
      orderedRows.push({ ...child, depth: 1 });
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" sx={{ mb: 3, justifyContent: "space-between" }}>
        <Typography variant="h4">Status values</Typography>
        <Button href="/statuses/new" variant="contained">
          Add status
        </Button>
      </Stack>
      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Label</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderedRows.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.code}</TableCell>
                <TableCell sx={{ pl: item.depth * 4 }}>
                  {item.depth > 0 ? `└ ${item.label}` : item.label}
                </TableCell>

                <TableCell>{item.sort_order}</TableCell>
                <TableCell>{item.is_active ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Button href={`/statuses/${item.id}`}>Edit</Button>
                  {item.is_active && (
                      <DeleteConfirmationButton
                        action={deactivateStatusValue.bind(null, item.id)}
                        actionLabel="Deactivate"
                        title="Deactivate status?"
                        message="Existing assets keep their current value, but this status will no longer be available for new assets."
                      />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
