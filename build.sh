#!/usr/bin/env bash
PACKAGES=(
  'core'
  'cli'
  'plugin-restful-react'
)
MODULE=$1

function buildPackage() {
  local package=$1
  pushd "packages/oa2ts-${package}" || exit 1 > /dev/null
  echo "Building ${package}..."
  yarn build
  echo ""
  popd || exit 1 > /dev/null
}

function buildAll() {
  for i in "${PACKAGES[@]}"
  do
    buildPackage "$i"
  done
}

# build individual packages
for i in "${PACKAGES[@]}"
do
  if [[ "$i" == "$MODULE" ]]; then
    buildPackage "$MODULE"
    exit 0
  fi
done

# build all packages
buildAll
