# Charbel Abdallah Author Website - Local Setup

This is your author website code. Follow these steps to run it locally on your computer.

## Prerequisites

You need to install these first:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version

2. **VS Code** (recommended code editor)
   - Download from: https://code.visualstudio.com/

3. **pnpm** (package manager)
   - After installing Node.js, open a terminal and run:
   ```bash
   npm install -g pnpm
   ```

## Setup Steps

1. **Extract the zip file** to a folder on your computer

2. **Open the folder in VS Code**
   - Open VS Code
   - Go to File → Open Folder
   - Select the `charbel-abdallah-website` folder

3. **Install dependencies**
   - Open the terminal in VS Code (Terminal → New Terminal)
   - Run this command:
   ```bash
   pnpm install
   ```
   - Wait for it to finish (may take a few minutes)

4. **Start the development server**
   - In the terminal, run:
   ```bash
   pnpm dev
   ```
   - Wait until you see "Server running on http://localhost:3000/"

5. **Open in Chrome**
   - Open Chrome browser
   - Go to: http://localhost:3000
   - Your website should load!

## Making Changes

- **Pages** are in: `client/src/pages/`
  - `Home.tsx` - Home page
  - `Books.tsx` - Books page
  - `About.tsx` - About page
  - `Contact.tsx` - Contact page

- **Styling** is in: `client/src/index.css`
  - Colors, fonts, and global styles

- **Components** are in: `client/src/components/`
  - `Navigation.tsx` - Header menu
  - `Footer.tsx` - Footer section

## Tips

- The website auto-refreshes when you save changes
- If something breaks, stop the server (Ctrl+C) and run `pnpm dev` again
- Keep the terminal open while working - it shows errors if something goes wrong

## Common Issues

**Port 3000 already in use?**
- Close any other programs using port 3000
- Or change the port in `vite.config.ts`

**Changes not showing?**
- Hard refresh in Chrome: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

**Errors in terminal?**
- Read the error message carefully
- Most errors show the file and line number where the problem is

## Need Help?

- VS Code has built-in error checking - red squiggly lines show problems
- Hover over errors to see what's wrong
- The terminal shows detailed error messages when things break

Enjoy customizing your website!
