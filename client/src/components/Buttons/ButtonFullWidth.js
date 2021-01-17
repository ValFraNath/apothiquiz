import React from "react";

const ButtonFullWidth = (props) => {
  return (
    <button className="btn btn-fw" onClick={props.onClick}>
      {props.children}
    </button>
  );
};

export default ButtonFullWidth;
