'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { createTemplate } from "@/features/forms/api"
import { Alert, Box, MenuItem, TextField,Stack, Button } from "@mui/material"
/**
 * @param {{ equipmentTypes: Array<{ id: string, code: string, name: string }> }} props
 */
//client side component for creating a template 
export default function AddTemplateForm({equipmentTypes}){

    const router = useRouter();
    const [name, setName] = useState('');
    const [equipmentTypeId,setEquipmentTypeId] = useState('')
    const [error,setError] = useState(null);
    const[submitting,setSubmitting] = useState(null);


    async function handleSubmit(e){
        e.preventDefault()
        setError(null)

        const selectedType =  equipmentTypes.find((t)=> t.id === equipmentTypeId)
        if(!name.trim()){
            setError('Name is required!');
            return
        }
        if(!selectedType){
            setError('Select an Equipment Type!')
            return
        }


        setSubmitting(true)
        try{
            const supabase = await createClient()
            const id = await createTemplate(supabase,{
                name:name.trim(),
                equipment_type_id:selectedType.id,
                equipment_type:selectedType.code,
            });
            router.push(`/templates/${id}`)
            router.refresh()
        }
        catch(submitError){
            setError(submitError.message?? 'Failed to create a template');
            setSubmitting(false);
        }

    }



    return (
        <Box component='form' onSubmit={handleSubmit}>
            <Stack spacing = {2}>
                <TextField
                label = 'Template Name'
                required 
                value ={name}
                onChange={(e)=> setName(e.target.value)}
                />

                <TextField
                label = 'Equipment Type'
                required 
                select
                value = {equipmentTypeId}
                onChange={(e)=>setEquipmentTypeId(e.target.value)}
                >
                {
                    equipmentTypes.map((t)=>
                    (
                        <MenuItem key ={t.id} value={t.id}>
                            {t.code}
                        </MenuItem>
                    ))
                }
                </TextField>
                {error &&<Alert severity="error">{error}</Alert>}
                
                <Button type='submit' variant = 'contained' disabled={submitting}>
                    {submitting ? 'Creating...': 'Create Template'}
                </Button>
            </Stack>
        </Box>
    )

}