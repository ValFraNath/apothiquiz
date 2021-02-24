import { PropTypes } from "prop-types";
import { React } from "react";

const PageError = ({ message }) => <div className="page-error">{message}</div>;

PageError.propTypes = {
  message: PropTypes.string.isRequired,
};

export default PageError;
