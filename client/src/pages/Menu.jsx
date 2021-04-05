import { PropTypes } from "prop-types";
import React from "react";
import { Link, Redirect } from "react-router-dom";

import InstallApp from "../components/system/InstallApp";
import variables from "../styles/base/_variables.module.scss";
import Auth from "../utils/authentication";

const Menu = ({ installPromptEvent, user }) => {
  if (Auth.getCurrentUser() !== null) {
    return <Redirect to="/homepage" />;
  }

  return (
    <main
      id="menu"
      style={{ height: window.innerHeight - Number.parseInt(variables.topBarHeight) }}
    >
      <section>
        <Link to="/train" className="btn btn-fw">
          Entraînement libre
        </Link>
        {user === null && (
          <Link to="/login" className="btn btn-fw">
            Se connecter
          </Link>
        )}
        <Link to="/about" className="btn btn-fw">
          À propos
        </Link>
      </section>
      {installPromptEvent !== null && <InstallApp installPromptEvent={installPromptEvent} />}
    </main>
  );
};

Menu.propTypes = {
  installPromptEvent: PropTypes.func,
  user: PropTypes.string,
};

export default Menu;
