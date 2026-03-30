import { getConfig } from "./src/core/config";

export const getAdapters = () => {
  const { adapters } = getConfig();

  return {
    email: adapters?.email,
    cache: adapters?.cache,
  };
};


export const resolveTenant = (req: any) => {
  const { getTenant } = getConfig();

  if (!getTenant) throw new Error("Tenant resolver not configured");

  return getTenant(req);
};

