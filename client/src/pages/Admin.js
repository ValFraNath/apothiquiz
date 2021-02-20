import axios from "axios";

import PropTypes from "prop-types";
import React, { Component } from "react";

import AuthService from "../services/auth.service";

class FileImporter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      errors: [],
      warnings: [],
      selectedFiles: null,
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
    const files = this.state.selectedFiles || [];
    const requestData = new FormData();

    files.forEach((file) => requestData.append("file", file));

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
        if (error.response?.status === 422) {
          const errors = error.response.data.errors.map((e) => `[${e.code}] - ${e.message}`);
          this.setState({
            errors,
            warnings: [],
            canConfirm: false,
            imported: error.response.data.imported,
          });
          return;
        }
        const message = error.response?.data?.message || "Erreur serveur";
        this.setState({ errors: [message], imported: false });
      });
  }

  /**
   * Check if the file format is valid
   * @param {Event} e
   */
  handleFileChange(e) {
    let files = [...e.target.files].slice(0, this.props.multiple ? undefined : 1);
    const errors = [];

    files.forEach((file) => {
      const ext = file.name.split(".").slice(-1)[0];
      if (!this.props.extensions.includes(ext)) {
        errors.push(
          `Mauvaise extension : "${file.name}" (uniquement ${this.props.extensions.join(", ")}) `
        );
      }
    });
    if (errors.length > 0) {
      files = null;
      e.target.parentNode.reset();
    }

    this.setState({
      selectedFiles: files,
      canConfirm: false,
      errors,
      warnings: [],
      imported: false,
    });
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
        <form onSubmit={this.sendSelectedFile.bind(this)}>
          <input
            id="molecules-file"
            required
            onChange={this.handleFileChange.bind(this)}
            type="file"
            multiple={this.props.multiple}
          />
          <input
            type="submit"
            disabled={this.state.selectedFiles === null}
            value={this.state.canConfirm ? "Confirmer" : "Tester"}
          />
        </form>
        {this.state.imported && <p className="success">Importation réalisée avec succès</p>}
        {this.displayList(this.state.warnings, "warnings")}
        {this.displayList(this.state.errors, "errors")}
      </div>
    );
  }
}

FileImporter.propTypes = {
  endpoint: PropTypes.string.isRequired,
  extensions: PropTypes.arrayOf(PropTypes.string).isRequired,
  multiple: PropTypes.bool.isRequired,
};

FileImporter.defaultProps = { multiple: false };

/**
 * Component which, on click, fetches a file and opens it.
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
    // TODO update config in the server
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
      <FileImporter endpoint="/api/v1/import/molecules" extensions={["csv"]} />
    </details>
    <details>
      <summary>Importer des étudiants</summary>
      <FileDownloader
        text="Télécharger le dernier fichier importé"
        filename="utilisateurs.csv"
        endpoint="/api/v1/import/users"
      />
      <FileImporter endpoint="/api/v1/import/users" extensions={["csv"]} />
    </details>
    <details>
      <summary>Configuration (WIP)</summary>
      <Configuration />
    </details>
    <details>
      <summary>Importer des images</summary>
      <FileDownloader
        text="Télécharger les dernières images importées"
        filename="images-molecules.csv"
        endpoint="/api/v1/import/images"
      />
      <FileImporter
        endpoint="/api/v1/import/images"
        multiple={true}
        extensions={["png", "jpeg", "jpg", "svg"]}
      />
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
