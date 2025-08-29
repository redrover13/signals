#!/bin/bash

# Script to fix indentation issue in codeql.yml
# This script fixes the indentation of the 'Setup pnpm cache' step in the codeql.yml file

echo "Fixing indentation in codeql.yml file..."

# Create a temporary file
temp_file=$(mktemp)

# Use awk to fix the indentation issue
awk '
{
  # Check if we are in the problematic section
  if ($0 ~ /- name: Setup pnpm cache/) {
    # This line and the following lines should be indented with 6 spaces
    print "    " $0;
    in_section = 1;
  } else if (in_section && $0 ~ /^[ ]*uses:/) {
    print "    " $0;
  } else if (in_section && $0 ~ /^[ ]*with:/) {
    print "    " $0;
  } else if (in_section && $0 ~ /^[ ]*path:/) {
    print "      " $0;
  } else if (in_section && $0 ~ /^[ ]*key:/) {
    print "      " $0;
  } else if (in_section && $0 ~ /^[ ]*restore-keys:/) {
    print "      " $0;
  } else if (in_section && $0 ~ /^[ ]*\$\{\{/) {
    print "        " $0;
  } else if (in_section && $0 ~ /^[ ]*config-file:/) {
    # End of the section
    print "    " $0;
    in_section = 0;
  } else {
    # Print the line as-is
    print $0;
  }
}
' /home/g_nelson/signals-1/.github/workflows/codeql.yml > "$temp_file"

# Replace the original file with the fixed one
cp "$temp_file" /home/g_nelson/signals-1/.github/workflows/codeql.yml

# Remove the temporary file
rm "$temp_file"

echo "Fixed indentation in codeql.yml file."
