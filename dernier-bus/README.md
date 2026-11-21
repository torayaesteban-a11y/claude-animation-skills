# Le dernier bus de 03 h 00

Depuis la branche `video-export`, lancer `bash dernier-bus/generate.sh` à la racine du dépôt. Le script utilise Python 3 avec venv, Node.js 20 ou ultérieur, Chromium dans `/usr/bin/chromium` et FFmpeg avec libass. La première installation télécharge les dépendances et le modèle vocal. Piper synthétise ensuite la narration en local.

Modifier `script.json` pour changer la narration. Les repères du storyboard servent à situer les mouvements de caméra et les bruitages. À chaque génération, les durées des phrases synthétisées par Piper définissent les nouvelles limites des scènes dans les 45 secondes. Le minutage des mots est estimé à l’intérieur de chaque phrase à partir de sa durée réelle.

Le dossier `sortie/` contient le MP4 sous-titré avec les bruitages, la voix seule en MP3 et les sous-titres en SRT. Le rendu Three.js mesure 720 × 1280. FFmpeg le redimensionne à 1080 × 1920 et incruste le texte à cette résolution.

La narration utilise la voix française SIWIS de Piper. Le jeu de données SIWIS French Speech Synthesis Database est distribué sous licence CC BY 4.0. [Fiche du modèle](https://huggingface.co/rhasspy/piper-voices/blob/main/fr/fr_FR/siwis/medium/MODEL_CARD) · [Jeu de données](https://datashare.is.ed.ac.uk/handle/10283/2353)
