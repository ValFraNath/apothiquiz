import { PropTypes } from "prop-types";
import { React } from "react";

const PageError = ({ message }) => (
  <div className="page-error">
    Erreur ! <span>{message}</span>
  </div>
);

PageError.propTypes = {
  message: PropTypes.string.isRequired,
};

export default PageError;
