'use client'

import {useState} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createEquipment, findOrCreateLocation, getNextUnitNumber } from '@/features/equipment/api';
import { MenuItem, TextField, Box, Stack, Button , Alert } from '@mui/material';



/**
 * @param {{
 *   locations: Array<{ id: string, site_code: string, room_area: string }>,
 *   equipmentTypes: Array<{ id: string, code: string, name: string }>,
 *   statuses: Array<{ code: string, label: string }>,
 * }} props
 */

export default function AddEquipmentForm({equipmentTypes, statuses}){

    const router = useRouter();
    const [form,setForm] = useState({
        equipment_type_id:'',
        equipment_type_code:'',
        unit_number:'',
        name:'',
        site_code:'',
        room_area:'',
        status: statuses[0]?.code ?? '',
    })
    const [error,setError] = useState(null);
    const [submitting,setSubmitting] = useState(null);
    const [checkingUnitNumber,setCheckingUnitNumber] = useState(false)


    function update(field,value){
        setForm((prev)=>({...prev,[field]:value}))
    }

    async function handleTypeCodeBlur(){
        const code = form.equipment_type_code.trim()
        if(!code) return;

        setCheckingUnitNumber(true);
        try{
            const supabase = createClient()
            const next = await getNextUnitNumber(supabase,code);
            update('unit_number',next);
        }finally{
            setCheckingUnitNumber(false);
        }


    }
    async function handleSubmit(e){
        e.preventDefault();
        setError(null);

        const selectedType = equipmentTypes.find((t)=>t.id === form.equipment_type_id);
        if(!selectedType){
            setError('Select an Equipment/Asset type.');
            return;
        }

        if(!form.equipment_type_code.trim()){
            setError('Equipment type code is required.');
            return;
        }

        if(!form.unit_number){
            setError('Unit number could not be determined - check the equipment type code. ');
            return;
        }

        if(!form.site_code.trim() || !form.room_area.trim()){
            setError('Site and room are required.');
            return;
        }

        setSubmitting(true);
        try{
            const supabase = createClient();
            const location_id = await findOrCreateLocation(supabase,{
                site_code : form.site_code.trim(),
                room_area: form.room_area.trim(),
            })
            await createEquipment(supabase,
                {
                        equipment_type_id:selectedType.id,
                        equipment_type: selectedType.code,
                        equipment_type_code:form.equipment_type_code.trim(),
                        unit_number: Number(form.unit_number),
                        name : form.name.trim()|| null,
                        location_id,
                        status: form.status,
                });
            router.push('/equipment');
            router.refresh();
        }catch(submitError){
            setError(
                submitError.code === '23505'
                ? 'Equipment type code + unit number combination alreayd exists.'
                :(submitError.message ?? 'Failed to create equipment. ')
            );
            setSubmitting(false);

        }
    }
    return(
        <Box component = 'form' onSubmit = {handleSubmit}>
            <Stack spacing = {2}>
                <TextField
                select
                label = 'Equipment Type'
                required
                value = {form.equipment_type_id}
                onChange={(e)=> update('equipment_type_id', e.target.value)}
                >
                    {equipmentTypes.map((t)=> 
                    <MenuItem key = {t.id} value = {t.id}>
                        {t.code}
                    </MenuItem>)}
                </TextField>


                <TextField
                label ='Equipment Type Code'
                required
                value = {form.equipment_type_code}
                helperText = 'Short code used in the displayed asset ID, e.g. SPAC'
                onChange={(e)=> update('equipment_type_code', e.target.value)}
                onBlur={handleTypeCodeBlur}
                />

                <TextField
                label = 'Unit Number'
                required
                type = 'number'
                value = {checkingUnitNumber ? 'Calculating...' : form.unit_number}
                onChange={(e)=> update('unit_number',e.target.value)}
                disabled
                />

                <TextField label ='Name' value = {form.name} onChange={(e)=> update('name',e.target.value)}/>

                <TextField
                label ='Site'
                required
                value = {form.site_code}
                helperText = 'e.g. W3'
                onChange={(e)=>update('site_code',e.target.value)}
                >
                </TextField>

                <TextField
                label = 'Room'
                required
                value = {form.room_area}
                helperText = 'e.g. Office/Room 40'
                onChange={(e)=> update('room_area',e.target.value)}
                />

                <TextField
                select 
                label = 'Status'
                value={form.status}
                onChange={(e)=> update('status',e.target.value)}
                >
                    {statuses.map((status)=>(
                        <MenuItem key={status.code} value={status.code}>
                        {status.label}
                        </MenuItem>
                    ))}
                </TextField>
                
                {error && <Alert severity="error">{error}</Alert>}

                <Button type='submit' variant ='contained' disabled={submitting}>
                    {submitting ? 'Saving ...':'Add Equipment'}
                </Button>
            </Stack>
        </Box>
    )
}