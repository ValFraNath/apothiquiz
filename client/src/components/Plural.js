import React from "react";

const Plural = ({ word, count, plural = null }) => {
  const pluralWord = plural ? plural : `${word}s`;
  return <>{count <= 1 ? word : pluralWord}</>;
};

export default Plural;
