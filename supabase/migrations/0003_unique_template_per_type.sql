alter table form_templates
  add constraint form_templates_equipment_type_id_unique unique (equipment_type_id);