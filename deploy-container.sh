#!/bin/bash

git pull

sudo docker stop $(sudo docker ps -q --filter ancestor=jntua-api)
sudo docker rm $(sudo docker ps -q --filter ancestor=jntua-api)

sudo docker build -t jntua-api .
sudo docker run -it -p 3001:3000 --restart unless-stopped --name=jnuta-api jntua-api