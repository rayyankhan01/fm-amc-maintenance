

import { getTemplateWithFields } from "@/features/forms/api";
import { createClient } from "@/lib/supabase/server";
import { Container, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography, Chip } from "@mui/material";
import AddFieldForm from "./AddFieldForm";

//server component
export default async function TemplateBuilderPage({params}){
    const {id} = await params;
    
    const supabase = await createClient()

    const template = await getTemplateWithFields(supabase,id);

    return(
        <Container maxWidth ='md' sx ={{py:4}}>
                <Typography variant="h5" sx={{mb:1}}>
                    {template.name}
                </Typography>
                <Typography variant ='body2' color = 'text.secondary' sx={{mb:3}}>
                    {template.equipment_type}
                </Typography>
                <Paper variant = 'outlined' sx ={{mb:3}}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Order</TableCell>
                                <TableCell>Section</TableCell>
                                <TableCell>Label</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Mandatory</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {template.fields.map((field)=>(
                                <TableRow key = {field.id}>
                                    <TableCell>{field.sort_order}</TableCell>
                                    <TableCell>{field.section ??'-'}</TableCell>
                                    <TableCell>{field.label}</TableCell>
                                    <TableCell>{field.field_type}</TableCell>
                                    <TableCell>{field.is_mandatory? <Chip label ='Required' size ="small"/>:null}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>

                <Typography variant ='subtitle1' sx ={{mb:2}} >
                    Add Field
                </Typography>
                <AddFieldForm templateId={template.id} fields = {template.fields}/>

        </Container>
    )

}