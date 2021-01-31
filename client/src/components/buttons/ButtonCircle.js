import { PropTypes } from "prop-types";
import React from "react";

const ButtonCircle = (props) => {
  return (
    <button className="btn btn-circle" onClick={props.onClick}>
      {props.children}
    </button>
  );
};

ButtonCircle.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};

export default ButtonCircle;
