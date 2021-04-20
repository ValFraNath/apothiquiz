import PropTypes from "prop-types";
import React from "react";

const Filters = ({ changeDifficulty, changeSystem, systems }) => {
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

      <h2>Sélection des systèmes : </h2>
      <select onChange={changeSystem}>
        {Object.keys(systems).map((id) => (
          <option key={id} value={id}>
            {systems[id]}
          </option>
        ))}
        ;
      </select>
    </div>
  );
};

Filters.propTypes = {
  changeDifficulty: PropTypes.func.isRequired,
  changeSystem: PropTypes.func.isRequired,
  systems: PropTypes.object.isRequired,
};

export default Filters;
