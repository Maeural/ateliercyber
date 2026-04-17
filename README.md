# Guide d'Installation et de Lancement

Ce guide vous explique comment installer l'extension sur votre navigateur et comment configurer le modèle d'intelligence artificielle locale avec Ollama.

---

## 1. Installation de l'Extension

L'extension s'installe directement depuis le dossier source sur n'importe quel navigateur basé sur Chromium (Google Chrome, Microsoft Edge, Brave, etc.).

1. Ouvrez votre navigateur et accédez à la page de gestion des extensions :
   - **Chrome** : Tapez `chrome://extensions/` dans la barre d'adresse.
   - **Edge** : Tapez `edge://extensions/`.
   - **Brave** : Tapez `brave://extensions/`.
   - De manière générale : `nomdunavigateur://extensions/`.
2. Activez le **Mode développeur** (généralement un interrupteur situé en haut à droite de la page).
3. Cliquez sur le bouton **Charger l'extension non empaquetée** (ou *Load unpacked*).
4. Naviguez dans vos fichiers et **sélectionnez le dossier `Extension`** de ce projet.
5. L'extension est maintenant ajoutée à votre navigateur et prête à fonctionner !

---

## 2. Configuration d'Ollama (IA Locale)

L'extension s'appuie sur un modèle de langage local pour analyser le contenu. Le fichier du modèle (`.gguf`) étant trop lourd pour être stocké sur le dépôt de code (ex: GitHub), il doit être téléchargé via Google Drive.

### Étape A : Installer Ollama
Si ce n'est pas déjà fait, téléchargez et installez Ollama sur votre machine :
**[Télécharger Ollama](https://ollama.com/download)**

### Étape B : Télécharger le modèle d'IA
1. Téléchargez l'un des modèles (`.gguf`) depuis ces liens Google Drive :

   **Lien du modèle générale : https://drive.google.com/file/d/1GKjblHFmy37x1B3fNKqXnigLUiSjAMWl/view?usp=drive_link**
   
   **Lien du modèle centré sur les autochtones mais moins performant au global : https://drive.google.com/file/d/1GQgw-3sMyHqnH-M3V7FiG2CXkHP9TCT-/view?usp=drive_link**
2. Une fois téléchargé, placez ce fichier `.gguf` directement dans le dossier `model` de ce projet.
*(Assurez-vous que le nom du fichier `.gguf` correspond bien à celui renseigné à l'intérieur du fichier `Modelfile`)*.

### Étape C : Créer et lancer le modèle
1. Ouvrez un terminal (Invite de commandes ou PowerShell sur Windows, Terminal sur Mac/Linux).
2. Déplacez-vous dans le dossier `model` du projet :
   ```bash
   cd "chemin/vers/ateliercyber/model"
   ```
3. Créez le modèle personnalisé dans Ollama à partir du `Modelfile` :
   ```bash
   ollama create heartshield-model -f Modelfile
   ```
4. (Optionnel) Vous pouvez tester que le modèle fonctionne en le lançant en ligne de commande :
   ```bash
   ollama run heartshield-model
   ```

5. Lancez le serveur Ollama en autorisant l'extension à y accéder (CORS) avec la variable `OLLAMA_ORIGINS` :

   - **Sur Windows (Invite de commandes / cmd) :**
     ```cmd
     set OLLAMA_ORIGINS="*" && ollama serve
     ```
   - **Sur Windows (PowerShell) :**
     ```powershell
     $env:OLLAMA_ORIGINS="*"; ollama serve
     ```
   - **Sur Mac / Linux :**
     ```bash
     OLLAMA_ORIGINS="*" ollama serve
     ```
