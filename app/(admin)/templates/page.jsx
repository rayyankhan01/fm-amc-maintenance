import {createClient} from '@/lib/supabase/server'
import { Container, Typography, Paper, Table, TableHead,TableRow, TableCell, TableBody } from '@mui/material';


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
            <Paper variant = 'outlined'>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Equipment</TableCell>
                            <TableCell>Fields</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {templates.map((template)=>(
                            <TableRow key ={template.id}>
                                <TableCell>{template.name}</TableCell>
                                <TableCell>{template.equipment_types?.code ?? '-'}</TableCell>
                                <TableCell>{template.form_fields.length}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Container>
    )

}
