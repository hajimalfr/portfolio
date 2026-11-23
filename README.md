# Portfolio V2 — Victor Valroff Chhun

Portfolio éditorial & architectural (1ère année **BUT Génie Civil – Construction Durable**, IUT de Nancy-Brabois), conçu en navigation par stations `100dvh` sur fond béton minéral (`#EFECE6` / `#E2DFD7` / `#121212` / Bleu Tsunami `#262CE8`).

## Structure du projet

```text
portfolio V2/
├── index.html              # Structure des 5 stations (ST.00 → ST.04) + Modale CV & A4
├── css/
│   └── style.css           # Palette béton, cotes 1px, altimètre, CAO, responsive & print A4
├── js/
│   ├── i18n.js             # Détection auto FR/EN + sélecteur manuel
│   ├── cad-window.js       # Fenêtre Manifeste façon Fusion 360 (zoom molette, pan, reset)
│   ├── tsunami-3d.js       # Vague Tsunami 3D interactive (détourage auto canvas + 360°)
│   └── main.js             # Navigation stations 100dvh, mire, rognage intelligent, CV
├── images/
│   ├── beton-fond.jpg      # Texture béton brut optimisée
│   ├── tsunami-logo.webp   # Logo Association Tsunami (source de la vague 3D)
│   ├── portrait-victor.jpg # (À ajouter depuis Photos iCloud)
│   ├── impression-3d.jpg   # (À ajouter depuis Photos iCloud)
│   ├── voyages.jpg         # (À ajouter depuis Photos iCloud)
│   └── breaking-tsunami.jpg# (À ajouter depuis Photos iCloud)
├── VALROFF_Victor_CV.pdf   # CV téléchargeable
├── _headers                # En-têtes sécurité & cache pour Cloudflare Pages
└── .nojekyll               # Compatibilité directe GitHub Pages
```

## Ajouter vos photos iCloud

Exportez vos photos dans le dossier `images/` avec ces noms (le recadrage orientation paysage/portrait et le point focal s'adaptent automatiquement) :
- `images/portrait-victor.jpg` (ST.00)
- `images/impression-3d.jpg` (ST.01)
- `images/voyages.jpg` (ST.02)
- `images/breaking-tsunami.jpg` (ST.03)

## Déploiement gratuit sans badge publicitaire

### Option 1 — Cloudflare Pages (recommandé)
1. Poussez ce dossier sur un dépôt GitHub (ex. `portfolio-v2`).
2. Sur [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Sélectionnez votre dépôt GitHub, laissez **Build command** vide et **Build output directory** sur `/` (racine).
4. Cliquez sur **Save and Deploy** : chaque `git push` met à jour le site automatiquement, gratuitement et sans aucun badge.

### Option 2 — GitHub Pages (alternative immédiate)
1. Dans votre dépôt GitHub → **Settings** → **Pages**.
2. **Source** : `Deploy from a branch`, branche `main`, dossier `/ (root)`.
3. Cliquez sur **Save** : le site sera en ligne sur `https://<votre-pseudo>.github.io/<nom-du-repo>/`.
