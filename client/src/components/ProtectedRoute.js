import React from "react";
import { Route, Redirect } from "react-router-dom";
import PropTypes from "prop-types";

import AuthService from "../services/auth.service";

const ProtectedRoute = ({ component, ...rest }) => {
  const isAuthenticated = AuthService.getCurrentUser() !== null;

  return isAuthenticated ? (
    <Route component={component} {...rest} />
  ) : (
    <Redirect to={{ pathname: "/login" }} />
  );
};

ProtectedRoute.propTypes = {
  path: PropTypes.string,
  exact: PropTypes.bool,
};

export default ProtectedRoute;
