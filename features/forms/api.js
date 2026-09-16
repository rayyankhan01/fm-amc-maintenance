/**
 * @typedef {import('./types').TemplateWithFields} TemplateWithFields
 * @typedef {import('./types').SubmitInspectionInput} SubmitInspectionInput
 */

/**
 * Fetches a form template with its fields, ordered for rendering.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} templateId
 * @returns {Promise<TemplateWithFields>}
 */
export async function getTemplateWithFields(supabase, templateId) {
  const { data: template, error: templateError } = await supabase
    .from('form_templates')
    .select('id, name, equipment_type')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  const { data: fields, error: fieldsError } = await supabase
    .from('form_fields')
    .select('id, template_id, field_type, section, label, sort_order, is_mandatory')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: true });

  if (fieldsError) throw fieldsError;

  return { ...template, fields };
}

/**
 * Finds the form template for a given equipment type (e.g. 'AC').
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} equipmentType
 * @returns {Promise<{ id: string, name: string, equipment_type: string } | null>}
 */
export async function getTemplateForEquipmentType(supabase, equipmentType) {
  const { data, error } = await supabase
    .from('form_templates')
    .select('id, name, equipment_type')
    .eq('equipment_type', equipmentType)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Submits a completed inspection: one form_submissions row plus one
 * form_responses row per answered field.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {SubmitInspectionInput} input
 * @returns {Promise<string>} the new submission id
 */
export async function submitInspection(supabase, input) {
  const {
    template_id,
    equipment_id,
    technician_id,
    inspection_date,
    technician_signature,
    responses,
  } = input;

  const { data: submission, error: submissionError } = await supabase
    .from('form_submissions')
    .insert({
      template_id,
      equipment_id,
      technician_id,
      inspection_date,
      technician_signature,
    })
    .select('id')
    .single();

  if (submissionError) throw submissionError;

  const rows = responses.map((r) => ({
    submission_id: submission.id,
    field_id: r.field_id,
    result: r.result ?? null,
    value: r.value ?? null,
    remarks: r.remarks ?? null,
  }));

  const { error: responsesError } = await supabase
    .from('form_responses')
    .insert(rows);

  if (responsesError) throw responsesError;

  return submission.id;
}
export async function createTemplate(supabase, input) {
  const { data, error } = await supabase
    .from('form_templates')
    .insert(input)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Adds a field to a form template.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ template_id: string, field_type: string, section: string | null, label: string, sort_order: number, is_mandatory: boolean }} input
 * @returns {Promise<string>} the new field id
 */

export async function addFormField(supabase,input){
    const {data,error}= await supabase
    .from('form_fields')
    .insert(input)
    .select('id')
    .single()

    if(error) throw error;
    return data.id

}

/**
 * Updates an existing form field's definition.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} fieldId
 * @param {{ label: string, section: string | null, field_type: string, is_mandatory: boolean }} input
 * @returns {Promise<void>}
 */

export async function updateFormField(supabase,fieldId, input){
    const {error} = await supabase
    .from('form_fields')
    .update(input)
    .eq('id', fieldId)

    if (error) throw error;
}

/**
 * Deletes a form field from a template.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} fieldId
 * @returns {Promise<void>}
 */
export async function deleteFormField(supabase,fieldId){
    const {error} = await supabase
    .from('form_fields')
    .delete()
    .eq('id',fieldId)

    if(error) throw error;
}
/**
 * Deletes a form template.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} templateId
 * @returns {Promise<void>}
 */
export async function deleteTemplate(supabase, templateId){
    const {error} = await supabase
    .from('form_templates')
    .delete()
    .eq('id',templateId)

    if(error) throw error;
}