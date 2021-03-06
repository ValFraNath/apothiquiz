import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";

import Avatar from "../Avatar";

const UserBadge = ({ username }) => {
  const { data: user } = useQuery(["user", "me"]);

  return (
    <Link to="/profile" id={"userBadge"}>
      <Avatar size="32px" infos={user?.avatar} />
      <span>dpager</span>
    </Link>
  );
};

UserBadge.propTypes = {
  username: PropTypes.string.isRequired,
};

const OfflineBanner = () => {
  return <div id="offlineBanner">Online</div>;
};

const TopBar = ({ username }) => (
  <nav>
    {username ? <UserBadge username={username} /> : <span></span>}
    <h1>
      <Link to={username ? "/homepage" : "/"}>Guacamaire</Link>
    </h1>
    <OfflineBanner />
  </nav>
);

TopBar.propTypes = {
  username: PropTypes.string,
};

export default TopBar;
