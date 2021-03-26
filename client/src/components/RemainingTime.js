import { PropTypes } from "prop-types";
import React from "react";

import Plural from "./Plural";

const RemainingTime = ({ finalDate, currentDate = new Date() }) => {
  const diffDates = finalDate.getTime() - currentDate.getTime();

  if (diffDates <= 1000 * 60 * 60 * 24) {
    const resInHours = diffDates / (1000 * 60 * 60);
    return (
      <span className={resInHours <= 3 ? "time-important" : ""}>
        {resInHours >= 0 ? Math.round(resInHours) : 0} h
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
  finalDate: PropTypes.object.isRequired,
  currentDate: PropTypes.object,
};

export default RemainingTime;
