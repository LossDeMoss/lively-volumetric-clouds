# Cloud Shader for Lively Wallpaper

This project is a real‑time volumetric cloud shader adapted for use as a live wallpaper.  
It is based on Inigo Quilez’s original cloud rendering technique and has been ported to WebGL2 with a 3D noise texture for better performance.  
All parameters are controllable via **Lively Properties**, allowing you to tweak the visuals in real time.

![mktb0ye5 afv](https://github.com/user-attachments/assets/2fde63b6-d5f7-4c77-82c4-e9c43f329825)

---

## Features

### 🌥️ Cloud Types
Select between four distinct cloud styles:
- **Cumulus** – puffy, dense cumulus clouds.
- **Cirrus** – wispy, high‑altitude fibrous clouds.
- **Stratus** – layered, blanket‑like clouds.
- **Cellular** – honeycomb convective cells.

### ☀️ Lighting Presets
Five lighting moods that affect sun direction, colour, and background:
- **Day** – bright, warm sunlight.
- **Sunrise** – soft orange/pink tones.
- **Sunset** – deeper red/orange hues.
- **Evening** – dim light with glowing **city lights** on the ground.
- **Night** – dark blue sky with **twinkling stars**.

### 🎮 Interactive Controls
All the following can be adjusted through the Lively Properties panel:

| Property           | Description                                  | Range            |
|--------------------|----------------------------------------------|------------------|
| `noiseScale`       | Scale of the 3D noise texture                | 0.01 – 0.5       |
| `fov`              | Field of view (affects perspective)          | 0.5 – 3.0        |
| `cloudSpeed`       | Speed of cloud movement                      | 0.0 – 2.0        |
| `cloudType`        | Cloud style (0–3)                            | 0,1,2,3          |
| `lightPreset`      | Lighting preset (0–4)                        | 0,1,2,3,4        |
| `cameraAzimuth`    | Horizontal rotation around the scene (deg)   | 0 – 360          |
| `cameraElevation`  | Vertical angle (deg)                         | –30 – 60         |
| `cameraDistance`   | Distance from the target                     | 2.0 – 20.0       |

### 🚀 Performance Optimizations
- **3D noise texture** (64³) pre‑generated in JavaScript → faster than compute noise.
- **Two‑pass raymarching** – high‑resolution for close clouds, medium‑resolution for distant ones.
- Adaptive step size based on distance.
- Early exit when cloud density or background occlusion saturates.

---

## Credits

**Original concept & shader code:**  
[Inigo Quilez](https://iquilezles.org/) – his work on volumetric clouds and signed distance functions is the foundation of this project.

**Adaptations for Lively Wallpaper:**  
- Port to WebGL2 + 3D texture noise.
- Integration of Lively Properties for real‑time control.
- Additional cloud types, lighting presets, city lights, and stars.
- Optimised raymarching loops.

This version is shared for **educational purposes** under the same respectful terms as the original.  
If you enjoy it, consider visiting Inigo’s website – it’s a treasure trove of computer graphics knowledge.

---

## How to Use
1. Place all files (`index.html`, `script.js`, `shader.frag`, `LivelyProperties.json`) in a folder.
2. In Lively Wallpaper, select “Add wallpaper” → “Browse” and pick `index.html`.
3. Adjust the sliders in the wallpaper settings panel to customise your view.

Enjoy the skies! ☁️
