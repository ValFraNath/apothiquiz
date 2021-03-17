import { ArrowDownIcon, ArrowUpIcon } from "@modulz/radix-icons";
import axios from "axios";
import PropTypes from "prop-types";
import React, { Component, useEffect, useState } from "react";

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
      isLoading: false,
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
    this.setState({ isLoading: true });
    axios
      .post(this.props.endpoint, requestData)
      .then(({ data: { imported, warnings: receivedWarnings } }) => {
        const warnings = receivedWarnings.map((w) => `[${w.code}] - ${w.message}`);

        this.setState({
          warnings,
          errors: [],
          canConfirm: !this.state.canConfirm,
          imported,
          isLoading: false,
        });

        if (imported && this.props.onImport) {
          this.props.onImport();
        }
      })
      .catch((error) => {
        if (error.response?.status === 422) {
          const errors = error.response.data.errors.map((e) => `[${e.code}] - ${e.message}`);
          this.setState({
            errors,
            warnings: [],
            canConfirm: false,
            imported: error.response.data.imported,
            isLoading: false,
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
    const { canConfirm, errors, warnings, imported, isLoading, selectedFiles } = this.state;
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
            disabled={selectedFiles === null || isLoading}
            value={isLoading ? "Chargement" : canConfirm ? "Confirmer" : "Tester"}
          />
        </form>
        {imported && <p className="success">Importation réalisée avec succès</p>}
        {canConfirm && warnings.length === 0 && <p className="success">Aucun problème détecté</p>}
        {this.displayList(warnings, "warnings")}
        {this.displayList(errors, "errors")}
      </div>
    );
  }
}

FileImporter.propTypes = {
  endpoint: PropTypes.string.isRequired,
  extensions: PropTypes.arrayOf(PropTypes.string).isRequired,
  multiple: PropTypes.bool.isRequired,
  onImport: PropTypes.func,
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

const Configuration = ({ lastImport }) => {
  const [config, setConfig] = useState({
    roundsPerDuel: 0,
    questionsPerRound: 0,
    questionTimerDuration: 0,
    duelLifetime: 0,
  });

  const [isSaved, setIsSaved] = useState(false);

  const updateConfig = (key, value) => {
    setConfig((oldConfig) => ({
      ...oldConfig,
      [key]: { ...oldConfig[key], ...{ value } },
    }));
  };

  useEffect(() => {
    axios
      .get("/api/v1/config")
      .then(({ data }) => {
        setConfig(data);
        setIsSaved(false);
      })
      .catch(console.error);
  }, [lastImport]);

  function saveConfig(e) {
    e.preventDefault();
    const body = Object.keys(config).reduce((body, key) => {
      body[key] = config[key].value;
      return body;
    }, Object.create(null));

    axios
      .patch("/api/v1/config/", body)
      .then(({ data }) => {
        setConfig(data);
        setIsSaved(true);
      })
      .catch(console.error);
  }

  return (
    <form className="configuration" onSubmit={saveConfig}>
      {config.roundsPerDuel.max < 1 ? (
        <p className="notEnoughData">
          Il n'y a pas assez de données dans la base de données pour générer des duels
        </p>
      ) : (
        <>
          <NumberInput
            label="Durée du timer de réponse en secondes"
            defaultValue={config.questionTimerDuration.value}
            onChange={(value) => updateConfig("questionTimerDuration", value)}
            min={config.questionTimerDuration.min}
            max={config.questionTimerDuration.max}
          />

          <NumberInput
            label="Nombre de questions dans une manche"
            defaultValue={config.questionsPerRound.value}
            onChange={(value) => updateConfig("questionsPerRound", value)}
            min={config.questionsPerRound.min}
            max={config.questionsPerRound.max}
          />

          <NumberInput
            label="Nombre de manches dans un duel"
            defaultValue={config.roundsPerDuel.value}
            onChange={(value) => updateConfig("roundsPerDuel", value)}
            min={config.roundsPerDuel.min}
            max={config.roundsPerDuel.max}
          />

          <NumberInput
            label="Nombre de jours de sauvegarde d'un duel terminé avant suppression"
            defaultValue={config.duelLifetime.value}
            onChange={(value) => updateConfig("duelLifetime", value)}
            min={config.duelLifetime.min}
            max={config.duelLifetime.max}
          />
          <input type="submit" value="Enregistrer" className="btn" />
        </>
      )}
      {isSaved && <p className="success">Configuration sauvegardée avec succès</p>}
    </form>
  );
};

Configuration.propTypes = {
  lastImport: PropTypes.number.isRequired,
};

const NumberInput = ({ defaultValue, label, onChange, min, max }) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function handleChange(newValue) {
    if (newValue <= max && newValue >= min) {
      onChange(newValue);
    }
  }

  return (
    <div className="number-input">
      <ArrowUpIcon
        onClick={() => handleChange(value + 1)}
        color={value >= max ? "grey" : "black"}
      />
      <span>{value}</span>
      <ArrowDownIcon
        onClick={() => handleChange(value - 1)}
        color={value <= min ? "grey" : "black"}
      />
      <label>{label}</label>
    </div>
  );
};

NumberInput.propTypes = {
  defaultValue: PropTypes.number,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  max: PropTypes.number,
  min: PropTypes.number,
};

const Admin = () => {
  // used to update the configuration component after a new import
  const [lastImport, setLastImport] = useState(Date.now());

  return (
    <main id="administration">
      <h1>Espace Administration</h1>
      <a id="adminGuide" href="/api/v1/resources/admin_guide.pdf">
        Guide de l'administrateur
      </a>
      <details open>
        <summary>Importer des molécules</summary>
        <FileDownloader
          text="Télécharger les dernières molécules importées"
          filename="molecules.csv"
          endpoint="/api/v1/import/molecules"
        />
        <FileImporter
          endpoint="/api/v1/import/molecules"
          extensions={["csv"]}
          onImport={() => setLastImport(Date.now())}
        />
      </details>
      <details>
        <summary>Importer des utilisateurs</summary>
        <FileDownloader
          text="Télécharger les derniers utilisateurs importés"
          filename="utilisateurs.csv"
          endpoint="/api/v1/import/users"
        />
        <FileImporter endpoint="/api/v1/import/users" extensions={["csv"]} />
      </details>
      <details>
        <summary>Importer des images</summary>
        <FileDownloader
          text="Télécharger les dernières images importées"
          filename="images-molecules.zip"
          endpoint="/api/v1/import/images"
        />
        <FileImporter
          endpoint="/api/v1/import/images"
          multiple={true}
          extensions={["png", "jpeg", "jpg", "svg"]}
          onImport={() => setLastImport(Date.now())}
        />
      </details>
      <details>
        <summary>Configuration</summary>
        <Configuration lastImport={lastImport} />
      </details>
    </main>
  );
};

export default Admin;

/**
 * Fetch the last imported file, and return the url of the object
 * @param {string} endpoint The endpoint to request
 * @returns {string} The data url
 */
async function getLastImportedFile(endpoint) {
  let {
    data: { shortpath },
  } = await axios.get(endpoint);

  const { accessToken } = AuthService.getCurrentUser() || {};

  const res = await fetch(shortpath, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status !== 200) {
    throw await res.json();
  }

  const data = await res.blob();
  return window.URL.createObjectURL(data);
}
