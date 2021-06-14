# evil-browser-toolkit
Scripts to augment the devtools for fuzzing and such

# Notes:
 - LoadWordList won't work in firefox in its current form, due to security controls. Works fine in Chromium.
 - There's no programmatic enforcement against fuzzing both the body and URL parameters, but they will probably parallelize regardless of config
