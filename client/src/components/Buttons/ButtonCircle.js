import React from "react";

const ButtonCircle = (props) => {
  return (
    <button className="btn btn-circle" onClick={props.onClick}>
      {props.children}
    </button>
  );
};

export default ButtonCircle;
