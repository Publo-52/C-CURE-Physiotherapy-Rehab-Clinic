<!-- BEGIN:strict-safety-rules -->
# CRITICAL SAFETY RULE: NO DELETION WITHOUT EXPLICIT USER PERMISSION

**Mandatory User Directive:**
"Without my permission kono kichu delete korbe na, kono data kono kichu na without my permission"
(Under NO circumstances should any file, code, database record, configuration, or data be deleted without explicit, prior user permission).

## Enforced Rules:
1. **NO File or Directory Deletions**:
   - NEVER delete, remove, unlink, or trash any files or directories (e.g., via `rm`, `del`, `Remove-Item`, `rmdir`, etc.) without the user's explicit prior permission.
2. **NO Data or Database Deletions**:
   - NEVER delete, wipe, or drop database records, tables, collections, schemas, or databases (e.g., `DROP TABLE`, `TRUNCATE`, `DELETE FROM`, `prisma migrate reset`, `prisma db push --force-reset`, removing SQLite/`dev.db` files).
3. **NO Destructive Git Operations**:
   - NEVER run commands that discard or delete uncommitted work, stashes, or branches (e.g., `git reset --hard`, `git clean -fd`, `git checkout -- .`, `git branch -D`, `git stash drop`).
4. **NO Code or Feature Purging**:
   - Do NOT delete existing features, components, utilities, routes, comments, or data models during refactoring without explicitly asking and receiving confirmation first.
5. **Always Request Permission First**:
   - If any action, cleanup, or refactor might lead to data loss or deletion of any resource, you MUST stop and ask for the user's explicit consent first.
<!-- END:strict-safety-rules -->
