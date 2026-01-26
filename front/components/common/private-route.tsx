import React from "react";
import { Navigate } from "react-router";
import useStorage from "context";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    setting: { isLoged },
  } = useStorage();
  if (isLoged) return children;
  else return <Navigate to={{ pathname: "/auth/login" }} />;
};

export default PrivateRoute;
