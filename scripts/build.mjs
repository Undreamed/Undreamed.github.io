import { spawn } from "node:child_process";
import { access, readFile, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const projectsRoot = resolve("projects");
const outputRoot = resolve("dist");

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function runWorkspaceBuild(workspaceName) {
  return new Promise((resolvePromise, reject) => {
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = spawn(npm, ["run", "build", "--workspace", workspaceName], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`Build failed for ${workspaceName} (exit ${code}).`));
      }
    });
  });
}

const entries = (await readdir(projectsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name));

if (entries.length === 0) {
  throw new Error("Add at least one project under projects/<slug>.");
}

await rm(outputRoot, { recursive: true, force: true });

for (const entry of entries) {
  const slug = entry.name;
  const projectRoot = resolve(projectsRoot, slug);
  const packagePath = resolve(projectRoot, "package.json");

  if (!slugPattern.test(slug)) {
    throw new Error(`Invalid project slug "${slug}". Use lowercase letters, numbers, and hyphens.`);
  }

  if (!(await exists(packagePath))) {
    throw new Error(`Missing ${packagePath}.`);
  }

  const projectPackage = JSON.parse(await readFile(packagePath, "utf8"));
  if (!projectPackage.name || !projectPackage.scripts?.build) {
    throw new Error(`${packagePath} needs a package name and a build script.`);
  }

  await runWorkspaceBuild(projectPackage.name);

  const indexPath = resolve(outputRoot, slug, "index.html");
  if (!(await exists(indexPath))) {
    throw new Error(`${projectPackage.name} must emit dist/${slug}/index.html.`);
  }
}

console.log(`Built ${entries.length} project(s).`);
