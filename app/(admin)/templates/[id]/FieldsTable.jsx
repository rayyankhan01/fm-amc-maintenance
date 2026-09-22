'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { deleteFormField, updateFormField } from "@/features/forms/api";
import { Paper, TableRow, TextField, Stack, Button, Checkbox, MenuItem, TableBody, TableCell, Typography, Table, TableHead,Chip, Icon } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import ArrowUpwardSharpIcon from '@mui/icons-material/ArrowUpwardSharp';
import ArrowDownwardSharpIcon from '@mui/icons-material/ArrowDownwardSharp';
import EditSharpIcon from '@mui/icons-material/EditSharp';
import DeleteSharpIcon from '@mui/icons-material/DeleteSharp';


const FIELD_TYPES = [
  { value: 'checklist_item', label: 'Checklist Item' },
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
];

/**
 * @param {{ fields: Array<{ id: string, section: string | null, label: string, field_type: string, sort_order: number, is_mandatory: boolean }> }} props
 */

export default function FieldsTable({fields}){
    const router = useRouter()
    const [editingId, setEditingId] = useState(null);
    const [editForm,setEditForm] = useState(null);
    const [error,setError] = useState(null)

    function startEdit(field){
        setEditingId(field.id);
        setEditForm({
            section : field.section ?? ' ',
            label : field.label,
            field_type : field.field_type,
            is_mandatory: field.is_mandatory

        });
        setError(null)
    }

    function cancelEdit(){
        setEditingId(null)
        setEditForm(null)
    }


    async function saveEdit(fieldId){
        if (!editForm.label.trim()){
            setError('Label is required')
            return;
        }
        const duplicate = fields.some((field) =>
            field.id !== fieldId &&
            field.field_type === editForm.field_type &&
            (field.section ?? '').trim().toLowerCase() === editForm.section.trim().toLowerCase() &&
            field.label.trim().toLowerCase() === editForm.label.trim().toLowerCase()
        );
        if (duplicate) {
            setError('A field with the same section, type, and label already exists.')
            return;
        }
        try{
            const supabase =createClient()
            await updateFormField(supabase, fieldId,{
                section:editForm.section,
                label : editForm.label,
                field_type:editForm.field_type,
                is_mandatory:editForm.is_mandatory
            })
            setEditingId(null);
            setEditForm(null)
            router.refresh()

        }catch(updateError){
            setError(updateError.message ?? 'Failed to update field')
        }
    }

    async function handleDelete(fieldId){
        if(!window.confirm('Delete this? This cannot be undone ! ')) return;

        try{
            const supabase =createClient()
                await deleteFormField(supabase,fieldId)
                router.refresh()
        }catch(deleteError){
            setError(
                deleteError.code === '23503' 
            ? 'This filed has existing inspection messages and cannot be deleted ':(deleteError.message ?? 'Deletion failed'))
        }
    }

    
    async function moveField(field,direction){
        const index= fields.findIndex((f)=>f.id === field.id);
        const swapIndex = direction === 'up' ? index - 1 : index +1;
        if(swapIndex < 0 || swapIndex >= fields.length) return;

        const swapField = fields[swapIndex];

        try{
            const supabase = createClient();
            await updateFormField(supabase, field.id, {sort_order:swapField.sort_order});
            await updateFormField(supabase, swapField.id, {sort_order:field.sort_order})
            router.refresh()
        }catch(moveError){
            setError(moveError.message ?? "Failed to reorder field.")
        }

    }


    return(
        <Paper variant ="outlined" sx ={{mb:3}}>
            {error && <Typography color = 'error' sx = {{p:1}}>{error}</Typography>}
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Order</TableCell>
                        <TableCell>Section</TableCell>
                        <TableCell>Label</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Mandatory</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {fields.map((field, index)=>{
                        const isEditing = field.id ===editingId;
                        if(isEditing){
                            return(
                                <TableRow key ={field.id}>
                                    <TableCell>{field.sort_order}</TableCell>
                                    <TableCell>
                                        <TextField 
                                        size ='small'
                                        value={editForm.section}
                                        onChange ={(e)=> setEditForm((f)=> ({...f,section:e.target.value}))}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                        size ='small'
                                        value ={editForm.label}
                                        onChange={(e)=> setEditForm((f)=> ({...f,label:e.target.value}))}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                        select
                                        size = 'small'
                                        value ={editForm.field_type}
                                        onChange={(e)=> setEditForm((f)=>({...f,field_type:e.target.value}))}
                                        >
                                        {FIELD_TYPES.map((t) => (
                                            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                        ))}
                                        </TextField>
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={editForm.is_mandatory}
                                            onChange={(e)=> setEditForm((f)=>({...f,is_mandatory:e.target.checked}))}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction='row' spacing ={1}>
                                            <Button size ='small' onClick={()=> saveEdit(field.id)}>Save</Button>
                                            <Button size ='small' onClick={cancelEdit}>Cancel</Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        }
                        return(
                           <TableRow key ={field.id}>
                                <TableCell>{field.sort_order}</TableCell>
                                <TableCell>{field.section ?? '-'}</TableCell>
                                <TableCell>{field.label}</TableCell>
                                <TableCell>{field.field_type}</TableCell>
                                <TableCell>{field.is_mandatory ? <Chip label='required' size ='small'/>:null}</TableCell>
                                <TableCell>
                                    <Stack direction='row' spacing ={1}>
                                        <IconButton size = 'small' disabled={index===0} onClick={()=> moveField(field,'up')}>
                                            <ArrowUpwardSharpIcon/>
                                        </IconButton>
                                        <IconButton size = 'small' disabled={index===fields.length - 1} onClick={()=> moveField(field,'down')}>
                                            <ArrowDownwardSharpIcon/>
                                        </IconButton>
                                        <IconButton size ='small' onClick={()=>startEdit(field)}>
                                            <EditSharpIcon/>
                                        </IconButton>
                                        <IconButton size = 'small' color ='error' onClick={()=> handleDelete(field.id)}>
                                            <DeleteSharpIcon/>
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                           </TableRow> 
                        )
                    })}
                </TableBody>
            </Table>
        </Paper>
    )

}