# Component Tutorial Starter

This repo is the **starter project** for a YouTube tutorial that builds a UI component using:

- **HTML** (`index.html`)
- **Tailwind CSS v4**
- **Vanilla JavaScript** (`main.js`)

You don’t need to change any setup files yourself – just follow these steps and then code along with the video.

---

## 1. Install dependencies

From this folder in your terminal:

```bash
npm install
```

---

## 2. Start the dev server (auto-refresh)

```bash
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173/`).

When you save changes to `index.html`, `main.js`, or `tailwind.css`, the page will refresh automatically.

---

## 3. Build static files for deployment

```bash
npm run build
```

This produces a `dist/` folder containing plain static files (an `index.html` plus JS/CSS assets).

- If you want to upload the project to a server, upload the **contents of `dist/`**.
- If your host supports it, you can test locally with:

```bash
npm run preview
```

---

## Tutorials

Follow the tutorials on YouTube:

- [lab01.design on YouTube](https://www.youtube.com/@lab01.design)