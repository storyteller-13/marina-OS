#!/bin/bash
# Check for debug statements in staged JavaScript files

files=$(git diff --cached --name-only --diff-filter=ACM | grep -E "\.(js|jsx|ts|tsx)$" || true)

if [ -z "$files" ]; then
  exit 0
fi

for file in $files; do
  if git diff --cached "$file" | grep -E "^\+.*(console\.(log|debug)|debugger)" | grep -v "^+++" > /dev/null; then
    echo "Error: Debug statements found in $file. Please remove console.log/debugger before committing."
    exit 1
  fi
done

exit 0
