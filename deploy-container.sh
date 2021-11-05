#!/bin/bash

git pull

container_id=$(sudo docker ps -q --filter ancestor=jntua-api)
sudo docker stop "${container_id}"
sudo docker rm "${container_id}"

sudo docker build -t jntua-api .
sudo docker run -it -p 3001:3000 --restart unless-stopped --name=jnuta-api jntua-api