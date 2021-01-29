import React from "react";
import { Route, Redirect } from "react-router-dom";
import PropTypes from "prop-types";

import AuthService from "../services/auth.service";

const ProtectedRoute = (props) => {
  const { path, exact, component } = props;
  const isAuthenticated = AuthService.getCurrentUser() !== null;

  return isAuthenticated ? (
    <Route path={path} exact={exact} component={component} />
  ) : (
    <Redirect to={{ pathname: "/login" }} />
  );
}

ProtectedRoute.propTypes = {
  path: PropTypes.string.isRequired,
  exact: PropTypes.bool,
};

export default ProtectedRoute;
