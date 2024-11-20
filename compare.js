import fs from "node:fs";
import path from "node:path";
import xxhash from "xxhash-wasm";

(async () => {
  try {
    const { create64 } = await xxhash();
    const list = [];
    const files = getFilesRecursively("./rof").reduce(
      (acc, f) => ({ ...acc, [f]: generateFileHashSync(create64, path.join("rof", f)) }),
      {}
    );
    for (const f of getFilesRecursively("c:/eq/everquest_rof2")) {
      if (files[f]) {
        const hash = generateFileHashSync(create64, path.join("c:/eq/everquest_rof2", f));
        if (hash === files[f]) {
          list.push(f);
        }
      }
    }
    for (const f of list) {
        fs.unlinkSync(path.join('rof', f));
        console.log(`Deleting ${f}`);
    }
  } catch (error) {
    console.error("Error generating hash:", error);
  }
})();

/**
 *
 * @param {import('xxhash-wasm').XXHashAPI.create64} create64
 * @param {string} filePath
 * @returns
 */
function generateFileHashSync(create64, fp) {
  const hasher = create64();
  const bufferSize = 4096;
  const fileDescriptor = fs.openSync(fp, "r");
  const buffer = Buffer.alloc(bufferSize);

  try {
    let bytesRead;
    do {
      bytesRead = fs.readSync(fileDescriptor, buffer, 0, bufferSize, null);
      hasher.update(buffer.slice(0, bytesRead));
    } while (bytesRead > 0);

    const hash = hasher.digest();
    return hash.toString(16).toUpperCase().padStart(16, "0")
  } catch (err) {
    console.error(`Failed to process file: ${filePath}`, err);
    return "";
  } finally {
    fs.closeSync(fileDescriptor);
  }
}

function getFilesRecursively(startFolder) {
  const result = [];
  function readDirRecursive(currentFolder) {
    const entries = fs.readdirSync(currentFolder, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentFolder, entry.name);
      if (entry.isDirectory()) {
        readDirRecursive(fullPath);
      } else if (entry.isFile()) {
        const relativePath = path
          .relative(startFolder, fullPath)
          .replace(/\\/g, "/");
        result.push(relativePath);
      }
    }
  }
  readDirRecursive(startFolder);
  return result;
}
