import fs from "fs";
import appJson from "../app.json";

const versionName = appJson.expo.version;
const versionCode = appJson.expo.android?.versionCode || 1;

const content = `VERSION_NAME=${versionName}
VERSION_CODE=${versionCode}
`;

fs.writeFileSync("android/version.properties", content);
console.log("✅ version.properties generado desde app.json");
