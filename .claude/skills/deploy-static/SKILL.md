---
name: deploy-static
description: Build the static export and copy it to /var/www/html/algo_cloud/hilo
disable-model-invocation: true
---

# Deploy static export

The site is statically exported (`output: 'export'` in `next.config.ts`, `basePath: /hilo`, `trailingSlash: true`) and served from `/var/www/html/algo_cloud/hilo`.

## Steps

1. Confirm the deploy target exists: `ls /var/www/html/algo_cloud`. If it doesn't, this isn't the dev server. Stop and tell the user rather than creating it.
2. Run `npm run lint` and `npx tsc --noEmit`. Stop on errors.
3. Run `npm run build`. The export lands in `out/`. Stop on failure.
4. Check `out/index.html` exists.
5. Show the user what will change, `rsync -avn --delete out/ /var/www/html/algo_cloud/hilo/`, and ask for confirmation before the real sync because `--delete` removes files.
6. On confirmation, run `rsync -av --delete out/ /var/www/html/algo_cloud/hilo/`.
7. Report the build result and the number of files synced.

## Notes

- Images must be prefixed with `/hilo/` (basePath is not applied to plain `<img>` URLs).
- Never deploy with uncommitted build errors or a failing lint.
