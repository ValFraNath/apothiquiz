import { PropTypes } from "prop-types";
import React from "react";

const ButtonFullWidth = (props) => {
  return (
    <button className="btn btn-fw" onClick={props.onClick}>
      {props.children}
    </button>
  );
};

ButtonFullWidth.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};

export default ButtonFullWidth;
