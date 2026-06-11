const path = require("path");

async function detectWorkspaceContext(vscode) {
  if (!vscode || !vscode.workspace) {
    return emptyContext();
  }

  const folders = vscode.workspace.workspaceFolders || [];
  const fileNames = await findWorkspaceFiles(vscode);
  const activeFile = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.fileName : "";

  return buildContext({
    rootNames: folders.map((folder) => folder.name),
    fileNames,
    activeFile
  });
}

function detectContextFromFileList(fileNames, activeFile = "") {
  return buildContext({
    rootNames: [],
    fileNames,
    activeFile
  });
}

async function findWorkspaceFiles(vscode) {
  const uris = await vscode.workspace.findFiles("**/*", "{**/node_modules/**,**/.git/**,**/bin/**,**/obj/**,**/dist/**,**/build/**}", 300);
  return uris.map((uri) => uri.fsPath || uri.path);
}

function buildContext({ rootNames, fileNames, activeFile }) {
  const names = fileNames.map((file) => file.replace(/\\/g, "/").toLowerCase());
  const extensions = new Set(names.map((file) => path.extname(file)));

  const languages = [];
  if (extensions.has(".cs")) languages.push("C#");
  if (extensions.has(".ts") || extensions.has(".tsx")) languages.push("TypeScript");
  if (extensions.has(".js") || extensions.has(".jsx")) languages.push("JavaScript");
  if (extensions.has(".py")) languages.push("Python");
  if (extensions.has(".go")) languages.push("Go");
  if (extensions.has(".java")) languages.push("Java");

  const frameworks = [];
  if (names.some((file) => file.endsWith("package.json"))) frameworks.push("Node.js");
  if (names.some((file) => file.includes("vite.config"))) frameworks.push("Vite");
  if (names.some((file) => file.includes("next.config"))) frameworks.push("Next.js");
  if (names.some((file) => file.endsWith(".csproj"))) frameworks.push(".NET");
  if (names.some((file) => file.includes("pom.xml"))) frameworks.push("Maven/Java");

  const databases = [];
  if (names.some((file) => file.includes("postgres") || file.includes("pgsql"))) databases.push("PostgreSQL");
  if (names.some((file) => file.includes("mysql"))) databases.push("MySQL");
  if (names.some((file) => file.includes("redis"))) databases.push("Redis");
  if (names.some((file) => file.includes("mongo"))) databases.push("MongoDB");

  const cloud = [];
  if (names.some((file) => file.includes("aws") || file.includes("cloudformation"))) cloud.push("AWS");
  if (names.some((file) => file.includes("azure"))) cloud.push("Azure");
  if (names.some((file) => file.includes("gcp") || file.includes("google-cloud"))) cloud.push("GCP");

  return {
    workspaceNames: rootNames,
    activeFile,
    languages,
    frameworks,
    databases,
    cloud,
    hasDocker: names.some((file) => file.endsWith("dockerfile") || file.includes("docker-compose")),
    hasKubernetes: names.some((file) => file.includes("k8s") || file.includes("kubernetes") || file.endsWith("deployment.yaml")),
    hasCi: names.some((file) => file.includes(".github/workflows") || file.includes("azure-pipelines") || file.includes(".gitlab-ci"))
  };
}

function emptyContext() {
  return {
    workspaceNames: [],
    activeFile: "",
    languages: [],
    frameworks: [],
    databases: [],
    cloud: [],
    hasDocker: false,
    hasKubernetes: false,
    hasCi: false
  };
}

module.exports = {
  detectWorkspaceContext,
  detectContextFromFileList,
  emptyContext
};
