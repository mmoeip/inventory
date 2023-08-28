#!/bin/bash

# Display help information
display_help() {
    echo "Usage: $0 [option]"
    echo
    echo "Options:"
    echo "  --dry-run     Display the commands that would be executed without actually executing them."
    echo "  --help        Display this help message."
    exit 1
}

# Check for provided flags
DRY_RUN=""
if [ "$1" == "--dry-run" ]; then
    DRY_RUN="--dry-run"
    echo "Dry run mode activated!"
elif [ "$1" == "--help" ]; then
    display_help
elif [ -n "$1" ]; then
    echo "Invalid option: $1"
    display_help
fi

# Compile contracts using Hardhat
echo "Compiling contracts using Hardhat..."
npm run compile

# Check if git is initialized
if ! [ -d .git ]; then
    echo "Initializing git..."
    git init
fi

# Get the version from package.json
VERSION=$(jq -r .version package.json)

# Commit staged changes and tag with the version
echo "Committing staged changes and tagging with version $VERSION..."
git commit -m "Release v$VERSION" $DRY_RUN

# Handle git tag for dry run
if [ "$DRY_RUN" == "--dry-run" ]; then
    echo "[DRY RUN] git tag \"v$VERSION\""
else
    git tag "v$VERSION"
fi

# If it's a dry run, echo the npm publish command, else execute it
echo "Publishing to npm..."
if [ "$DRY_RUN" == "--dry-run" ]; then
    echo "npm publish --dry-run"
    npm publish --dry-run
else
    NPM_TOKEN=$NPM_TOKEN npm publish
fi

echo "Release completed!"