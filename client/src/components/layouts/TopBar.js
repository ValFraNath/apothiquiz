import React from "react";
import { Link } from "react-router-dom";
import { CaretLeftIcon } from "@modulz/radix-icons";

import OfflineBanner from "../system/OfflineBanner";

const TopBar = () => {
  return (
    <nav>
      <CaretLeftIcon />
      <h1>
        {" "}
        <Link to="/">Guacamole</Link>
      </h1>
      <OfflineBanner />
    </nav>
  );
};

export default TopBar;
