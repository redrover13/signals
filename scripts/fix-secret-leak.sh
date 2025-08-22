#!/bin/bash

# Script to clean up potential secret leaks in test_package_json.py
echo "Creating backup of the original file..."
cp /home/g_nelson/signals-1/tests/test_package_json.py /home/g_nelson/signals-1/tests/test_package_json.py.bak

# Replace any potential NPM tokens with template values
echo "Cleaning potential token patterns in line 202..."
sed -i '202s/[a-zA-Z0-9_-]\{30,\}/${NPM_TOKEN}/g' /home/g_nelson/signals-1/tests/test_package_json.py

echo "Verification after cleanup:"
npx secretlint /home/g_nelson/signals-1/tests/test_package_json.py

echo "If issues remain, please edit the file manually."
