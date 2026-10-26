/** Minimal in-memory stand-in for the Supabase client used by the real route modules. */
export function createFakeSupabase(db) {
  const calls = { rpc: [], updates: [] };

  function from(table) {
    const filters = [];
    let pending = null;
    const rows = () => (db[table] || []).filter((r) => filters.every((f) => f(r)));
    const builder = {
      select: () => builder,
      eq(col, val) {
        filters.push((r) => r[col] === val);
        return builder;
      },
      contains(col, needle) {
        filters.push((r) => Array.isArray(r[col]) && r[col].includes(needle));
        return builder;
      },
      order: () => builder,
      range: () => builder,
      limit: () => builder,
      update(patch) {
        pending = patch;
        return builder;
      },
      maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
      single: async () => ({ data: rows()[0] ?? null, error: null }),
      then(resolve) {
        if (pending) calls.updates.push({ table, patch: pending });
        resolve({ data: rows(), error: null, count: rows().length });
      },
    };
    return builder;
  }

  async function rpc(name, args) {
    calls.rpc.push({ name, args });
    const handler = db.rpc?.[name];
    return handler ? handler(args) : { data: null, error: null };
  }

  return { client: { from, rpc }, calls };
}
