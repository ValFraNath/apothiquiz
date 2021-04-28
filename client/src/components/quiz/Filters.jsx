import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";

import Loading from "../status/Loading";

const Filters = ({ difficulty, changeDifficulty, changeSystem }) => {
  const { data: systems, isLoading } = useQuery(["chemicals", "systems"]);

  if (isLoading) return <Loading />;

  return (
    <div id="filters">
      <h2> Niveau des questions : </h2>
      <label>
        <input
          onChange={changeDifficulty}
          type="radio"
          name="difficulty"
          value={0}
          defaultChecked={true}
        />
        Débutant
      </label>
      <label>
        <input onChange={changeDifficulty} type="radio" name="difficulty" value={2} />
        Expert
      </label>
      {difficulty === 2 && (
        <>
          <h2>Sélection des systèmes : </h2>
          <select onChange={changeSystem} defaultValue={"null"}>
            {Object.keys(systems).map((id) => (
              <option key={id} value={id}>
                {systems[id]}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
};

Filters.propTypes = {
  difficulty: PropTypes.number.isRequired,
  changeDifficulty: PropTypes.func.isRequired,
  changeSystem: PropTypes.func.isRequired,
};

export default Filters;
