'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addFormField } from "@/features/forms/api";
import { Alert, Checkbox, FormControlLabel, MenuItem, TextField, Box, Stack, Button } from "@mui/material";



const FIELD_TYPES = [
  { value: 'checklist_item', label: 'Checklist Item (OK/N_OK/N_A)' },
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
];

/**
 * @param {{ templateId: string, fields: Array<{ sort_order: number }> }} props
 */
export default function AddFieldForm({templateId, fields}){
    const router = useRouter()
    const [fieldType, setFieldType] = useState('checklist_item');
    const [section, setSection] = useState('');
    const [label, setLabel] = useState('');
    const [isMandatory, setIsMandatory] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e){
        e.preventDefault()
        setError(null)

        if(!label.trim()){
            setError('Label is required.')
            return;
        }

        const nextSortOrder=
            fields.length > 0 ? Math.max(...fields.map((f) => f.sort_order)) + 1 : 1;


        setSubmitting(true);
        try{
            const supabase = createClient();
            await addFormField(supabase,
                {
                    template_id:templateId,
                    field_type:fieldType,
                    section:section.trim()||null,
                    label:label.trim(),
                    sort_order:nextSortOrder,
                    is_mandatory:isMandatory
                }
            );
            setLabel('');
            router.refresh()
        }catch(submitError){
            setError(submitError.message ?? 'Failed to add field.');
        }finally{
            setSubmitting(false);
        }
    }

    return(
        <Box component='form' onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <TextField
                select
                label='Field Type'
                value = {fieldType}
                onChange = {(e)=>setFieldType(e.target.value)}
                >
                    {FIELD_TYPES.map((t)=>(
                        <MenuItem key = {t.value} value={t.value}>
                            {t.label}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                label='Section'
                helperText="Optional - groups checklist items, e.g. 'Condensing Unit'"
                value = {section}
                onChange={(e)=> setSection(e.target.value)}
                />

                <TextField
                label ='Label'
                required
                value={label}
                onChange={(e)=>setLabel(e.target.value)}
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked ={isMandatory}
                            onChange={(e)=> setIsMandatory(e.target.checked)}
                        
                        
                        />
                    }
                label = 'Mandatory'
                />

                {error && <Alert severity="error">{error}</Alert>}

                <Button type ="submit" variant ='contained' disabled={submitting}>
                    {submitting ? 'Adding...':'Add Field'}
                </Button>
            </Stack>
        </Box>
    )
}