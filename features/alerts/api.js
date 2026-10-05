function equipmentLabel(item) {
  return item.asset_id ?? `${item.equipment_type_code}/${item.unit_number}`;
}

function locationLabel(location) {
  if (!location) return "-";
  return (
    [location.site_name, location.site_code, location.room_area]
      .filter(Boolean)
      .join(" / ") || "-"
  );
}

export async function getInspectionAlerts(supabase) {
  const equipmentSelect =
    "id, asset_id, equipment_type, equipment_type_code, unit_number, name, amc_frequency, created_at, next_amc_date, is_submitted_by_tech, locations(site_code, site_name, room_area)";
  const legacyEquipmentSelect =
    "id, asset_id, equipment_type, equipment_type_code, unit_number, name, amc_frequency, created_at, next_amc_date, locations(site_code, site_name, room_area)";
  let [
    { data: equipment, error: equipmentError },
    { data: submissions, error: submissionError },
  ] = await Promise.all([
    supabase
      .from("equipment")
      .select(equipmentSelect)
      .order("next_amc_date", { ascending: true }),
    supabase
      .from("form_submissions")
      .select(
        "id, equipment_id, inspection_date, profiles(name), form_templates(name)",
      )
      .order("inspection_date", { ascending: false }),
  ]);

  if (equipmentError?.code === "42703") {
    const legacyResult = await supabase
      .from("equipment")
      .select(legacyEquipmentSelect)
      .order("next_amc_date", { ascending: true });
    equipment = legacyResult.data;
    equipmentError = legacyResult.error;
  }

  if (equipmentError) throw equipmentError;
  if (submissionError) throw submissionError;

  const latestByEquipment = new Map();
  for (const submission of submissions ?? []) {
    if (!latestByEquipment.has(submission.equipment_id)) {
      latestByEquipment.set(submission.equipment_id, submission);
    }
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const newAssetCutoff = new Date(now);
  newAssetCutoff.setDate(newAssetCutoff.getDate() - 30);
  const scheduleAlerts = (equipment ?? [])
    .map((item) => {
      const latest = latestByEquipment.get(item.id) ?? null;
      if (!item.next_amc_date) return null;
      const isCompleted =
        latest && latest.inspection_date >= item.next_amc_date;
      if (isCompleted) return null;

      return {
        ...item,
        equipmentLabel: equipmentLabel(item),
        locationLabel: locationLabel(item.locations),
        latest,
        alertStatus: item.next_amc_date < today ? "overdue" : "due",
      };
    })
    .filter(Boolean);
  const newAssets = (equipment ?? [])
    .filter(
      (item) =>
        item.is_submitted_by_tech === true &&
        item.created_at &&
        new Date(item.created_at) >= newAssetCutoff,
    )
    .map((item) => ({
      ...item,
      equipmentLabel: equipmentLabel(item),
      locationLabel: locationLabel(item.locations),
      alertStatus: "new_asset",
    }));
  const alerts = [...newAssets, ...scheduleAlerts];

  return {
    alerts,
    due: scheduleAlerts.filter((item) => item.alertStatus === "due"),
    overdue: scheduleAlerts.filter((item) => item.alertStatus === "overdue"),
    newAssets,
  };
}
