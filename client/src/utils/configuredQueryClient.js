import { QueryClient } from "react-query";

import { getDuels } from "./queryDuels";
import { makeGetUserInfo } from "./queryUsers";

const queryClient = new QueryClient();

// Here we define the defaults functions for general queries

queryClient.setQueryDefaults(["user", "me"], {
  queryFn: makeGetUserInfo("me"),
  staleTime: Infinity,
});

queryClient.setQueryDefaults("duels", {
  queryFn: getDuels,
  staleTime: 60 * 1000,
  refetchOnMount: "always",
});

export default queryClient;
