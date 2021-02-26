import { QueryClient } from "react-query";

import { getAllDuels } from "./queryDuels";
import { makeGetUserInfo } from "./queryUsers";

const queryClient = new QueryClient();

// Here we define the defaults functions for general queries

queryClient.setQueryDefaults(["user", "me"], {
  queryFn: makeGetUserInfo("me"),
  staleTime: Infinity,
  placeholderData: {
    avatar: {
      eyes: 0,
      hands: 0,
      hat: 0,
      mouth: 0,
      colorBody: "#000000", // black
      colorBG: "#D3D3D3", // lightgray
    },
    defeats: "-",
    pseudo: "Pseudonyme",
    victories: "-",
  },
});

queryClient.setQueryDefaults("duels", {
  queryFn: getAllDuels,
  staleTime: 60 * 1000,
  refetchOnMount: "always",
});

export default queryClient;
