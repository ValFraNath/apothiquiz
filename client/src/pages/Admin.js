import axios from "axios";
import React, { Component, createRef, useRef } from "react";

import AuthService from "../services/auth.service";

const FileImporter = () => {
  // const [file, updateFile] = useState();
  return (
    <div>
      <input type="file" />
      <button type="submit">Envoyer</button>
    </div>
  );
};

const FileDownloader = () => {
  const linkRef = useRef(null);

  /**
   * Fetch the file and open it
   * @param {MouseEvent} e
   */
  function fetchAndOpenFile(e) {
    const link = linkRef.current;
    if (!link.href.endsWith("none")) {
      return;
    }
    e.preventDefault();

    axios
      .get("/api/v1/import/molecules")
      .then((res) => {
        const { token } = AuthService.getCurrentUser();
        fetch(res.data.shortpath, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            if (res.status !== 200) {
              res.json().then((error) => console.error("Can't download the file", error));
              return;
            }
            res
              .blob()
              .then((data) => {
                const href = window.URL.createObjectURL(data);
                link.download = "molecule.csv";
                link.href = href;
                link.click();
                link.href = "none";
              })
              .catch(console.error);
          })
          .catch(console.error);
      })
      .catch(console.error);
  }
  return (
    <a ref={linkRef} href={"none"} onClick={fetchAndOpenFile}>
      Télécharcher le dernier fichier importé
    </a>
  );
};

export default class Admin extends Component {
  constructor() {
    super();
    this.link = createRef();
  }

  render() {
    return (
      <main id="administration">
        <h1>Espace Administration</h1>
        <FileImporter />
        <FileDownloader />
      </main>
    );
  }
}
