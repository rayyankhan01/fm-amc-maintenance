export async function getInspectionReportData(supabase) {
  const [{ data: equipment, error: equipmentError }, { data: submissions, error: submissionError }] = await Promise.all([
    supabase
      .from('equipment')
      .select('id, asset_id, equipment_type, equipment_type_code, unit_number, name, amc_frequency, amc_date, next_amc_date, locations(site_code, site_name, room_area)')
      .order('next_amc_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('form_submissions')
      .select('id, inspection_date, submitted_at, equipment_id, equipment(asset_id, equipment_type_code, unit_number, locations(site_code, site_name, room_area)), profiles(name), form_templates(name), form_responses(result)')
      .order('inspection_date', { ascending: false }),
  ]);

  if (equipmentError) throw equipmentError;
  if (submissionError) throw submissionError;

  const historyByEquipment = new Map();
  for (const submission of submissions ?? []) {
    if (!submission.equipment_id) continue;
    const history = historyByEquipment.get(submission.equipment_id) ?? [];
    history.push(submission);
    historyByEquipment.set(submission.equipment_id, history);
  }

  const today = new Date().toISOString().slice(0, 10);
  const equipmentRows = (equipment ?? []).map((item) => {
    const history = historyByEquipment.get(item.id) ?? [];
    const latest = history[0] ?? null;
    return {
      ...item,
      history,
      latest,
      scheduleStatus: !item.next_amc_date
        ? 'unscheduled'
        : latest && latest.inspection_date >= item.next_amc_date
          ? 'completed'
          : item.next_amc_date < today
            ? 'overdue'
            : 'pending',
    };
  });

  return {
    equipment: equipmentRows,
    completed: submissions ?? [],
    pending: equipmentRows.filter((item) => item.scheduleStatus === 'pending'),
    overdue: equipmentRows.filter((item) => item.scheduleStatus === 'overdue'),
    nok: (submissions ?? []).filter((submission) =>
      (submission.form_responses ?? []).some((response) => response.result === 'N_OK'),
    ),
  };
}
