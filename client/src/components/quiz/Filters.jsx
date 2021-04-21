import axios from "axios";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";

const Filters = ({ changeDifficulty, changeSystem }) => {
  const [systemsList, setSystemsList] = useState([]);
  useEffect(() => {
    async function createData() {
      const result = await axios.get(`/api/v1/chemicals/systems`);
      setSystemsList(result.data);
    }
    createData();
  }, []);

  const systems = systemsList.reduce(
    (acc, value) => {
      acc[value.sy_id] = value.sy_name;
      return acc;
    },
    { null: "Tout" }
  );

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
};

export default Filters;
