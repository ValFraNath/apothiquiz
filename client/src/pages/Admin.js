import axios from "axios";
import PropTypes from "prop-types";
import React, { Component } from "react";

import AuthService from "../services/auth.service";

const CSV_MIME = ["text/csv", "application/vnd.ms-excel"];
const ZIP_MIME = ["application/zip", "application/x-zip-compressed"];

class FileImporter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      errors: [],
      warnings: [],
      selectedFile: null,
      canConfirm: false,
      imported: false,
    };
  }

  /**
   * Send the selected file
   * @param {Event} e The event
   */
  sendSelectedFile(e) {
    e.preventDefault();
    const file = this.state.selectedFile;
    const requestData = new FormData();

    requestData.append("file", file);
    if (this.state.canConfirm) {
      requestData.append("confirmed", "true");
    }

    axios
      .post(this.props.endpoint, requestData)
      .then((res) => {
        const warnings = res.data.warnings.map((w) => `[${w.code}] - ${w.message}`);
        this.setState({
          warnings,
          errors: [],
          canConfirm: !this.state.canConfirm,
          imported: res.data.imported,
        });
      })
      .catch((error) => {
        if (error.response?.status === 400) {
          const errors = error.response.data.errors.map((e) => `[${e.code}] - ${e.message}`);
          this.setState({
            errors,
            warnings: [],
            canConfirm: false,
            imported: error.response.data.imported,
          });
          return;
        }
        this.setState({ errors: ["Une erreur est survenue de notre coté."] });
      });
  }

  /**
   * Check if the file format is valid
   * @param {Event} e
   */
  handleFileChange(e) {
    let file = e.target.files[0] || null;
    const errors = [];

    if (!this.props.mimeTypes.includes(file.type)) {
      e.target.parentNode.reset();
      file = null;
      errors.push("Le format du fichier est invalide");
    }
    this.setState({ selectedFile: file, canConfirm: false, errors, imported: false });
  }

  /**
   * Display a list
   * @param {string[]} array The array to display
   * @param {string} className The class of the list element
   */
  displayList(array, className) {
    if (array.length === 0) {
      return;
    }
    return (
      <ul className={className}>
        {array.map((element) => (
          <li key={element}>{element}</li>
        ))}
      </ul>
    );
  }

  render() {
    return (
      <div className="file-importer">
        <form>
          <input id="molecules-file" onChange={this.handleFileChange.bind(this)} type="file" />
          <button
            type="submit"
            disabled={this.state.selectedFile === null}
            onClick={this.sendSelectedFile.bind(this)}
          >
            {this.state.canConfirm ? "Confirmer" : "Envoyer"}
          </button>
        </form>
        {this.state.imported && <p className="success">Le fichier à été importé avec succès</p>}
        {this.displayList(this.state.warnings, "warnings")}
        {this.displayList(this.state.errors, "errors")}
      </div>
    );
  }
}

FileImporter.propTypes = {
  endpoint: PropTypes.string.isRequired,
  mimeTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
};

/**
 * Component which, on click, fetch a file and opens it.
 */
const FileDownloader = ({ filename, endpoint, text }) => {
  /**
   * Fetch the file and open it
   * @param {MouseEvent} e
   */
  function fetchAndOpenFile(e) {
    const link = e.target;
    if (!link.href.endsWith("none")) {
      return;
    }
    e.preventDefault();

    getLastImportedFile(endpoint)
      .then((url) => {
        link.href = url;
        link.click();
        link.href = "none";
      })
      .catch((error) => console.error("Can't download the file", error));
  }

  return (
    <a href={"none"} download={filename} onClick={fetchAndOpenFile}>
      {text}
    </a>
  );
};

FileDownloader.propTypes = {
  filename: PropTypes.string.isRequired,
  endpoint: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

const Configuration = () => {
  function saveConfig(e) {
    e.preventDefault();
  }
  return (
    <form className="configuration" onSubmit={saveConfig}>
      <label>
        <input type="number" min="2" max="10" defaultValue="5" />
        Nombre de questions dans une manche
      </label>
      <label>
        <input type="number" min="2" max="10" defaultValue="5" />
        Nombre de manches dans un duel
      </label>
      <input type="submit" value="Enregistrer" />
    </form>
  );
};

const Admin = () => (
  <main id="administration">
    <h1>Espace Administration</h1>
    <details open>
      <summary>Importer des molécules</summary>
      <FileDownloader
        text="Télécharger le dernier fichier importé"
        filename="molecules.csv"
        endpoint="/api/v1/import/molecules"
      />
      <FileImporter endpoint="/api/v1/import/molecules" mimeTypes={CSV_MIME} />
    </details>
    <details>
      <summary>Importer des étudiants</summary>
      <FileDownloader
        text="Télécharger le dernier fichier importé"
        filename="etudiants.csv"
        endpoint="/api/v1/import/students"
      />
      <FileImporter endpoint="/api/v1/import/students" mimeTypes={CSV_MIME} />
    </details>
    <details>
      <summary>Configuration</summary>
      <Configuration />
    </details>
    <details>
      <summary>Importer des images</summary>
      <FileDownloader
        text="Télécharger le dernier fichier importé"
        filename="images.csv"
        endpoint="/api/v1/import/images"
      />
      <FileImporter endpoint="/api/v1/import/images" mimeTypes={ZIP_MIME} />
    </details>
  </main>
);

export default Admin;

/**
 * Fetch the last imported file, and return the url of the object
 * @param {string} endpoint The endpoint to request
 * @returns {string} The data url
 */
function getLastImportedFile(endpoint) {
  return new Promise((resolve, reject) => {
    axios
      .get(endpoint)
      .then((res) => {
        const { token } = AuthService.getCurrentUser();
        fetch(res.data.shortpath, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            if (res.status !== 200) {
              res.json().then((error) => reject(error));
              return;
            }
            res
              .blob()
              .then((data) => resolve(window.URL.createObjectURL(data)))
              .catch(reject);
          })
          .catch(reject);
      })
      .catch(reject);
  });
}
