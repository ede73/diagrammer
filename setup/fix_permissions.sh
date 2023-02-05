#!/bin/sh
# Make sure to run in main checkout directory
sudo chown -R :_www web
sudo chmod -R g+w web
cd web
sudo ln -s ../icons icons
