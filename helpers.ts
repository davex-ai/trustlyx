import { getConfig } from "./src/core/config";

export const getAdapters = () => {
  const { adapters } = getConfig();

  return {
    email: adapters?.email,
    cache: adapters?.cache,
  };
};