# PromptDock

PromptDock is a local, lightweight desktop tool designed for students and creators to build better AI prompts using modular "building blocks."

## Key Features
- **Global Hotkey:** Access your library instantly using `Cmd/Ctrl+Shift+P`.
- **Modular Blocks:** Assemble prompts like Legos (Role, Task, Context, etc.).
- **Fuzzy Search:** Find prompts and blocks fast, even with typos.
- **Import & Dissect:** Paste any prompt to break it down into reusable components. Or skip the dissection of the prompt if you dont need the blocks.
- **Local & Private:** Your data stays on your machine—no accounts or cloud sync required.

## Getting Started
There will be build download links soon (when the last bugs are fixed), for now try over developer mode.

### Prerequisites
- [Node.js](https://nodejs.org/) (latest LTS recommended)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
To start the application in development mode:
```bash
npm run electron:dev
```

### Building Locally
To create a production build and installer for your OS:
```bash
npm run electron:build
```
The installer will be generated in the `release` folder.

### Built for exploration and clarity. Happy prompting!
