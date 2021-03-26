import { PropTypes } from "prop-types";
import React from "react";

const Plural = ({ word, count, plural = null }) => {
  const pluralWord = plural ? plural : `${word}s`;
  return <>{count <= 1 ? word : pluralWord}</>;
};

Plural.propTypes = {
  word: PropTypes.string.isRequired,
  count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  plural: PropTypes.string,
};

export default Plural;
