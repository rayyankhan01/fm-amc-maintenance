import { createClient } from "@/lib/supabase/server";
import { Typography, Container } from "@mui/material";
import AddEquipmentForm from './AddEquipmentForm';

export default async function NewEquipmentPage(){
    const supabase = await createClient();

    const {data:equipmentTypes, error:typesError}=
        await supabase.from('equipment_types').select('id,code, name').order('name')

    if(typesError) throw typesError;

    return(
        <Container maxWidth = 'sm' sx ={{py:4}}>
            <Typography variant ="h5" sx={{mb:3}}>
                Add Equipment
            </Typography>
            <AddEquipmentForm equipmentTypes={equipmentTypes}/>
        </Container>
    )

}