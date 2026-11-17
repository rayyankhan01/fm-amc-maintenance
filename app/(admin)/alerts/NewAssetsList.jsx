import { Button, TableCell, TableRow } from "@mui/material";
import AdminList from "../AdminList";

function siteLabel(item) {
  return item.locations?.site_name ?? item.locations?.site_code ?? "-";
}

export default function NewAssetsList({ items }) {
  const newestFirst = [...items].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
  return (
    <AdminList
      columns={[
        "Asset ID",
        "Asset Name",
        "Type",
        "Location",
        "Added on",
        "Actions",
      ]}
      filters={[
        { key: "site", label: "Site" },
        { key: "type", label: "Asset Type" },
      ]}
      rows={newestFirst.map((item) => ({
        id: item.id,
        searchText: [item.equipmentLabel, item.name, item.locationLabel]
          .filter(Boolean)
          .join(" "),
        filters: { site: siteLabel(item), type: item.equipment_type },
        content: (
          <TableRow key={item.id}>
            <TableCell>{item.equipmentLabel}</TableCell>
            <TableCell>{item.name ?? "-"}</TableCell>
            <TableCell>{item.equipment_type ?? "-"}</TableCell>
            <TableCell>{item.locationLabel}</TableCell>
            <TableCell>
              {new Date(item.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button size="small" href={`/equipment/${item.id}`}>
                Open
              </Button>
            </TableCell>
          </TableRow>
        ),
      }))}
    />
  );
}
