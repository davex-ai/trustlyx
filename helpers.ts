import { getConfig } from "./src/core/config";

export const getAdapters = () => {
  const { adapters } = getConfig();

  return {
    userEmail: adapters?.email,
    cache: adapters?.cache,
  };
};