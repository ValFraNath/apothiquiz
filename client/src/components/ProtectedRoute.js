import PropTypes from "prop-types";
import React from "react";
import { Route, Redirect } from "react-router-dom";

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
  component: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
  path: PropTypes.string,
  exact: PropTypes.bool,
};

export default ProtectedRoute;
