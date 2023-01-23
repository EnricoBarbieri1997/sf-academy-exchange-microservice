#!/bin/bash

docker-entrypoint.sh "$@"

while [[ $# -gt 0 ]]; do
  case $1 in
    -o)
      outputfolder="$2"
      shift # past argument
      shift # past value
      ;;
		*)
			shift
			;;
  esac
done

$current="${PWD}"

mkdir "$outputfolder/src"
cd $outputfolder
# find ./ -maxdepth 1 -mindepth 1 -exec mv -t "$outputfolder/src" {} +
mv /build_files/package.json ./package.json
mv /build_files/tsconfig.json ./tsconfig.json

npm install typescript
npm install axios@1.2.2
npx tsc --build