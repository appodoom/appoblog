import fs from "fs";
export function cleanupTempFiles(files: any[]) {
  files.forEach((file) => {
    fs.unlinkSync(file.path);
  });
}
