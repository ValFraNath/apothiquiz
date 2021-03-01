import axios from "axios";
import React, { useState } from "react";
import GitInfo from "react-git-info/macro";
import { useQuery } from "react-query";

import Button from "../components/buttons/ButtonFullWidth";
import Loading from "../components/status/Loading";
import PageError from "../components/status/PageError";

const TestConnection = () => {
  function getServerInformations() {
    return new Promise((resolve, reject) => {
      axios
        .get(`/api/v1/status`)
        .then((res) => {
          resolve({
            serverStatus: res.data.status,
            currentServerAPIVersion: res.data.apiVersion,
          });
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  const [isEnabled, setIsEnabled] = useState(false);
  const { isLoading, data, isError } = useQuery("server-informations", getServerInformations, {
    enabled: isEnabled,
  });

  return (
    <div>
      <Button onClick={() => setIsEnabled(true)}>Tester la connexion au serveur</Button>

      {isLoading && <Loading />}

      {isError && (
        <PageError message="Pas de connexion. Veuillez vérifier votre connexion et que le serveur fonctionne" />
      )}

      {data && (
        <p>
          Statut du serveur : {data.serverStatus}
          <br />
          Version de l'API serveur : {data.currentServerAPIVersion}
        </p>
      )}
    </div>
  );
};

const About = () => {
  const gitInfo = GitInfo();
  const date = new Date();
  date.setTime(Date.parse(gitInfo.commit.date));

  return (
    <main id="informations">
      <p>
        Guacamole <i>(nom temporaire)</i> est une application d'apprentissage réflexe à destination
        des étudiants en pharmacie de l'Université de Franche-Comté.
      </p>
      <p>Elle est réalisée dans le cadre d'un projet tutoré de Licence 3 Informatique 2020-2021.</p>
      <p>
        <b>Application en développement actif</b>
      </p>
      <p>
        En cas de remarque ou de conseil sur cette application, vous pouvez{" "}
        <a href="mailto:nathanael.houn@edu.univ-fcomte.fr,francois.poguet@edu.univ-fcomte.fr,valentin.perignon@edu.univ-fcomte.fr">
          nous écrire par mail
        </a>
      </p>

      <TestConnection />

      <ol id="credits">
        <li>Réalisé par Nathanaël Houn, François Poguet et Valentin Perignon.</li>
        <li>Supervisé par Anne-Laure Clairet, Frédéric Dadeau, et Marc Pudlo.</li>
        <li>Graphismes par Roxane Herbstmeyer.</li>
        <li>
          Icônes par{" "}
          <a href="https://icons.modulz.app/" target="_blank" rel="noreferrer">
            Modulz
          </a>
          .
        </li>
      </ol>

      <table id="app-version">
        <tbody>
          <tr>
            <td>Date de version : </td>
            <td>
              {process.env.NODE_ENV === "production"
                ? date.toLocaleString().split("GMT")[0]
                : process.env.NODE_ENV}
            </td>
          </tr>
          <tr>
            <td>Hash de version : </td>
            <td>{gitInfo.commit.shortHash}</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
};

export default About;
