/**
 * @typedef {'checklist_item' | 'text' | 'date' | 'select'} FieldType
 */

/**
 * @typedef {'OK' | 'N_OK' | 'N_A'} ChecklistResult
 */

/**
 * @typedef {Object} FormTemplate
 * @property {string} id
 * @property {string} name
 * @property {string} equipment_type
 * @property {string} created_at
 */

/**
 * @typedef {Object} FormField
 * @property {string} id
 * @property {string} template_id
 * @property {FieldType} field_type
 * @property {string | null} section
 * @property {string} label
 * @property {number} sort_order
 * @property {boolean} is_mandatory
 */

/**
 * @typedef {Object} TemplateWithFields
 * @property {string} id
 * @property {string} name
 * @property {string} equipment_type
 * @property {FormField[]} fields
 */

/**
 * @typedef {Object} FormSubmission
 * @property {string} id
 * @property {string} template_id
 * @property {string | null} equipment_id
 * @property {string | null} technician_id
 * @property {string} inspection_date
 * @property {string | null} technician_signature
 * @property {string | null} supervisor_signature
 * @property {string} submitted_at
 */

/**
 * @typedef {Object} FormResponseInput
 * @property {string} field_id
 * @property {ChecklistResult | null} [result] - for checklist_item fields
 * @property {string | null} [value] - for text/date/select fields
 * @property {string | null} [remarks] - required in app logic when result = 'N_OK'
 */

/**
 * @typedef {Object} SubmitInspectionInput
 * @property {string} template_id
 * @property {string} equipment_id
 * @property {string} technician_id
 * @property {string} inspection_date
 * @property {string} technician_signature - base64 or storage URL
 * @property {FormResponseInput[]} responses
 */

export {};
