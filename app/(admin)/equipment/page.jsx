import { createClient } from "@/lib/supabase/server";
import { Container, TableBody, TableCell, Typography, Paper,Table,TableHead,TableRow,Chip } from "@mui/material";


export default async function AdminEquipmentPage(){
    const supabase = await createClient()

    const {data : equipment, error} = await supabase.from('equipment').
    select('id, equipment_type_code, unit_number, name, status, locations( site_code, room_area), equipment_types(code ,name)').order('unit_number', {ascending:true})

    if (error) throw error;

    return(
        <Container maxWidth='md' sx ={{py:4}}>
            <Typography>
                Assets
            </Typography>
            <Paper variant ="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Asset ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {equipment.map((item)=>{
                            const assetId= `${item.locations?.site_code ?? '?'}/${item.equipment_type_code}/${item.unit_number}`;
                            return(
                              <TableRow key ={item.id}>
                                <TableCell>{assetId}</TableCell>
                                <TableCell>{item.name ?? '-'}</TableCell>
                                <TableCell>{item.equipment_types?.name ?? '-'}</TableCell>
                                <TableCell>{item.locations?.room_area ?? '-'}</TableCell>
                                <TableCell>
                                    <Chip label = {item.status} size ='small'/>
                                </TableCell>
                              </TableRow>  
                            );
                        })}
                    </TableBody>
                </Table>
            </Paper>
        </Container>
    )
}