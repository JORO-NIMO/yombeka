const fs = require('fs');
const path = require('path');

const unusedFrontendDir = path.join(__dirname, '../src');
const publicDir = path.join(__dirname, '../public');

// Function to remove unused frontend files
function removeUnusedFrontend() {
    fs.rm(unusedFrontendDir, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error(`Error removing unused frontend files: ${err}`);
            return;
        }
        console.log('Unused frontend files removed successfully.');
    });
}

// Function to wire CRA build to public directory
function wireCRAtoPublic() {
    const buildDir = path.join(__dirname, '../build');
    const indexFile = path.join(buildDir, 'index.html');

    fs.copyFile(indexFile, path.join(publicDir, 'index.html'), (err) => {
        if (err) {
            console.error(`Error wiring CRA build to public: ${err}`);
            return;
        }
        console.log('CRA build wired to public directory successfully.');
    });
}

// Execute the functions
removeUnusedFrontend();
wireCRAtoPublic();