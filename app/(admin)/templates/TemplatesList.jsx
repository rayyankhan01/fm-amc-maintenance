'use client'

import Link from "next/link"
import {Paper, Table, TableHead, TableRow, TableCell,TableBody, Button,Box} from '@mui/material'
import { useRouter } from "next/navigation"


export default function TemplatesList({templates}){
    const router = useRouter();
    
    return(
    
    <>
    
            <Box sx ={{display:'flex', justifyContent:'space-between', alignItems:'center', mb:3}}>
                <Button component={Link} href='/templates/new' variant = 'contained'>
                    New Template
                </Button>
            </Box>
         
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
                            <TableRow 
                            key ={template.id}
                            onClick={()=> router.push(`/templates/${template.id}`)}
                            sx = {{cursor:'pointer', textDecoration:'none'}}
                            hover
                            >
                                <TableCell>{template.name}</TableCell>
                                <TableCell>{template.equipment_types?.name ?? '-'}</TableCell>
                                <TableCell>{template.form_fields.length}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
    </>
            
    );
}