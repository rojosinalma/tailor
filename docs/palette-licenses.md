# Palette licences

Skins are **translations**: each `skin.css` re-expresses a design system's look in `--t-*` tokens
and vendors no upstream CSS; its `manifest.json` cites the package, version and licence it was
modelled on. Palettes reuse **colour values** only; every generated `palettes/<id>.css` names its
source and licence in the header, as does the `license` field of `palettes/src/<id>.json`.

| Licence | Palettes |
|---|---|
| MIT | ayu, catppuccin, dracula, everforest, flexoki, kanagawa, nightfox, nightowl, nord, onedark, oxocarbon, poimandres, rosepine, selenized, solarized, synthwave84, vitesse |
| Apache-2.0 | tokyonight |
| values-only | gruvbox (no licence file upstream), zenburn (GPL header, no licence file), modusvivendi (GPL-3.0-or-later) |

"Values-only" means the upstream project's code, files and assets are not included; only the
colour values appear, with attribution. If you are an upstream author and disagree with that
reading, open an issue and I will remove the palette.

The code in this repository is MIT — see [LICENSE](../LICENSE).
