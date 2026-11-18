import AdminList from "../AdminList";
import { Button, TableRow, TableCell, Chip } from "@mui/material";
function siteLabel(item) {
  return item.locations?.site_name ?? item.locations?.site_code ?? "-";
}

function lastInspection(latest) {
  if (!latest) return "Never";
  return latest.form_status === "cancelled"
    ? `Cancelled ${latest.inspection_date}`
    : latest.inspection_date;
}

export default function DueOverdueAlerts({ items }) {
  return (
    <AdminList
      columns={[
        "Status",
        // "Notification",
        "Asset ID",
        "Asset Name",
        "Type",
        "Location",
        "Frequency",
        "Next AMC",
        "Last Inspection",
        "Actions",
      ]}
      searchLabel="Search Asset ID, name or location"
      filters={[
        { key: "site", label: "Site" },
        { key: "type", label: "Asset Type" },
        { key: "status", label: "Status" },
      ]}
      rows={items.map((item) => ({
        id: item.id,
        searchText: [item.equipmentLabel, item.name, item.locationLabel]
          .filter(Boolean)
          .join(" "),
        filters: {
          site: siteLabel(item),
          type: item.equipment_type,
          status: item.alertStatus,
        },
        content: (
          <TableRow key={item.id}>
            <TableCell>
              <Chip
                label={
                  item.alertStatus === "new_asset"
                    ? "new asset"
                    : item.alertStatus
                }
                color={
                  item.alertStatus === "overdue"
                    ? "error"
                    : item.alertStatus === "cancelled"
                      ? "secondary"
                      : item.alertStatus === "new_asset"
                        ? "info"
                        : "warning"
                }
                size="small"
              />
            </TableCell>
            {/* <TableCell>
              {item.alertStatus === "overdue"
                ? "Checklist is overdue"
                : item.alertStatus === "due"
                  ? "Checklist is due"
                  : "-"}
            </TableCell> */}
            <TableCell>{item.equipmentLabel}</TableCell>
            <TableCell>{item.name ?? "-"}</TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
              {item.equipment_type ?? "-"}
            </TableCell>
            <TableCell>{item.locationLabel}</TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
              {item.amc_frequency}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
              {item.next_amc_date}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
              {lastInspection(item.latest)}
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
