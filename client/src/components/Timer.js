import React, { useEffect } from "react";
import PropTypes from "proptypes";

const Timer = ({ inProgress, duration, updateParent }) => {
  useEffect(() => {
    if (!inProgress || duration === 0) {
      return;
    }

    setTimeout(() => {
      updateParent();
    }, 1000);
  }, [inProgress, duration, updateParent]);

  return <p>{duration} s</p>;
};

Timer.propTypes = {
  inProgress: PropTypes.bool.isRequired,
  duration: PropTypes.number.isRequired,
  updateParent: PropTypes.func.isRequired
};

export default Timer;