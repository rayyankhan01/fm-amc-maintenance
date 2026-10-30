"use client";
import { useState } from "react";
import Link from "next/link";
import {
  TableRow,
  TableCell,
  Button,
  Box,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteTemplate } from "@/features/forms/api";
import IconButton from "@mui/material/IconButton";
import DeleteSharpIcon from "@mui/icons-material/DeleteSharp";
import AdminList from "../AdminList";

export default function TemplatesList({ templates }) {
  const router = useRouter();
  const [error, setError] = useState(null);

  async function handleDelete(e, templateId) {
    e.stopPropagation();
    if (!window.confirm("Delete this template? This cannot be undone!")) return;

    try {
      const supabase = createClient();
      await deleteTemplate(supabase, templateId);
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError.code === "23503"
          ? "This template has existing inspection submissions and cannot be deleted."
          : (deleteError.message ?? "Failed to delete template."),
      );
    }
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Button component={Link} href="/templates/new" variant="contained">
          New Template
        </Button>
      </Box>

      <AdminList
        columns={["Name", "Asset", "Fields", "Actions"]}
        searchLabel="Search templates"
        filters={[{ key: "assetType", label: "Asset type" }]}
        rows={templates.map((template) => ({
          id: template.id,
          searchText: [template.name, template.equipment_types?.code, template.equipment_types?.name].filter(Boolean).join(" "),
          filters: { assetType: template.equipment_types?.name ?? template.equipment_types?.code },
          content: <TableRow
                key={template.id}
                onClick={() => router.push(`/templates/${template.id}`)}
                sx={{ cursor: "pointer", textDecoration: "none" }}
                hover
              >
                <TableCell>{template.name}</TableCell>
                <TableCell>{template.equipment_types?.code ?? "-"}</TableCell>
                <TableCell>{template.form_fields.length}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => handleDelete(e, template.id)}
                  >
                    <DeleteSharpIcon />
                  </IconButton>
                </TableCell>
              </TableRow>,
        }))}
      />
    </>
  );
}
