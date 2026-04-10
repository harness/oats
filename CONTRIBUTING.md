# Development

This document describes the process for running this application on your local computer.

## Getting Started

You'll need Node.js vesion 16 to run this project. You can install Node.js [from here](https://nodejs.org/en/download/package-manager/).

You'll also need to [install pnpm](https://pnpm.io/installation).

Once you've installed Node.js and pnpm, open Terminal and run the following:

```
git clone git@github.com:harness/oats.git
cd oats
pnpm i
```

Now you can make your changes.

Once you are done with your changes, run `npx changeset` in your terminal and fill in
the required information.

Now commit your changes along with the files generated, after running the above command.

Now you are ready to open a Pull Request with your changes.
