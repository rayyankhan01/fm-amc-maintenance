'use client';

import Link from 'next/link';
import {
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Typography,
  Paper,
} from '@mui/material';

/**
 * @param {{ equipment: Array<{
 *   id: string,
 *   equipment_type_code: string,
 *   unit_number: number,
 *   name: string | null,
 *   equipment_type: string,
 *   status: string,
 *   locations: { site_code: string, room_area: string } | null,
 * }> }} props
 */
export default function EquipmentList({ equipment }) {
  if (equipment.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        No equipment found.
      </Typography>
    );
  }

  return (
    <Paper variant="outlined">
      <List disablePadding>
        {equipment.map((item) => {
          const assetId = `${item.locations?.site_code ?? '?'}/${item.equipment_type_code}/${item.unit_number}`;

          return (
            <ListItemButton
              key={item.id}
              component={Link}
              href={`/inspections/${item.id}`}
              divider
            >
              <ListItemText
                primary={item.name ?? item.equipment_type}
                secondary={`${assetId} · ${item.locations?.room_area ?? ''}`}
              />
              <Chip label={item.status} size="small" />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
}
