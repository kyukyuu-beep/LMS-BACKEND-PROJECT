# LMS Backend (Student Portal)

Node.js + Express + SQLite backend for the UniLearn Student Portal. It serves the front end from the `public` folder and provides the API the page uses (login, register, courses, schedule, assessments, analytics).

## Requirements

- **Node.js 22.5 or newer** (download the LTS version from https://nodejs.org). SQLite is built into Node, so there is no database to install.

## Run it

1. Open a terminal in the project folder.
2. Install the dependencies (first time only):

   ```
   npm install
   ```

3. Start the server:

   ```
   npm start
   ```

4. Open **http://localhost:3000** in the browser.

Stop the server with `Ctrl + C`.

The first run creates the database file `school.db` and two sample students.

## Demo accounts

| Username | Password |
|---|---|
| `mark` | `password123` |
| `juan` | `password123` |

You can also create a new account with **"No account yet? Create one"** on the login screen. New accounts start empty (add courses and assessments from the dashboard).

## What you can do in the app

- Log in, log out, register
- Courses: add, edit progress and score, delete
- Assessments: add
- Analytics: GPA stats and Course Performance (letter grade is computed from each course's score)
- Every student only sees their own data

## Project structure

```
server.js        Express server, database tables and all API routes
package.json     Dependencies and the "npm start" script
public/
  index.html     The whole front end (HTML, CSS and JavaScript)
school.db        SQLite database (created automatically, not committed)
.env.example     Example settings (copy to .env if you need to change them)
```

## Settings (optional)

Copy `.env.example` to `.env` and edit it. Nothing is required for local use.

| Setting | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `NODE_ENV` | (none) | Set to `production` when hosting online (turns on secure cookies) |
| `SEED_DEMO` | `true` | Set to `false` to skip creating the demo accounts |
| `DB_PATH` | `./school.db` | Where the database file is stored |

## API

The full list of endpoints, with request and response examples, is in the **LMS Backend API Documentation** document shared by the backend developer.

## Reset the data

Stop the server, delete `school.db`, then run `npm start` again. The sample students are created again.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module 'node:sqlite'` | Node is too old. Install Node 22.5 or newer. |
| `Cannot find module 'express'` | Run `npm install` first. |
| `EADDRINUSE` (port already in use) | Another server is running. Close it, or set another `PORT` in `.env`. |
| Login page does not show, or you are logged in already | Click the logout button, or open the page in a private window. |
| "Too many failed attempts" | Wait 15 minutes. Five wrong passwords in a row lock that username for 15 minutes. |
| PowerShell says "running scripts is disabled" | Use Command Prompt, or run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. |

## Not included

- Instructor and Admin dashboards
- Forgot password, file uploads
