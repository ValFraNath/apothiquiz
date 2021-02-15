import { PropTypes } from "prop-types";
import React from "react";

const FullScreenMessage = ({ id, children }) => {
  return (
    <section className="fullscreen-message" id={id}>
      <div>
        {children}
      </div>
    </section>
  );
};

FullScreenMessage.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.array.isRequired,
};

export default FullScreenMessage;
