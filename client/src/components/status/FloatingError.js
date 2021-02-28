import { PropTypes } from "prop-types";
import { React } from "react";

const FloatingError = ({ message }) => <div className="floating-error">{message}</div>;

FloatingError.propTypes = {
  message: PropTypes.string.isRequired,
};

export default FloatingError;
