import PropTypes from "prop-types";
import React from "react";
import { Route, Redirect } from "react-router-dom";

import AuthService from "../services/auth.service";

const ProtectedRoute = ({ component, onlyAdmin, ...rest }) => {
  const currentUser = AuthService.getCurrentUser();
  const isAuthenticated = currentUser !== null;
  const isAdmin = isAuthenticated && currentUser.admin;

  if (!isAuthenticated) {
    return <Redirect to={{ pathname: "/login" }} />;
  }

  if (onlyAdmin && !isAdmin) {
    return <Redirect to={{ pathname: "/homepage" }} />;
  }

  return <Route component={component} {...rest} />;
};

ProtectedRoute.propTypes = {
  component: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
  path: PropTypes.string,
  exact: PropTypes.bool,
  onlyAdmin: PropTypes.bool,
};

export default ProtectedRoute;
