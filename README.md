# Unibee-admin-portal

This project is a single-page WEB application which is Front-end of UniBee billing admin management system.

## Prerequisites

- Nodejs 18+

## Getting started

Clone this repository and install the dependencies.

```shell
# Clone this repository
git clone https://github.com/UniBee-Billing/unibee-admin-portal

# Install dependencies
cd unibee-admin-portal
yarn
```

### Running the application

Define the following env variables in `.env` file.

```
VITE_API_URL=http://unibee.top/unib
VITE_STRIPE_PUBLIC_KEY=YOUR_STRIPE_PUBLIC_KEY
```

> .env.local for development, .env.production for production build

Now you can start dev server using the following command.

```shell
yarn dev
```

### Building the application

To build the application, run the following command:

```shell
yarn build
```

The build command will generate the static files in the `dist` folder of the project.

### Building with Docker

The admin portal also supports building the application using Docker, run the following command to build the docker image:

```shell
docker build -t <tag> .
```

# Development

Use `yarn add <package>` to add a new dependency, don't use `npm install <package>`.

## License

AGPLv3.
