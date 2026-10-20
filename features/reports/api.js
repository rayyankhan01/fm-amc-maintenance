export async function getInspectionReportData(supabase) {
  const [{ data: equipment, error: equipmentError }, { data: submissions, error: submissionError }, { data: frequencies, error: frequencyError }, { data: occurrences, error: occurrenceError }, { data: maintenanceIssues, error: maintenanceIssuesError }] = await Promise.all([
    supabase
      .from('equipment')
      .select('id, asset_id, equipment_type, equipment_type_code, unit_number, name, amc_frequency, amc_date, next_amc_date, equipment_types(name), locations(site_code, site_name, room_area)')
      .order('next_amc_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('form_submissions')
      .select('id, inspection_date, submitted_at, equipment_id, equipment(asset_id, equipment_type, equipment_type_code, unit_number, equipment_types(name), locations(site_code, site_name, room_area)), profiles(name), form_templates(name), form_responses(result)')
      .order('inspection_date', { ascending: false }),
    supabase
      .from('maintenance_frequencies')
      .select('code, interval_days'),
    supabase
      .from('inspection_schedule_occurrences')
      .select('id, equipment_id, scheduled_date, status, submission_id, completed_at, cancelled_at')
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('maintenance_issues')
      .select('id, equipment_id, status, opened_at, resolved_at, resolved_by, resolution_comment, form_responses(remarks, form_fields(label))')
      .order('opened_at', { ascending: false }),
  ]);

  if (equipmentError) throw equipmentError;
  if (submissionError) throw submissionError;
  if (frequencyError) throw frequencyError;
  if (occurrenceError) throw occurrenceError;
  if (maintenanceIssuesError) throw maintenanceIssuesError;

  const resolverIds = [...new Set((maintenanceIssues ?? []).map((issue) => issue.resolved_by).filter(Boolean))];
  const { data: resolvers, error: resolversError } = resolverIds.length
    ? await supabase.from('profiles').select('id, name').in('id', resolverIds)
    : { data: [], error: null };
  if (resolversError) throw resolversError;
  const resolverNameById = new Map((resolvers ?? []).map((profile) => [profile.id, profile.name]));

  const historyByEquipment = new Map();
  for (const submission of submissions ?? []) {
    if (!submission.equipment_id) continue;
    const history = historyByEquipment.get(submission.equipment_id) ?? [];
    history.push(submission);
    historyByEquipment.set(submission.equipment_id, history);
  }
  const maintenanceHistoryByEquipment = new Map();
  for (const issue of maintenanceIssues ?? []) {
    if (!issue.equipment_id) continue;
    const history = maintenanceHistoryByEquipment.get(issue.equipment_id) ?? [];
    history.push({ ...issue, resolverName: resolverNameById.get(issue.resolved_by) ?? null });
    maintenanceHistoryByEquipment.set(issue.equipment_id, history);
  }

  const today = new Date().toISOString().slice(0, 10);
  const equipmentRows = (equipment ?? []).map((item) => {
    const history = historyByEquipment.get(item.id) ?? [];
    const maintenanceHistory = maintenanceHistoryByEquipment.get(item.id) ?? [];
    const latest = history[0] ?? null;
    return {
      ...item,
      history,
      maintenanceHistory,
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
    frequencies: frequencies ?? [],
    occurrences: occurrences ?? [],
    completed: submissions ?? [],
    pending: equipmentRows.filter((item) => item.scheduleStatus === 'pending'),
    overdue: equipmentRows.filter((item) => item.scheduleStatus === 'overdue'),
    nok: (submissions ?? []).filter((submission) =>
      (submission.form_responses ?? []).some((response) => response.result === 'N_OK'),
    ),
  };
}
