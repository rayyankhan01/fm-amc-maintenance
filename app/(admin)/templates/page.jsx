import {createClient} from '@/lib/supabase/server'
import { Box,Button, Container, Typography, Paper, Table, TableHead,TableRow, TableCell, TableBody } from '@mui/material';
import Link from 'next/link';
import TemplatesList from './TemplatesList';


export default async function AdminTemplatesPage(){
    const supabase = await createClient()

    const {data:templates, error} = await supabase
    .from('form_templates')
    .select('id,name ,equipment_types(code ,name), form_fields(id)')
    .order('name')
    console.log('templates:', templates, 'error:', error);

    if(error) throw error;

    return(
        <Container maxWidth='md' sc={{py:4}}>
                <Typography variant='h5' sx ={{mb:3}}>
                Form Templates
                </Typography>
                <TemplatesList templates={templates}/>
 
        </Container>
    )

}
