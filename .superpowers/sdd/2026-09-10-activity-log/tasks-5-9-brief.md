# Tasks 5-9: Add Logging to Existing Components

## Task Description

Add activity logging to existing admin components by importing logActivity and calling it after successful operations.

## Files to Modify

- `components/admin/UserTable.tsx` (Task 5)
- `components/admin/EventForm.tsx` (Task 6)
- `components/admin/OfficerForm.tsx` (Task 7)
- `components/admin/AnnouncementForm.tsx` (Task 8)
- `components/admin/AnnouncementList.tsx` (Task 8)
- `components/admin/SettingsForm.tsx` (Task 9)

## Interfaces

- Consumes: `logActivity()` from `lib/activity-log.ts`
- Produces: Log entries for each action type

## Task 5: User Logging (UserTable.tsx)

After successful status update via `supabase.rpc('admin_update_user_status', ...)`, add:

```typescript
await logActivity({
  action: `user.${newStatus}`,
  targetType: 'user',
  targetId: userId,
  targetName: userEmail,
  details: {
    before: { status: currentStatus },
    after: { status: newStatus }
  }
})
```

## Task 6: Event Logging (EventForm.tsx)

After successful event insert:
```typescript
await logActivity({
  action: 'event.create',
  targetType: 'event',
  targetId: data.id,
  targetName: title,
  details: { after: { title, event_date: eventDate } }
})
```

After successful event update:
```typescript
await logActivity({
  action: 'event.update',
  targetType: 'event',
  targetId: initialData.id,
  targetName: title,
  details: {
    before: { title: initialData.title, event_date: initialData.event_date },
    after: { title, event_date: eventDate }
  }
})
```

## Task 7: Officer Logging (OfficerForm.tsx)

After successful officer insert:
```typescript
await logActivity({
  action: 'officer.create',
  targetType: 'officer',
  targetId: data.id,
  targetName: `${name} - ${position}`,
  details: { after: { name, position, term_year: termYear } }
})
```

After successful officer update:
```typescript
await logActivity({
  action: 'officer.update',
  targetType: 'officer',
  targetId: officer.id,
  targetName: `${name} - ${position}`,
  details: {
    before: { name: officer.name, position: officer.position },
    after: { name, position }
  }
})
```

After successful officer delete:
```typescript
await logActivity({
  action: 'officer.delete',
  targetType: 'officer',
  targetId: id,
  targetName: `${officer.name} - ${officer.position}`,
  details: { before: { name: officer.name, position: officer.position } }
})
```

## Task 8: Announcement Logging (AnnouncementForm.tsx & AnnouncementList.tsx)

After successful announcement insert:
```typescript
await logActivity({
  action: 'announcement.create',
  targetType: 'announcement',
  targetId: data.id,
  targetName: title,
  details: { after: { title, is_pinned: isPinned } }
})
```

After successful announcement update:
```typescript
await logActivity({
  action: 'announcement.update',
  targetType: 'announcement',
  targetId: initialData.id,
  targetName: title,
  details: {
    before: { title: initialData.title, is_pinned: initialData.is_pinned },
    after: { title, is_pinned: isPinned }
  }
})
```

After successful announcement delete:
```typescript
await logActivity({
  action: 'announcement.delete',
  targetType: 'announcement',
  targetId: id,
  targetName: title,
  details: { before: { title } }
})
```

## Task 9: Settings Logging (SettingsForm.tsx)

After successful settings update, log only changed fields:

```typescript
const changes: Record<string, any> = {}
const before: Record<string, any> = {}

if (siteName !== initialData.site_name) {
  before.site_name = initialData.site_name
  changes.site_name = siteName
}
if (tagline !== initialData.tagline) {
  before.tagline = initialData.tagline
  changes.tagline = tagline
}
if (primaryColor !== initialData.primary_color) {
  before.primary_color = initialData.primary_color
  changes.primary_color = primaryColor
}
// ... repeat for other fields (about, mission, vision, logo visibility)

if (Object.keys(changes).length > 0) {
  await logActivity({
    action: 'settings.update',
    targetType: 'settings',
    targetName: 'Organization Settings',
    details: {
      before: Object.keys(before).length > 0 ? before : undefined,
      after: changes
    }
  })
}
```

## Commits

Create one commit per task:
```bash
git commit -m "feat: add logging to user approve/reject/ban actions"
git commit -m "feat: add logging to event create/update actions"
git commit -m "feat: add logging to officer create/update/delete actions"
git commit -m "feat: add logging to announcement create/update/delete actions"
git commit -m "feat: add logging to settings update actions"
```
