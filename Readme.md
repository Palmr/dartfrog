# dartfrog
Attempt at making a SQL tool to replace toad.
Focusing mostly on Oracle and having good XML support as that's what we do mostly at Fivium.

# Build / Install info
## Requirements
- nw.js (0.12.2 currently, windows x64)
- node.js (0.12.7 windows x64 - with npm 2.11.3 checked as you install it)
- Visual Studio 2012 x64 (on windows, for the node java module)
- Python 2.7 (for the node java module)
- JDK (I'm using 1.8 x64 windows and it seems to work?)
## Method
Enter folder and type `npm install` to install the node modules.
Then we need to re-install the java sub-module of the jdbc module, so:

- `cd node_modules\jdbc\node_modules\java\`
- `npm install -g nw-gyp` (if nw-gyp not already installed)
- `nw-gyp configure --target=0.12.2`
- This seems to only work with VS2012?
- I also had to hack Hotr\node_modules\jdbc\node_modules\java\node_modules\nan\nan.h to remove references to `ExternalAsciiStringResource` as nw.js doesn't seem to have this, at least not in the 0.12.2 version. Unknown what the consequences will be currently!
- The modified header should mean that you can nw-gyp configure and build. Perhaps try cleaning and removing and then configure/build again?
- When it eventually worked I also had to manually make a json file pointing to my jdk
- See files in the 'npm-compile-hacks' folder for reference


# TODO
- Sort out the CSS
- Look in to plugin-ifying
- Look at connection pooling
- Statement parsing from codemirror
- Check for open transactions to highlight uncommited data
- Modify/wrap the jdbc module to add proper XML support
- Spatial data? Very much a nice to have
- Intellisense/autocomplete would be a good feature to try and demo
- Mustache template goodness for the rendering of common features (like results)
- Mock up a simple schema browser with some user_* views and describes
