# InstiFlow Parents

Expo (React Native) app for parents. Each school gets its **own compiled app**, with the school's name, logo and colour. There is no school code screen: the code is built into the app.

## Per-school build

Everything school specific is in `school.config.json`:

| Field | Meaning |
| --- | --- |
| `name` | App name and name shown on screens |
| `shortName` | Letters shown where the logo goes if no image is set |
| `schoolCode` | Institution code sent on sign in |
| `accent` | School colour (buttons, active tab, highlights) |
| `slug`, `bundleId` | Expo slug and iOS/Android identifier |

Also replace the images in `assets/images` with the school's logo (icon, splash, Android adaptive icon).

## Run

```
cp .env.example .env
npm install
npm start
```

## Screens wired to the backend

Sign in, Today, School bus, Attendance, Today in class (diary), Fees, Inbox and Profile. They use the parent API under `/api/parent/children/:studentId/...` and `/api/parent/dashboard`.

Not built yet: exam results and report card, timetable, leave note, notice detail, home screen widgets, live bus location (needs driver app GPS).

## Checks

```
npm run typecheck
npm run lint
npm test
```
