import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import React from "react";
import { useQuery } from "react-query";

const User = () => {

  const { data: users, isLoading } = useQuery(["users", "all"]);

  if(isLoading)
    return <></>;

  console.log(users);

  const columns = [
    { field: 'id', headerName: 'ID', width: 200},
    { field: 'Login', headerName: 'Login', editable:true, flex:'1' },
    { field: 'Admin', headerName: 'Admin', type:'boolean', editable:true },
  ];

  const rows = [
    { id: 1, Login: 'ealbero2', Admin: false},
    { id: 2, Login: 'nhoun', Admin: false},
    { id: 3, Login: 'fpoguet', Admin: false },
    { id: 4, Login: 'vperigno', Admin: false },
    { id: 5, Login: 'fdadeau', Admin: true },
    { id: 6, Login: 'mpudlo', Admin: true },
  ];

  return (
    <div id="flex">
    <h1> GESTION DES UTILISATEURS </h1>
    <div id="grid">
      <DataGrid rows={rows} rowHeight={50} columns={columns} editType='dropdownedit' components={{
          Toolbar: GridToolbar,}}/>
    </div>
    <h2> AJOUTER UN UTILISATEUR </h2>
    <label>Login</label>
    <input type="text" id="login" placeholder="Login" required />
    <label>Admin</label>
    <input type="checkbox"></input>
    <button id="valider"> Valider </button>
    </div>
  );
};

export default User;
