#!/usr/bin/env bash

find . -type f -name '*.js' -delete
find . -type f -name '*.js.map' -delete
find . -type f -name '*.d.ts' -delete
find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
find . -name 'dist' -type d -prune -exec rm -rf '{}' +
