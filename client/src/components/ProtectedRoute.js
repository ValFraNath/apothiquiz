import React from "react";
import { Redirect } from "react-router-dom";

import AuthService from "../services/auth.service";

class ProtectedRoute extends React.Component {
  render() {
    const Component = this.props.component;
    const isAuthenticated = AuthService.getCurrentUser() !== null;

    return isAuthenticated ? <Component /> : <Redirect to={{ pathname: "/login" }} />;
  }
}

export default ProtectedRoute;
