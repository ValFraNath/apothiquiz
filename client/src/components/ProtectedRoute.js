import React from "react";
import { Redirect, Route } from "react-router-dom";

import AuthService from "../services/auth.service";

const ProtectedRoute = ({ component: Component, ...rest }) => {
  const isAuthenticated = AuthService.getCurrentUser() !== null;

  return (
    <Route
      {...rest}
      render={(props) => (isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />)}
    />
  );
};

export default ProtectedRoute;
