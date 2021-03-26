import { PropTypes } from "prop-types";
import React from "react";

import Plural from "Plural";

const RemainingTime = ({ currentDate, finalDate }) => {
  const diffDates = finalDate.getTime() - currentDate.getTime();

  if (diffDates <= 1000 * 60 * 60 * 24) {
    const resInHours = finalDate.getHours() - currentDate.getHours();
    return (
      <span className={resInHours <= 3 && "time-important"}>
        {resInHours >= 0 ? resInHours : 0} h
      </span>
    );
  }

  const resInDays = diffDates / (1000 * 60 * 60 * 24);
  return (
    <span>
      {resInDays} <Plural word="jour" count={resInDays} />
    </span>
  );
};

RemainingTime.propTypes = {
  currentDate: PropTypes.object.isRequired,
  finalDate: PropTypes.object.isRequired,
};

export default RemainingTime;
