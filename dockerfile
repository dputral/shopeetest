FROM node:8

# Create app directory
WORKDIR /usr/app/

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json /usr/app/

RUN npm install

# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

COPY wait-for-it.sh /
CMD /wait-for-it.sh db:3306 -- npm run docker

EXPOSE 8084
CMD node index.js
