#!/usr/bin/env bash


yarn global add verdaccio
verdaccio &
npm adduser --registry http://localhost:4873

# Input
# Username: test
# Password: test
# Email: thanhlq@gmail.com
