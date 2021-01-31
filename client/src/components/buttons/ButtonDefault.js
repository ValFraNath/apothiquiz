import { PropTypes } from "prop-types";
import React from "react";

const Button = (props) => {
  return (
    <button className="btn" onClick={props.onClick}>
      {props.children}
    </button>
  );
};

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};

export default Button;
