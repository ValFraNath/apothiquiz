import React from "react";
import AuthService from "../services/auth.service";

function handleLogoutClick() {
  AuthService.logout();
  document.location.replace("/");
}

const UserBadge = (pseudo) => {
  return (
    <div id={"userBadge"}>
      {pseudo}
      <button onClick={handleLogoutClick}>Logout</button>
    </div>
  );
};

export default UserBadge;
