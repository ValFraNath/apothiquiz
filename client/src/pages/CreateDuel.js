import axios from "axios";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "react-query";

import Avatar from "../components/Avatar";
import ButtonFullWidth from "../components/buttons/ButtonFullWidth";
import Loading from "../components/Loading";
import PageError from "../components/PageError";
import { getChallengeableUsers } from "../utils/apiQueries";

const CreateDuel = () => {
  const [searchRegex, setSearchRegex] = useState(null);
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: listOfUsers, isSuccess, isError } = useQuery(
    ["users", "challengeable"],
    getChallengeableUsers,
    {
      staleTime: 60 * 60 * 1000,
      refetchOnMount: false,
    }
  );

  if (isError) {
    return <PageError message="Erreur lors du chargement de la page" />;
  }

  if (!isSuccess) {
    return <Loading />;
  }

  function createDuel(opponent) {
    axios
      .post("/api/v1/duels/new", {
        opponent: opponent,
      })
      .then((res) => {
        queryClient.invalidate(["users", "challengeable"]);
        document.location.replace(`/duel/${res.data.id}`);
      })
      .catch((err) => console.error(err));
  }

  return (
    <main id="create-duel">
      <section>
        <h1>Créer un nouveau duel</h1>
        <input
          type="text"
          placeholder="Rechercher un utilisateur"
          onChange={(event) => {
            setSelected(null);
            setSearchRegex(new RegExp(event.target.value, "i"));
          }}
        ></input>
      </section>

      <section>
        <ul>
          {Object.keys(listOfUsers)
            .filter((pseudo) => !searchRegex || searchRegex.test(pseudo))
            .map((pseudo) => {
              const user = listOfUsers[pseudo];
              return (
                <li
                  key={user.pseudo}
                  onClick={() => setSelected(user.pseudo)}
                  className={selected === user.pseudo ? "selected" : ""}
                >
                  <Avatar size="50px" infos={user.avatar} />
                  <p>{user.pseudo}</p>
                </li>
              );
            })}
        </ul>
      </section>

      <section>
        {selected ? (
          <ButtonFullWidth onClick={() => createDuel(selected)}>Lancer le duel</ButtonFullWidth>
        ) : (
          <p>Veuillez choisir un adversaire</p>
        )}
      </section>
    </main>
  );
};

export default CreateDuel;
