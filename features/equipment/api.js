/**
 * Finds an existing location matching site_code + room_area, or creates
 * one. Keeps locations a real table even though the form takes free text.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ site_code: string, room_area: string }} input
 * @returns {Promise<string>} location id
 */


export async function findOrCreateLocation(supabase, {site_code, room_area}){
    const {data :existing, error:findError} = await supabase
    .from('locations')
    .select('id')
    .eq('site_code', site_code)
    .eq('room_area',room_area)
    .maybeSingle()


    if(findError) throw findError;
    if(existing) return existing.id;

    const {data:created, error:createError} = await supabase
    .from('locations')
    .insert({site_code, room_area})
    .select('id')
    .single()

    if(createError) throw createError;
    return created.id;

}

/**
 * @typedef {Object} CreateEquipmentInput
 * @property {string} equipment_type_id
 * @property {string} equipment_type - legacy free-text mirror of equipment_type_id's code, required until that column is dropped
 * @property {string} equipment_type_code
 * @property {number} unit_number
 * @property {string | null} name
 * @property {string | null} location_id
 * @property {string} status
 */

/**
 * Creates a new equipment record.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {CreateEquipmentInput} input
 * @returns {Promise<string>} the new equipment id
 */
export async function createEquipment(supabase, input) {
  const { data, error } = await supabase
    .from('equipment')
    .insert(input)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Returns the next available unit_number for a given equipment_type_code
 * (numbering restarts per code, per the schema's unique constraint).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} equipmentTypeCode
 * @returns {Promise<number>}
 */


export async function getNextUnitNumber(supabase, equipmentTypeCode){
    const {data, error} = await supabase
    .from('equipment')
    .select('unit_number')
    .eq('equipment_type_code', equipmentTypeCode)
    .order('unit_number', {ascending:false})
    .limit(1)
    .maybeSingle()

    if (error) throw error;
    return (data?.unit_number ?? 0 ) +1 ;

}