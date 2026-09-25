'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';

const LABELS = {
  configuration: 'Configuration',
  dashboard: 'Dashboard',
  equipment: 'Equipment',
  'equipment-types': 'Equipment types',
  frequencies: 'Maintenance frequencies',
  locations: 'Locations',
  reports: 'Reports',
  statuses: 'Statuses',
  templates: 'Templates',
  users: 'Users',
  new: 'New',
};

function isRecordId(segment) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment);
}

function labelFor(segment) {
  if (isRecordId(segment)) return 'Details';
  return LABELS[segment] ?? segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const items = [{ label: 'Dashboard', href: '/dashboard' }];

  segments.forEach((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const isCurrent = index === segments.length - 1;
    items.push({ label: labelFor(segment), href: isCurrent ? null : href });
  });

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ px: 3, pt: 2, pb: 1 }}>
      {items.map((item, index) => item.href ? (
        <MuiLink key={`${item.href}-${index}`} component={Link} href={item.href} underline="hover" color="inherit">
          {item.label}
        </MuiLink>
      ) : (
        <Typography key={`${item.label}-${index}`} color="text.primary">
          {item.label}
        </Typography>
      ))}
    </Breadcrumbs>
  );
}