# Le dernier bus de 03 h 00

Depuis la branche `video-export`, lancer `bash dernier-bus/generate.sh` à la racine du dépôt. Le script utilise Python 3 avec venv, Node.js 20 ou ultérieur, Chromium dans `/usr/bin/chromium` et FFmpeg avec libass. L’installation des dépendances et la synthèse vocale nécessitent une connexion Internet.

Modifier `script.json` pour changer la narration. Les repères du storyboard servent à situer les mouvements de caméra et les bruitages. À chaque génération, les durées prononcées par Rémy définissent les nouvelles limites des scènes dans les 45 secondes. Les repères de mots fournis par edge-tts pilotent les sous-titres.

Le dossier `sortie/` contient le MP4 sous-titré avec les bruitages, la voix seule en MP3 et les sous-titres en SRT. Le rendu Three.js mesure 720 × 1280. FFmpeg le redimensionne à 1080 × 1920 et incruste le texte à cette résolution.
