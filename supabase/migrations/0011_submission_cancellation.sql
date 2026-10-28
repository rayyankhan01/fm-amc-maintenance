alter table form_submissions
    add column if not exists form_status text not null default 'completed'
        check (form_status in ('completed','cancelled')),
    add column if not exists cancellation_reason text;
    