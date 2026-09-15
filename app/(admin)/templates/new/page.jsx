import { createClient } from "@/lib/supabase/server";
import AddTemplateForm from "./AddTemplateForm";
import { Typography, Container } from "@mui/material";

//server component for creating a new template
export default async function NewTemplatePage(){
    const supabase = await createClient();

    const {data:equipmentTypes,error} = await supabase
    .from('equipment_types')
    .select ( 'id, code, name')
    .order('name')

    if (error) throw error;

    return(
        <Container maxWidth ='sm' sx ={{py:4}}>
            <Typography variant='h5' sx ={{mb:3}}>
                New Form Template
            </Typography>
            <AddTemplateForm equipmentTypes={equipmentTypes}/>
        </Container>
    )

}