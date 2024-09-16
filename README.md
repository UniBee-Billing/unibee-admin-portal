# Unibee-merchant-portal 
The most advanced open-source billing software designed specifically for SaaS businesses. UniBee offers a user-friendly and cost-effective alternative to closed-source, expensive, and complex solutions like Recurly, Chargebee, and Paddle.

This project is a single-page WEB application which is Front-end of UniBee billing admin management system.

## Prerequisites 
- Nodejs 18+

## Getting started 
Clone this repository and install the dependencies. 

```shell
# Clone this repository
git clone https://github.com/UniBee-Billing/unibee-merchant-portal

# Install dependencies
cd unibee-merchant-portal
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
The merchant portal also supports building the application using Docker, run the following command to build the docker image:

```shell
docker build -t <tag> .
```

## License
AGPL v3.0.
