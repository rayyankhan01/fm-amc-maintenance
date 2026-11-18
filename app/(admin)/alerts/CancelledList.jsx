import { Button, TableRow, TableCell } from "@mui/material";
import AdminList from "../AdminList";

function siteLabel(item) {
  return item.locations?.site_name ?? item.locations?.site_code ?? "-";
}

export default function CancelledList({ items }) {
  return (
    <AdminList
      columns={[
        "Asset ID",
        "Asset Name",
        "Location",
        "Cancelled on",
        "Technician",
        "Reason",
        "Actions",
      ]}
      searchLabel="Search Asset, location, technician or reason"
      filters={[
        { key: "site", label: "Site" },
        { key: "technician", label: "Technician" },
      ]}
      rows={items.map((item) => {
        const technician = item.latest?.profiles?.name ?? "-";
        const reason = item.latest?.cancellation_reason ?? "-";
        return {
          id: item.id,
          searchText: [
            item.equipmentLabel,
            item.name,
            item.locationLabel,
            technician,
            reason,
          ]
            .filter(Boolean)
            .join(" "),
          filters: { site: siteLabel(item), technician },
          content: (
            <TableRow key={item.id}>
              <TableCell>{item.equipmentLabel}</TableCell>
              <TableCell>{item.name ?? "-"}</TableCell>
              <TableCell>{item.locationLabel}</TableCell>
              <TableCell>{item.latest?.inspection_date ?? "-"}</TableCell>
              <TableCell>{technician}</TableCell>
              <TableCell sx={{ maxWidth: 320 }}>{reason}</TableCell>
              <TableCell>
                <Button size="small" href={`/equipment/${item.id}`}>
                  Open
                </Button>
              </TableCell>
            </TableRow>
          ),
        };
      })}
    />
  );
}
