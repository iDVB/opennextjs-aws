import fs from "node:fs";
import path from "node:path";
import type {
  FunctionsConfigManifest,
  MiddlewareManifest,
  NextConfig,
  PrerenderManifest,
  RoutesManifest,
} from "types/next-types";

import type { PublicFiles } from "../../build";

export function loadConfig(nextDir: string) {
  const filePath = path.join(nextDir, "required-server-files.json");
  const json = fs.readFileSync(filePath, "utf-8");
  const { config } = JSON.parse(json);
  return config as NextConfig;
}
export function loadBuildId(nextDir: string) {
  const filePath = path.join(nextDir, "BUILD_ID");
  return fs.readFileSync(filePath, "utf-8").trim();
}

export function loadPagesManifest(nextDir: string) {
  const filePath = path.join(nextDir, "server/pages-manifest.json");
  const json = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(json) as Record<string, string>;
}

export function loadHtmlPages(nextDir: string) {
  return Object.entries(loadPagesManifest(nextDir))
    .filter(([_, value]) => (value as string).endsWith(".html"))
    .map(([key]) => key);
}

export function loadPublicAssets(openNextDir: string) {
  const filePath = path.join(openNextDir, "public-files.json");
  const json = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(json) as PublicFiles;
}

export function loadRoutesManifest(nextDir: string) {
  const filePath = path.join(nextDir, "routes-manifest.json");
  const json = fs.readFileSync(filePath, "utf-8");
  const routesManifest = JSON.parse(json) as RoutesManifest;

  const _dataRoutes = routesManifest.dataRoutes ?? [];
  const dataRoutes = {
    static: _dataRoutes.filter((r) => r.routeKeys === undefined),
    dynamic: _dataRoutes.filter((r) => r.routeKeys !== undefined),
  };

  return {
    basePath: routesManifest.basePath,
    rewrites: Array.isArray(routesManifest.rewrites)
      ? { beforeFiles: [], afterFiles: routesManifest.rewrites, fallback: [] }
      : {
          beforeFiles: routesManifest.rewrites.beforeFiles ?? [],
          afterFiles: routesManifest.rewrites.afterFiles ?? [],
          fallback: routesManifest.rewrites.fallback ?? [],
        },
    redirects: routesManifest.redirects ?? [],
    routes: {
      static: routesManifest.staticRoutes ?? [],
      dynamic: routesManifest.dynamicRoutes ?? [],
      data: dataRoutes,
    },
    locales: routesManifest.i18n?.locales ?? [],
  };
}

export function loadConfigHeaders(nextDir: string) {
  const filePath = path.join(nextDir, "routes-manifest.json");
  const json = fs.readFileSync(filePath, "utf-8");
  const routesManifest = JSON.parse(json) as RoutesManifest;
  return routesManifest.headers;
}

export function loadPrerenderManifest(nextDir: string) {
  const filePath = path.join(nextDir, "prerender-manifest.json");
  const json = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(json) as PrerenderManifest;
}

export function loadAppPathsManifest(nextDir: string) {
  const appPathsManifestPath = path.join(
    nextDir,
    "server/app-paths-manifest.json",
  );
  const appPathsManifestJson = fs.existsSync(appPathsManifestPath)
    ? fs.readFileSync(appPathsManifestPath, "utf-8")
    : "{}";
  return JSON.parse(appPathsManifestJson) as Record<string, string>;
}

export function loadAppPathRoutesManifest(
  nextDir: string,
): Record<string, string> {
  const appPathRoutesManifestPath = path.join(
    nextDir,
    "app-path-routes-manifest.json",
  );
  if (fs.existsSync(appPathRoutesManifestPath)) {
    return JSON.parse(fs.readFileSync(appPathRoutesManifestPath, "utf-8"));
  }
  return {};
}

export function loadAppPathsManifestKeys(nextDir: string) {
  const appPathsManifest = loadAppPathsManifest(nextDir);
  return Object.keys(appPathsManifest).map((key) => {
    // Remove parallel route
    let cleanedKey = key.replace(/\/@[^\/]+/g, "");

    // Remove group routes
    cleanedKey = cleanedKey.replace(/\/\((?!\.)[^\)]*\)/g, "");

    // Remove /page suffix
    cleanedKey = cleanedKey.replace(/\/page$/g, "");
    // We need to check if the cleaned key is empty because it means it's the root path
    return cleanedKey === "" ? "/" : cleanedKey;
  });
}

export function loadMiddlewareManifest(nextDir: string) {
  const filePath = path.join(nextDir, "server/middleware-manifest.json");
  const json = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(json) as MiddlewareManifest;
}

export function loadFunctionsConfigManifest(nextDir: string) {
  const filePath = path.join(nextDir, "server/functions-config-manifest.json");
  try {
    const json = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(json) as FunctionsConfigManifest;
  } catch (e) {
    return { functions: {}, version: 1 };
  }
}
