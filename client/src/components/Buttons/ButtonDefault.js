import React from "react";

const Button = (props) => {
  <button className="btn" onClick={props.onClick}>
    {props.children}
  </button>;
};

export default Button;
