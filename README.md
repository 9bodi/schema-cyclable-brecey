# 🚴 Schéma Cyclable Brécey - Application de consultation participative

Application web responsive pour recueillir les avis des élus et citoyens dans le cadre de l'élaboration du schéma directeur cyclable de Brécey (Manche).

## 📋 Fonctionnalités

- **5 étapes de questionnaire** guidé et intuitif
- **Cartographie interactive** avec Leaflet.js
- **3 types de marqueurs** : lieux importants (bleu), points noirs (rouge), opportunités (jaune)
- **Stockage local** des données (localStorage)
- **Interface admin** pour visualiser et exporter les contributions
- **Export** CSV, JSON et capture d'image

## 🚀 Déploiement rapide

### Option 1 : GitHub Pages (recommandé, gratuit)

1. Créez un compte GitHub si vous n'en avez pas : https://github.com/signup

2. Créez un nouveau repository :
   - Cliquez sur "New repository"
   - Nom : `schema-cyclable-brecey`
   - Cochez "Add a README file"
   - Cliquez "Create repository"

3. Uploadez les fichiers :
   - Cliquez "Add file" > "Upload files"
   - Glissez-déposez TOUS les fichiers du projet
   - Cliquez "Commit changes"

4. Activez GitHub Pages :
   - Allez dans "Settings" > "Pages"
   - Source : "Deploy from a branch"
   - Branch : "main" / "root"
   - Cliquez "Save"

5. Attendez 2-3 minutes, votre site sera disponible à :
   `https://VOTRE-USERNAME.github.io/schema-cyclable-brecey/`

### Option 2 : Netlify (très simple, gratuit)

1. Allez sur https://app.netlify.com/drop

2. Glissez-déposez le dossier complet du projet

3. C'est prêt ! Netlify vous donne une URL automatique

4. Optionnel : Changez l'URL dans Site settings > Domain management

### Option 3 : Vercel (gratuit)

1. Créez un compte sur https://vercel.com

2. Cliquez "New Project" > "Import" 

3. Uploadez le dossier ou connectez votre GitHub

4. Cliquez "Deploy"

## 📱 Générer le QR Code

1. Copiez l'URL de votre site déployé

2. Allez sur https://www.qr-code-generator.com/ (ou un autre générateur)

3. Collez l'URL et téléchargez le QR code

4. Imprimez-le pour l'afficher lors de l'atelier

## 🎯 Utilisation lors de l'atelier

### Avant l'atelier
- Testez l'application sur votre téléphone
- Imprimez le QR code en grand format (A4 minimum)
- Préparez un écran pour projeter la page admin

### Pendant l'atelier
1. Affichez le QR code pour que les participants le scannent
2. Guidez-les étape par étape si nécessaire
3. Surveillez les contributions sur la page admin (`/admin.html`)

### Après l'atelier
1. Allez sur la page admin
2. Exportez les données en CSV et JSON
3. Faites une capture de la carte
4. Analysez les résultats dans Excel ou un SIG

## 📊 Structure des données exportées

### CSV