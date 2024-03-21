FROM node:16

#Set working directory
WORKDIR /opt/entity

#Copy package.json file
COPY ./package.json /opt/entity/package.json

#Install node packages
RUN npm install
RUN npm install -g nodemon@2.0.20

#Copy all files 
COPY . /opt/entity

#Expose the application port
EXPOSE 5001

#Start the application
# CMD ["npm", "run", "dev"]
CMD ["nodemon", "app.js"]
