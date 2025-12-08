## Dockerfile
################################
## BUILD ENVIRONMENT ###########
################################

# Use the official Node.js Alpine image (adjust based on your project's requirements)
# You can find the appropriate image on Docker Hub: https://hub.docker.com/_/node
# In this example, we're using node:20-alpine3.20
# run in termilnal commande line "node --version to get the version of your app"
FROM node:24.7.0-alpine3.22 As build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package*.json package-lock.json ./


# Clean/Install dependencies using npm
RUN npm ci --loglevel verbose

run echo "about to copy files"
# Copy the project files into the working directory
COPY ./ ./
run echo "completed copying files"

# Build the React app for production
RUN npm run build  --loglevel verbose

################################
#### PRODUCTION ENVIRONMENT ####
################################

# Use the official NGINX image for production
FROM nginx:stable-alpine as production

# copy nginx configuration in side conf.d folder
COPY --from=build /app/nginx /etc/nginx/conf.d

# Copy the build output from the dist folder into the Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html


# Expose port 6060 to allow access to the app
EXPOSE 6060

# Run Nginx in the foreground
ENTRYPOINT ["nginx", "-g", "daemon off;"] 

